using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using INTEX_II.Data;
using INTEX_II.Models;
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
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;

    public SocialMediaController(AppDbContext db, IHttpClientFactory httpFactory, IConfiguration config)
    {
        _db = db;
        _httpFactory = httpFactory;
        _config = config;
    }

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

    // POST /api/social-media/publish
    [HttpPost("publish")]
    public async Task<IActionResult> Publish([FromBody] PublishRequestDto req)
    {
        // Validate
        if (string.IsNullOrWhiteSpace(req.Caption))
            return BadRequest(new { error = "Caption is required." });

        var publishable = req.Platforms.Where(p => p is "Facebook" or "Instagram" or "Twitter").ToArray();
        if (publishable.Length == 0 && req.Platforms.All(p => p is "LinkedIn"))
        {
            // All preview-only — return preview_only for each
            return Ok(new
            {
                results = req.Platforms.Select(p => new PlatformResult(p, "preview_only", null, null, null)).ToArray()
            });
        }

        if (req.MediaType != "Text" && string.IsNullOrWhiteSpace(req.MediaUrl) && (req.MediaUrls == null || req.MediaUrls.Length == 0))
            return BadRequest(new { error = "Media URL is required for non-text posts." });

        if (req.MediaType == "Carousel" && (req.MediaUrls == null || req.MediaUrls.Length < 2))
            return BadRequest(new { error = "Carousel requires at least 2 media URLs in mediaUrls." });

        // Check Meta config
        var version = _config["Meta:GraphApiVersion"] ?? "v21.0";
        var pageToken = _config["Meta:FacebookPageAccessToken"] ?? "";
        var pageId = _config["Meta:FacebookPageId"] ?? "";
        var igAccountId = _config["Meta:InstagramBusinessAccountId"] ?? "";

        bool fbConfigured = !string.IsNullOrWhiteSpace(pageToken) && !string.IsNullOrWhiteSpace(pageId);
        bool igConfigured = fbConfigured && !string.IsNullOrWhiteSpace(igAccountId);

        if (!fbConfigured && req.Platforms.Any(p => p is "Facebook"))
            return StatusCode(503, new { error = "Facebook not configured. Add FacebookPageAccessToken and FacebookPageId to app settings." });

        if (!igConfigured && req.Platforms.Any(p => p is "Instagram"))
            return StatusCode(503, new { error = "Instagram not configured. Add InstagramBusinessAccountId to app settings." });

        var results = new List<PlatformResult>();
        var http = _httpFactory.CreateClient("Meta");
        var now = DateTime.UtcNow;
        var hashtagString = string.Join(" ", req.Hashtags.Select(h => h.StartsWith('#') ? h : $"#{h}"));
        var fullCaption = req.Caption + (hashtagString.Length > 0 ? $"\n\n{hashtagString}" : "");

        // Twitter config
        var twitterConsumerKey    = _config["Twitter:ConsumerKey"] ?? "";
        var twitterConsumerSecret = _config["Twitter:ConsumerSecret"] ?? "";
        var twitterAccessToken    = _config["Twitter:AccessToken"] ?? "";
        var twitterAccessSecret   = _config["Twitter:AccessTokenSecret"] ?? "";
        bool twitterConfigured = !string.IsNullOrWhiteSpace(twitterConsumerKey)
            && !string.IsNullOrWhiteSpace(twitterConsumerSecret)
            && !string.IsNullOrWhiteSpace(twitterAccessToken)
            && !string.IsNullOrWhiteSpace(twitterAccessSecret);

        foreach (var platform in req.Platforms)
        {
            if (platform == "LinkedIn")
            {
                results.Add(new PlatformResult(platform, "preview_only", null, null, null));
                continue;
            }

            try
            {
                if (platform == "Facebook")
                {
                    string fbUrl;
                    var fbBody = new Dictionary<string, string>
                    {
                        ["access_token"] = pageToken,
                    };

                    if (!string.IsNullOrWhiteSpace(req.MediaUrl) && req.MediaType != "Text")
                    {
                        // Photo post — use /photos endpoint
                        fbUrl = $"https://graph.facebook.com/{version}/{pageId}/photos";
                        fbBody["url"] = req.MediaUrl;
                        fbBody["caption"] = fullCaption;
                    }
                    else
                    {
                        // Text-only post — use /feed endpoint
                        fbUrl = $"https://graph.facebook.com/{version}/{pageId}/feed";
                        fbBody["message"] = fullCaption;
                    }

                    var fbRes = await http.PostAsync(fbUrl, new FormUrlEncodedContent(fbBody));
                    var fbJson = await fbRes.Content.ReadFromJsonAsync<JsonElement>();

                    if (!fbRes.IsSuccessStatusCode)
                    {
                        var errMsg = ParseMetaError(fbJson);
                        results.Add(new PlatformResult("Facebook", "failed", null, null, errMsg));
                        continue;
                    }

                    var postId = fbJson.TryGetProperty("post_id", out var pid)
                        ? pid.GetString() ?? ""
                        : fbJson.GetProperty("id").GetString() ?? "";
                    var permalink = $"https://www.facebook.com/{postId.Replace("_", "/posts/")}";

                    await SavePost(platform, postId, permalink, req, now);
                    results.Add(new PlatformResult("Facebook", "published", postId, permalink, null));
                }
                else if (platform == "Instagram")
                {
                    string containerId;

                    if (req.MediaType == "Carousel")
                    {
                        // Step 1: create child containers
                        var childIds = new List<string>();
                        foreach (var url in req.MediaUrls!)
                        {
                            var childBody = new Dictionary<string, string>
                            {
                                ["image_url"] = url,
                                ["is_carousel_item"] = "true",
                                ["access_token"] = pageToken,
                            };
                            var childRes = await http.PostAsync(
                                $"https://graph.facebook.com/{version}/{igAccountId}/media",
                                new FormUrlEncodedContent(childBody));
                            var childJson = await childRes.Content.ReadFromJsonAsync<JsonElement>();
                            if (!childRes.IsSuccessStatusCode)
                            {
                                results.Add(new PlatformResult("Instagram", "failed", null, null, ParseMetaError(childJson)));
                                goto nextPlatform;
                            }
                            childIds.Add(childJson.GetProperty("id").GetString()!);
                        }

                        // Step 2: create carousel container
                        var carouselBody = new Dictionary<string, string>
                        {
                            ["media_type"] = "CAROUSEL",
                            ["children"] = string.Join(",", childIds),
                            ["caption"] = fullCaption,
                            ["access_token"] = pageToken,
                        };
                        var carRes = await http.PostAsync(
                            $"https://graph.facebook.com/{version}/{igAccountId}/media",
                            new FormUrlEncodedContent(carouselBody));
                        var carJson = await carRes.Content.ReadFromJsonAsync<JsonElement>();
                        if (!carRes.IsSuccessStatusCode)
                        {
                            results.Add(new PlatformResult("Instagram", "failed", null, null, ParseMetaError(carJson)));
                            goto nextPlatform;
                        }
                        containerId = carJson.GetProperty("id").GetString()!;
                    }
                    else
                    {
                        // Single image/video container
                        var mediaBody = new Dictionary<string, string>
                        {
                            ["caption"] = fullCaption,
                            ["access_token"] = pageToken,
                        };

                        if (req.MediaType == "Video" || req.MediaType == "Reel")
                        {
                            mediaBody["media_type"] = req.MediaType == "Reel" ? "REELS" : "VIDEO";
                            mediaBody["video_url"] = req.MediaUrl!;
                        }
                        else
                        {
                            mediaBody["image_url"] = req.MediaUrl!;
                        }

                        if (!string.IsNullOrWhiteSpace(req.AltText))
                            mediaBody["alt_text"] = req.AltText;

                        var mediaRes = await http.PostAsync(
                            $"https://graph.facebook.com/{version}/{igAccountId}/media",
                            new FormUrlEncodedContent(mediaBody));
                        var mediaJson = await mediaRes.Content.ReadFromJsonAsync<JsonElement>();
                        if (!mediaRes.IsSuccessStatusCode)
                        {
                            results.Add(new PlatformResult("Instagram", "failed", null, null, ParseMetaError(mediaJson)));
                            goto nextPlatform;
                        }
                        containerId = mediaJson.GetProperty("id").GetString()!;
                    }

                    // Poll container status
                    for (int attempt = 0; attempt < 5; attempt++)
                    {
                        await Task.Delay(1000);
                        var statusRes = await http.GetAsync(
                            $"https://graph.facebook.com/{version}/{containerId}?fields=status_code&access_token={pageToken}");
                        var statusJson = await statusRes.Content.ReadFromJsonAsync<JsonElement>();
                        if (statusJson.TryGetProperty("status_code", out var sc))
                        {
                            var code = sc.GetString();
                            if (code == "FINISHED") break;
                            if (code is "ERROR" or "EXPIRED")
                            {
                                results.Add(new PlatformResult("Instagram", "failed", null, null, $"Container status: {code}"));
                                goto nextPlatform;
                            }
                        }
                    }

                    // Publish container
                    var publishBody = new Dictionary<string, string>
                    {
                        ["creation_id"] = containerId,
                        ["access_token"] = pageToken,
                    };
                    var pubRes = await http.PostAsync(
                        $"https://graph.facebook.com/{version}/{igAccountId}/media_publish",
                        new FormUrlEncodedContent(publishBody));
                    var pubJson = await pubRes.Content.ReadFromJsonAsync<JsonElement>();
                    if (!pubRes.IsSuccessStatusCode)
                    {
                        results.Add(new PlatformResult("Instagram", "failed", null, null, ParseMetaError(pubJson)));
                        goto nextPlatform;
                    }

                    var igPostId = pubJson.GetProperty("id").GetString() ?? "";
                    var igPermalink = $"https://www.instagram.com/p/{igPostId}/";

                    await SavePost(platform, igPostId, igPermalink, req, now);
                    results.Add(new PlatformResult("Instagram", "published", igPostId, igPermalink, null));
                }
                else if (platform == "Twitter")
                {
                    if (!twitterConfigured)
                    {
                        results.Add(new PlatformResult("Twitter", "failed", null, null, "Twitter API not configured. Add keys to app settings."));
                        goto nextPlatform;
                    }

                    // Build tweet text — truncate to 280 chars
                    var hashtagsForTweet = req.Hashtags.Take(2).Select(h => h.StartsWith('#') ? h : $"#{h}");
                    var tweetText = req.Caption.Length > 240
                        ? req.Caption[..240] + "…"
                        : req.Caption;
                    if (hashtagsForTweet.Any())
                        tweetText += " " + string.Join(" ", hashtagsForTweet);
                    if (tweetText.Length > 280)
                        tweetText = tweetText[..279] + "…";

                    var (tweetId, tweetError) = await PostTweetAsync(
                        tweetText,
                        twitterConsumerKey, twitterConsumerSecret,
                        twitterAccessToken, twitterAccessSecret);

                    if (tweetError != null)
                    {
                        results.Add(new PlatformResult("Twitter", "failed", null, null, tweetError));
                        goto nextPlatform;
                    }

                    var tweetPermalink = $"https://x.com/i/web/status/{tweetId}";
                    await SavePost(platform, tweetId!, tweetPermalink, req, now);
                    results.Add(new PlatformResult("Twitter", "published", tweetId, tweetPermalink, null));
                }
            }
            catch (Exception ex)
            {
                results.Add(new PlatformResult(platform, "failed", null, null, $"Unexpected error: {ex.Message}"));
            }

            nextPlatform:;
        }

        return Ok(new { results });
    }

    // ── Twitter OAuth 1.0a ────────────────────────────────────────────────────

    private async Task<(string? tweetId, string? error)> PostTweetAsync(
        string text,
        string consumerKey, string consumerSecret,
        string accessToken, string accessTokenSecret)
    {
        const string url = "https://api.twitter.com/2/tweets";

        var http = _httpFactory.CreateClient("Meta"); // reuse same factory
        var body = JsonSerializer.Serialize(new { text });
        var authHeader = BuildOAuth1Header("POST", url, consumerKey, consumerSecret, accessToken, accessTokenSecret);

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", authHeader);
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var res = await http.SendAsync(request);
        var json = await res.Content.ReadFromJsonAsync<JsonElement>();

        if (!res.IsSuccessStatusCode)
        {
            var detail = json.TryGetProperty("detail", out var d) ? d.GetString() :
                         json.TryGetProperty("title", out var t) ? t.GetString() : "Unknown Twitter error";
            return (null, $"Twitter error: {detail}");
        }

        var tweetId = json.GetProperty("data").GetProperty("id").GetString();
        return (tweetId, null);
    }

    private static string BuildOAuth1Header(
        string method, string url,
        string consumerKey, string consumerSecret,
        string accessToken, string accessTokenSecret)
    {
        var nonce = Guid.NewGuid().ToString("N");
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        var oauthParams = new SortedDictionary<string, string>
        {
            ["oauth_consumer_key"]     = consumerKey,
            ["oauth_nonce"]            = nonce,
            ["oauth_signature_method"] = "HMAC-SHA1",
            ["oauth_timestamp"]        = timestamp,
            ["oauth_token"]            = accessToken,
            ["oauth_version"]          = "1.0",
        };

        // Build signature base string
        var paramString = string.Join("&", oauthParams.Select(p =>
            $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}"));
        var baseString = $"{method}&{Uri.EscapeDataString(url)}&{Uri.EscapeDataString(paramString)}";

        // Sign
        var signingKey = $"{Uri.EscapeDataString(consumerSecret)}&{Uri.EscapeDataString(accessTokenSecret)}";
        using var hmac = new HMACSHA1(Encoding.ASCII.GetBytes(signingKey));
        var signature = Convert.ToBase64String(hmac.ComputeHash(Encoding.ASCII.GetBytes(baseString)));

        oauthParams["oauth_signature"] = signature;

        var headerValue = "OAuth " + string.Join(", ", oauthParams.Select(p =>
            $"{Uri.EscapeDataString(p.Key)}=\"{Uri.EscapeDataString(p.Value)}\""));

        return headerValue;
    }

    private static string ParseMetaError(JsonElement json)
    {
        try
        {
            if (json.TryGetProperty("error", out var err))
            {
                var code = err.TryGetProperty("code", out var c) ? c.GetInt32() : 0;
                var msg = err.TryGetProperty("message", out var m) ? m.GetString() ?? "" : "Unknown error";
                return code switch
                {
                    190 => "Access token expired. Please re-authenticate.",
                    10 => "Permission denied. Check your app permissions.",
                    32 or 17 => "Rate limit hit. Try again later.",
                    _ => $"Meta API error ({code}): {msg}"
                };
            }
        }
        catch { }
        return "Unknown Meta API error.";
    }

    private async Task SavePost(string platform, string postId, string postUrl,
        PublishRequestDto req, DateTime now)
    {
        var post = new SocialMediaPost
        {
            Platform = platform,
            PlatformPostId = postId,
            PostUrl = postUrl,
            CreatedAt = now,
            DayOfWeek = now.DayOfWeek.ToString(),
            PostHour = now.Hour,
            PostType = req.PostType ?? "Campaign",
            MediaType = req.MediaType,
            Caption = req.Caption,
            Hashtags = req.Hashtags.Length > 0
                ? string.Join(" ", req.Hashtags.Select(h => h.StartsWith('#') ? h : $"#{h}"))
                : null,
            NumHashtags = req.Hashtags.Length,
            HasCallToAction = req.HasCallToAction,
            CallToActionType = req.CallToActionType,
            FeaturesResidentStory = req.FeaturesResidentStory,
            CampaignName = req.CampaignName,
            SentimentTone = req.SentimentTone,
            CaptionLength = req.Caption.Length,
            // Analytics fields default to 0
            Impressions = 0,
            Reach = 0,
            Likes = 0,
            Comments = 0,
            Shares = 0,
            Saves = 0,
            ClickThroughs = 0,
            EngagementRate = 0,
            ProfileVisits = 0,
            DonationReferrals = 0,
            EstimatedDonationValuePhp = 0,
            FollowerCountAtPost = 0,
        };
        _db.SocialMediaPosts.Add(post);
        await _db.SaveChangesAsync();
    }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

public record PublishRequestDto(
    string[] Platforms,
    string Caption,
    string MediaType,
    string? MediaUrl,
    string[]? MediaUrls,
    string? AltText,
    string[] Hashtags,
    string? PostType,
    string? SentimentTone,
    bool HasCallToAction,
    string? CallToActionType,
    bool FeaturesResidentStory,
    string? CampaignName
);

public record PlatformResult(
    string Platform,
    string Status,
    string? ExternalPostId,
    string? Permalink,
    string? ErrorMessage
);
