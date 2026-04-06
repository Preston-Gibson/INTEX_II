namespace INTEX_II.Models;

public class SocialMediaPost
{
    public int PostId { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string PlatformPostId { get; set; } = string.Empty;
    public string PostUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public int PostHour { get; set; }
    public string PostType { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string? Hashtags { get; set; }
    public int? NumHashtags { get; set; }
    public int? MentionsCount { get; set; }
    public bool HasCallToAction { get; set; }
    public string? CallToActionType { get; set; }
    public string? ContentTopic { get; set; }
    public string? SentimentTone { get; set; }
    public int? CaptionLength { get; set; }
    public bool FeaturesResidentStory { get; set; }
    public string? CampaignName { get; set; }
    public bool IsBoosted { get; set; }
    public decimal? BoostBudgetPhp { get; set; }
    public int Impressions { get; set; }
    public int Reach { get; set; }
    public int Likes { get; set; }
    public int Comments { get; set; }
    public int Shares { get; set; }
    public int Saves { get; set; }
    public int ClickThroughs { get; set; }
    public int? VideoViews { get; set; }
    public decimal EngagementRate { get; set; }
    public int ProfileVisits { get; set; }
    public int DonationReferrals { get; set; }
    public decimal EstimatedDonationValuePhp { get; set; }
    public int FollowerCountAtPost { get; set; }
    public decimal? WatchTimeSeconds { get; set; }
    public decimal? AvgViewDurationSeconds { get; set; }
    public int? SubscriberCountAtPost { get; set; }
    public decimal? Forwards { get; set; }

    public ICollection<Donation> ReferralDonations { get; set; } = new List<Donation>();
}
