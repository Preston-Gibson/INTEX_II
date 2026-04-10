namespace INTEX_II.Models;

public class SocialMediaPrediction
{
    public int PostId { get; set; }
    public double ProbHasDonations { get; set; }
    public string DonationTier { get; set; } = string.Empty; // "Low" | "Medium" | "High"
    public double ProbEngagementLow { get; set; }
    public double ProbEngagementMedium { get; set; }
    public double ProbEngagementHigh { get; set; }
    public string PredictedEngagementTier { get; set; } = string.Empty;
    public DateTime ScoredAt { get; set; }
}
