using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Services;

/// <summary>
/// Computes a donation-probability score for a newly published social media post
/// using empirical donation rates from historical post data (Naive Bayes-style).
/// Writes/upserts the result to <c>social_media_predictions</c> (managed by EF migrations).
/// </summary>
public class SocialScoreService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SocialScoreService> _logger;

    public SocialScoreService(IServiceScopeFactory scopeFactory, ILogger<SocialScoreService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// Fire-and-forget: score the post in a background thread so publish latency
    /// is not affected.
    /// </summary>
    public void EnqueueScore(int postId) =>
        Task.Run(() => ScoreAsync(postId));

    private async Task ScoreAsync(int postId)
    {
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var post = await db.SocialMediaPosts.AsNoTracking()
                .FirstOrDefaultAsync(p => p.PostId == postId);
            if (post is null) return;

            var history = await db.SocialMediaPosts.AsNoTracking()
                .Where(p => p.PostId != postId)
                .ToListAsync();

            var (probDonation, donationTier) = ComputeDonationScore(post, history);
            var (probLow, probMed, probHigh, engTier) = ComputeEngagementScore(post, history);

            var prediction = new SocialMediaPrediction
            {
                PostId                    = postId,
                ProbHasDonations          = probDonation,
                DonationTier              = donationTier,
                ProbEngagementLow         = probLow,
                ProbEngagementMedium      = probMed,
                ProbEngagementHigh        = probHigh,
                PredictedEngagementTier   = engTier,
                PredictedHasDonations     = probDonation >= 0.5 ? 1 : 0,
                PredictionTs              = DateTime.UtcNow,
            };

            var existing = await db.SocialMediaPredictions.FindAsync(postId);
            if (existing is null)
                db.SocialMediaPredictions.Add(prediction);
            else
            {
                existing.ProbHasDonations          = prediction.ProbHasDonations;
                existing.DonationTier              = prediction.DonationTier;
                existing.ProbEngagementLow         = prediction.ProbEngagementLow;
                existing.ProbEngagementMedium      = prediction.ProbEngagementMedium;
                existing.ProbEngagementHigh        = prediction.ProbEngagementHigh;
                existing.PredictedEngagementTier   = prediction.PredictedEngagementTier;
                existing.PredictedHasDonations     = prediction.PredictedHasDonations;
                existing.PredictionTs            = prediction.PredictionTs;
            }

            await db.SaveChangesAsync();
            _logger.LogInformation("Scored post {PostId}: donation={Prob:P1} ({Tier})", postId, probDonation, donationTier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to score post {PostId}", postId);
        }
    }

    // ── Donation probability ─────────────────────────────────────────────────

    private static (double prob, string tier) ComputeDonationScore(
        SocialMediaPost post, List<SocialMediaPost> history)
    {
        if (history.Count == 0) return (0.1, "Low");

        double overall = DonationRate(history);

        double score = overall
            * LiftRatio(DonationRateWhere(history, p => p.PostType == post.PostType), overall)
            * LiftRatio(DonationRateWhere(history, p => p.SentimentTone == post.SentimentTone), overall)
            * LiftRatio(DonationRateWhere(history, p => p.PostHour == post.PostHour), overall)
            * LiftRatio(DonationRateWhere(history, p => p.DayOfWeek == post.DayOfWeek), overall)
            * LiftRatio(DonationRateWhere(history, p => p.MediaType == post.MediaType), overall);

        if (post.HasCallToAction)      score *= 1.15;
        if (post.FeaturesResidentStory) score *= 1.25;

        // Text-signal lifts
        int words = post.Caption.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        if (words >= 50 && words <= 150) score *= 1.08;   // sweet spot length
        if (post.Caption.Contains('!'))   score *= 1.05;
        if (post.Caption.Contains('?'))   score *= 1.03;
        if (HasUrl(post.Caption))         score *= 1.07;
        if (EmojiCount(post.Caption) > 0) score *= 1.04;

        score = Math.Clamp(score, 0.0, 1.0);
        string tier = score >= 0.6 ? "High" : score >= 0.3 ? "Medium" : "Low";
        return (score, tier);
    }

    // ── Engagement probability ───────────────────────────────────────────────

    private static (double low, double med, double high, string tier) ComputeEngagementScore(
        SocialMediaPost post, List<SocialMediaPost> history)
    {
        if (history.Count == 0) return (0.33, 0.34, 0.33, "Medium");

        // Assign engagement tier to each historical post using tertile thresholds
        var rates = history.Select(p => (double)p.EngagementRate).OrderBy(r => r).ToList();
        double q33 = Percentile(rates, 1.0 / 3.0);
        double q67 = Percentile(rates, 2.0 / 3.0);

        string Tier(double r) => r <= q33 ? "Low" : r <= q67 ? "Medium" : "High";
        var tiered = history.Select(p => Tier((double)p.EngagementRate)).ToList();
        int total = tiered.Count;

        // Prior from distribution
        double priorLow  = tiered.Count(t => t == "Low")    / (double)total;
        double priorMed  = tiered.Count(t => t == "Medium") / (double)total;
        double priorHigh = tiered.Count(t => t == "High")   / (double)total;

        // Apply same lift ratio for post type (most predictive structural feature)
        var byType = history.Zip(tiered).Where(x => x.First.PostType == post.PostType).ToList();
        if (byType.Count >= 3)
        {
            double typeTotal = byType.Count;
            priorLow  = byType.Count(x => x.Second == "Low")    / typeTotal;
            priorMed  = byType.Count(x => x.Second == "Medium") / typeTotal;
            priorHigh = byType.Count(x => x.Second == "High")   / typeTotal;
        }

        // Normalise to sum to 1
        double sum = priorLow + priorMed + priorHigh;
        if (sum == 0) { priorLow = priorMed = priorHigh = 1.0 / 3.0; }
        else { priorLow /= sum; priorMed /= sum; priorHigh /= sum; }

        string engTier = priorHigh >= priorMed && priorHigh >= priorLow ? "High"
                       : priorMed  >= priorLow ? "Medium" : "Low";

        return (priorLow, priorMed, priorHigh, engTier);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static double DonationRate(List<SocialMediaPost> posts) =>
        posts.Count == 0 ? 0.1 : posts.Count(p => p.DonationReferrals > 0) / (double)posts.Count;

    private static double DonationRateWhere(List<SocialMediaPost> posts,
        Func<SocialMediaPost, bool> predicate)
    {
        var subset = posts.Where(predicate).ToList();
        // Laplace smoothing: add 1 positive and 1 negative pseudo-count
        return (subset.Count(p => p.DonationReferrals > 0) + 1.0) / (subset.Count + 2.0);
    }

    /// Lift ratio clamped to [0.5, 2.0] to prevent extreme values from tiny samples.
    private static double LiftRatio(double featureRate, double baseRate) =>
        baseRate <= 0 ? 1.0 : Math.Clamp(featureRate / baseRate, 0.5, 2.0);

    private static double Percentile(List<double> sorted, double p)
    {
        int idx = (int)Math.Floor(p * (sorted.Count - 1));
        return sorted[Math.Clamp(idx, 0, sorted.Count - 1)];
    }

    private static bool HasUrl(string text) =>
        text.Contains("http://", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("https://", StringComparison.OrdinalIgnoreCase);

    private static int EmojiCount(string text) =>
        text.Count(c => c > '\uF000' || (c >= '\u2600' && c <= '\u27BF'));
}
