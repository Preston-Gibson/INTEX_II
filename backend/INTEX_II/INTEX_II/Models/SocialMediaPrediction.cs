namespace INTEX_II.Models;

/// <summary>
/// Shared by batch ML (<c>pipeline/jobs/inference_social.py</c>) and post-publish heuristic scoring.
/// Lives in <c>public.social_media_predictions</c> (same as EF migrations).
/// </summary>
public class SocialMediaPrediction
{
    public int PostId { get; set; }

    public string? PredictedEngagementTier { get; set; }
    public double? ProbEngagementLow { get; set; }
    public double? ProbEngagementMedium { get; set; }
    public double? ProbEngagementHigh { get; set; }

    /// <summary>0/1 from sklearn batch job; heuristic scorer sets from <see cref="ProbHasDonations"/>.</summary>
    public int? PredictedHasDonations { get; set; }

    public double ProbHasDonations { get; set; }

    /// <summary>Heuristic tier after publish; optional for ML-only rows.</summary>
    public string? DonationTier { get; set; }

    public DateTime PredictionTs { get; set; }
}
