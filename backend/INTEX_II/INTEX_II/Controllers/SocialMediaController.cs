using INTEX_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[ApiController]
[Route("api/social-media")]
[Authorize(Roles = "Admin")]
public class SocialMediaController : ControllerBase
{
    private readonly AppDbContext _db;

    public SocialMediaController(AppDbContext db) => _db = db;

    // GET /api/social-media/insights
    // Computes aggregate statistics from the social_media_posts table.
    // All scoring weights are derived from real data — nothing hardcoded.
    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights()
    {
        var posts = await _db.SocialMediaPosts.AsNoTracking().ToListAsync();

        if (posts.Count == 0)
            return Ok(new { totalPosts = 0 });

        double overall = posts.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0);

        // Per-dimension donation conversion rates
        var platformRates = posts
            .GroupBy(p => p.Platform)
            .ToDictionary(
                g => g.Key,
                g => g.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0));

        var postTypeRates = posts
            .GroupBy(p => p.PostType)
            .ToDictionary(
                g => g.Key,
                g => g.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0));

        var mediaTypeRates = posts
            .GroupBy(p => p.MediaType)
            .ToDictionary(
                g => g.Key,
                g => g.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0));

        var dayRates = posts
            .GroupBy(p => p.DayOfWeek)
            .ToDictionary(
                g => g.Key,
                g => g.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0));

        var hourRates = posts
            .GroupBy(p => p.PostHour)
            .ToDictionary(
                g => g.Key,
                g => g.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0));

        var hashtagEngagementRates = posts
            .Where(p => p.NumHashtags.HasValue)
            .GroupBy(p => p.NumHashtags!.Value)
            .ToDictionary(
                g => g.Key,
                g => g.Average(p => (double)p.EngagementRate));

        var sentimentToneRates = posts
            .Where(p => p.SentimentTone != null)
            .GroupBy(p => p.SentimentTone!)
            .ToDictionary(
                g => g.Key,
                g => g.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0));

        // Resident story lift
        var withStory = posts.Where(p => p.FeaturesResidentStory).ToList();
        var withoutStory = posts.Where(p => !p.FeaturesResidentStory).ToList();
        double residentStoryRate = withStory.Count > 0
            ? withStory.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0) : 0;
        double noResidentStoryRate = withoutStory.Count > 0
            ? withoutStory.Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0) : 0;

        // CTA lift
        double ctaWithRate = posts.Where(p => p.HasCallToAction).Any()
            ? posts.Where(p => p.HasCallToAction).Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0) : 0;
        double ctaWithoutRate = posts.Where(p => !p.HasCallToAction).Any()
            ? posts.Where(p => !p.HasCallToAction).Average(p => p.DonationReferrals > 0 ? 1.0 : 0.0) : 0;

        // Best values
        var bestPlatform = platformRates.OrderByDescending(x => x.Value).First();
        var bestHour = hourRates.OrderByDescending(x => x.Value).First();
        var bestDay = dayRates.OrderByDescending(x => x.Value).First();
        var optimalHashtag = hashtagEngagementRates.OrderByDescending(x => x.Value).First();
        var bestPostType = postTypeRates.OrderByDescending(x => x.Value).First();
        var bestMediaType = mediaTypeRates.OrderByDescending(x => x.Value).First();
        var bestTone = sentimentToneRates.OrderByDescending(x => x.Value).First();

        return Ok(new
        {
            totalPosts = posts.Count,
            overallDonationRate = overall,

            // Top-line benchmarks (for the insights panel)
            bestPlatform = bestPlatform.Key,
            bestPlatformRate = bestPlatform.Value,
            bestHour = bestHour.Key,
            bestHourRate = bestHour.Value,
            bestDay = bestDay.Key,
            bestDayRate = bestDay.Value,
            optimalHashtagCount = optimalHashtag.Key,
            optimalHashtagEngagement = optimalHashtag.Value,
            bestPostType = bestPostType.Key,
            bestPostTypeRate = bestPostType.Value,
            bestMediaType = bestMediaType.Key,
            bestMediaTypeRate = bestMediaType.Value,
            bestSentimentTone = bestTone.Key,
            bestSentimentToneRate = bestTone.Value,

            residentStoryDonationRate = residentStoryRate,
            noResidentStoryDonationRate = noResidentStoryRate,
            residentStoryPctOfPosts = withStory.Count * 100.0 / posts.Count,

            ctaWithDonationRate = ctaWithRate,
            ctaWithoutDonationRate = ctaWithoutRate,

            // Full dimension maps (for frontend scoring)
            platformRates,
            postTypeRates,
            mediaTypeRates,
            dayRates,
            hourRates,
            hashtagEngagementRates,
            sentimentToneRates
        });
    }
}
