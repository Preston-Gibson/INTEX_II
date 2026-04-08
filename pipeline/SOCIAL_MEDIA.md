# Lighthouse Sanctuary — ML Pipeline

Predicts social media engagement and donation likelihood for posts before they are published. Powers the Social Media Composer and Analytics pages in the admin dashboard.

---

## What It Does

Two machine learning models are trained on 812 historical social media posts:

| Model | Predicts | Accuracy |
|---|---|---|
| Engagement Tier | Low / Medium / High engagement | 63.5% |
| Donation Conversion | Will this post drive donations? (Yes/No + probability) | 78.8% | 

Results are stored in `operational.social_media_predictions` and queried by the backend API.

---

## Pipeline Setup

### 1. Create the virtual environment
```bash
cd pipeline
/opt/homebrew/opt/python@3.12/libexec/bin/python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 2. Create `pipeline/.env` (never commit this file)
```
PG_HOST=aws-1-us-east-1.pooler.supabase.com
PG_PORT=5432
PG_DB=postgres
PG_USER=postgres.<your-project-ref>
PG_PASSWORD=<your-supabase-password>
```

### 3. Run the pipeline
```bash
cd pipeline
.venv/bin/python jobs/etl.py              # builds warehouse feature table
.venv/bin/python jobs/train_social.py     # trains models → saves to artifacts/
.venv/bin/python jobs/inference_social.py # writes 812 predictions to DB
```

Re-run all three steps whenever new post data is added.

---

## Step 1 — Backend: Add the Prediction Model + Controller

### 1.1 Create `Models/SocialMediaPrediction.cs`

```csharp
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEX_II.Models;

[Table("social_media_predictions", Schema = "operational")]
public class SocialMediaPrediction
{
    public int PostId { get; set; }
    public string? PredictedEngagementTier { get; set; }
    public double? ProbEngagementLow { get; set; }
    public double? ProbEngagementMedium { get; set; }
    public double? ProbEngagementHigh { get; set; }
    public int? PredictedHasDonations { get; set; }
    public double? ProbHasDonations { get; set; }
    public DateTime? PredictionTs { get; set; }

    public SocialMediaPost Post { get; set; } = null!;
}
```

### 1.2 Register in `Data/AppDbContext.cs`

Add one line inside the class alongside the existing `DbSet` properties:

```csharp
public DbSet<SocialMediaPrediction> SocialMediaPredictions => Set<SocialMediaPrediction>();
```

Add the key config inside `OnModelCreating`:

```csharp
modelBuilder.Entity<SocialMediaPrediction>().HasKey(e => e.PostId);
modelBuilder.Entity<SocialMediaPrediction>()
    .HasOne(p => p.Post)
    .WithOne()
    .HasForeignKey<SocialMediaPrediction>(p => p.PostId);
```

### 1.3 Create `Controllers/SocialMediaController.cs`

```csharp
using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/social-media")]
public class SocialMediaController : ControllerBase
{
    private readonly AppDbContext _db;
    public SocialMediaController(AppDbContext db) => _db = db;

    // GET /api/social-media/posts
    // Returns all posts joined with their ML predictions, sorted by donation probability
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts()
    {
        var posts = await _db.SocialMediaPosts
            .Join(_db.SocialMediaPredictions,
                post => post.PostId,
                pred => pred.PostId,
                (post, pred) => new
                {
                    post.PostId,
                    post.Platform,
                    post.PostType,
                    post.MediaType,
                    post.ContentTopic,
                    post.SentimentTone,
                    post.CreatedAt,
                    post.Caption,
                    post.EngagementRate,
                    post.DonationReferrals,
                    post.EstimatedDonationValuePhp,
                    pred.PredictedEngagementTier,
                    pred.ProbEngagementLow,
                    pred.ProbEngagementMedium,
                    pred.ProbEngagementHigh,
                    pred.PredictedHasDonations,
                    pred.ProbHasDonations,
                    pred.PredictionTs
                })
            .OrderByDescending(x => x.ProbHasDonations)
            .ToListAsync();

        return Ok(posts);
    }

    // GET /api/social-media/posts/{id}
    // Returns a single post with its prediction
    [HttpGet("posts/{id}")]
    public async Task<IActionResult> GetPost(int id)
    {
        var post = await _db.SocialMediaPosts
            .Where(p => p.PostId == id)
            .Join(_db.SocialMediaPredictions,
                post => post.PostId,
                pred => pred.PostId,
                (post, pred) => new
                {
                    post,
                    pred.PredictedEngagementTier,
                    pred.ProbEngagementLow,
                    pred.ProbEngagementMedium,
                    pred.ProbEngagementHigh,
                    pred.PredictedHasDonations,
                    pred.ProbHasDonations
                })
            .FirstOrDefaultAsync();

        if (post == null) return NotFound();
        return Ok(post);
    }

    // GET /api/social-media/insights
    // Returns top-level analytics: best platform, best time, best content type
    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights()
    {
        var data = await _db.SocialMediaPosts
            .Join(_db.SocialMediaPredictions,
                post => post.PostId,
                pred => pred.PostId,
                (post, pred) => new { post, pred })
            .ToListAsync();

        var bestPlatform = data
            .GroupBy(x => x.post.Platform)
            .Select(g => new {
                platform = g.Key,
                avgDonationProb = g.Average(x => x.pred.ProbHasDonations ?? 0)
            })
            .OrderByDescending(x => x.avgDonationProb)
            .First();

        var bestHour = data
            .GroupBy(x => x.post.PostHour)
            .Select(g => new {
                hour = g.Key,
                avgDonationProb = g.Average(x => x.pred.ProbHasDonations ?? 0)
            })
            .OrderByDescending(x => x.avgDonationProb)
            .First();

        var bestTopic = data
            .GroupBy(x => x.post.ContentTopic)
            .Select(g => new {
                topic = g.Key,
                avgDonationProb = g.Average(x => x.pred.ProbHasDonations ?? 0)
            })
            .OrderByDescending(x => x.avgDonationProb)
            .First();

        return Ok(new { bestPlatform, bestHour, bestTopic });
    }
}
```

---

## Step 2 — Frontend: API Calls

Create `frontend/src/api/socialMediaApi.ts`:

```typescript
const BASE = import.meta.env.VITE_API_URL;

export interface PostWithPrediction {
  postId: number;
  platform: string;
  postType: string;
  mediaType: string;
  contentTopic: string;
  sentimentTone: string;
  createdAt: string;
  caption: string;
  engagementRate: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  predictedEngagementTier: 'Low' | 'Medium' | 'High';
  probEngagementLow: number;
  probEngagementMedium: number;
  probEngagementHigh: number;
  predictedHasDonations: number;
  probHasDonations: number;
  predictionTs: string;
}

export interface Insights {
  bestPlatform: { platform: string; avgDonationProb: number };
  bestHour:     { hour: number;     avgDonationProb: number };
  bestTopic:    { topic: string;    avgDonationProb: number };
}

export async function getPosts(): Promise<PostWithPrediction[]> {
  const res = await fetch(`${BASE}/api/social-media/posts`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function getPost(id: number): Promise<PostWithPrediction> {
  const res = await fetch(`${BASE}/api/social-media/posts/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}

export async function getInsights(): Promise<Insights> {
  const res = await fetch(`${BASE}/api/social-media/insights`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
}
```

---

## Step 3 — Frontend: Analytics Page

Use the API calls in `SocialMediaAnalytics.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { getPosts, getInsights, PostWithPrediction, Insights } from '../../api/socialMediaApi';

function donationBadge(prob: number) {
  if (prob >= 0.7) return <span className="badge-green">Likely to drive donations</span>;
  if (prob >= 0.4) return <span className="badge-yellow">May drive donations</span>;
  return <span className="badge-red">Low donation likelihood</span>;
}

export default function SocialMediaAnalytics() {
  const [posts, setPosts] = useState<PostWithPrediction[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    getPosts().then(setPosts);
    getInsights().then(setInsights);
  }, []);

  return (
    <div>
      {/* Insights panel */}
      {insights && (
        <div className="insights-panel">
          <p>Best platform: <strong>{insights.bestPlatform.platform}</strong></p>
          <p>Best time to post: <strong>{insights.bestHour.hour}:00</strong></p>
          <p>Best content topic: <strong>{insights.bestTopic.topic}</strong></p>
        </div>
      )}

      {/* Post history table */}
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Platform</th><th>Type</th>
            <th>Engagement</th><th>Donations</th><th>ML Prediction</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(p => (
            <tr key={p.postId}>
              <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              <td>{p.platform}</td>
              <td>{p.postType}</td>
              <td>{p.predictedEngagementTier}</td>
              <td>{p.donationReferrals}</td>
              <td>{donationBadge(p.probHasDonations)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Prediction Badge Logic

Use `probHasDonations` from the API response to show a live signal in the composer:

| `probHasDonations` | Badge | Meaning |
|---|---|---|
| ≥ 0.70 | Green — "Likely to drive donations" | Post attributes match historically high-converting patterns |
| 0.40–0.69 | Yellow — "May drive donations" | Mixed signals |
| < 0.40 | Red — "Low donation likelihood" | Change platform, topic, or CTA before posting |

---

## What the Models Learned (from 812 historical posts)

### Post type — single biggest driver
| Post Type | Avg Donation Probability | Actual Donations |
|---|---|---|
| ImpactStory | **92.7%** | 7,388 |
| Campaign | 78.5% | 1,403 |
| FundraisingAppeal | 77.2% | 1,267 |
| ThankYou | 43.9% | 99 |
| EducationalContent | 42.2% | 96 |
| EventPromotion | 37.1% | 137 |

`ImpactStory` posts drive 71% of all tracked donations despite being only 25% of posts. `ThankYou`, `EducationalContent`, and `EventPromotion` are nearly worthless for donation conversion — use them sparingly.

### Resident stories — the #1 signal
| Features Resident Story | Avg Donation Probability | Actual Donations |
|---|---|---|
| Yes | **96.6%** | 6,766 |
| No | 57.1% | 3,624 |

Posts featuring a real resident story are nearly certain to drive donations. Only 20% of posts currently use this — it should be the default.

### Media type
| Media Type | Avg Donation Probability | Avg High Engagement |
|---|---|---|
| Reel | **75.0%** | 36.3% |
| Video | 68.5% | 31.0% |
| Carousel | 64.4% | 35.6% |
| Photo | 61.2% | 32.1% |
| Text | 58.7% | 32.6% |

Short-form video (Reels) is the strongest media format. Text-only posts are the weakest.

### Platform
| Platform | Avg Donation Probability | Actual Donations |
|---|---|---|
| YouTube | 74.5% | 1,417 |
| TikTok | 72.8% | 1,740 |
| Twitter | 67.9% | 672 |
| Instagram | 67.5% | 1,899 |
| WhatsApp | 67.5% | 2,148 |
| Facebook | 60.9% | 2,176 |
| LinkedIn | 46.6% | 338 |

YouTube and TikTok outperform on conversion probability. LinkedIn is the weakest platform by a large margin — deprioritise it. Facebook drives the most volume but at lower conversion efficiency.

### Best platform + topic combinations
| Platform | Topic | Avg Donation Probability |
|---|---|---|
| YouTube | Reintegration | 94.3% |
| YouTube | Health | 90.7% |
| TikTok | Reintegration | 87.8% |
| YouTube | AwarenessRaising | 85.8% |
| TikTok | AwarenessRaising | 85.6% |
| WhatsApp | Education | 80.3% |
| Twitter | CampaignLaunch | 78.8% |

YouTube + Reintegration stories and TikTok + AwarenessRaising are the two highest-converting combinations in the entire dataset.

### Best platform + post type combinations
| Platform | Post Type | Avg Donation Probability |
|---|---|---|
| Facebook | ImpactStory | 95.6% |
| TikTok | ImpactStory | 95.0% |
| YouTube | ImpactStory | 94.9% |
| YouTube | FundraisingAppeal | 94.2% |
| Instagram | ImpactStory | 93.3% |

`ImpactStory` dominates on every platform. `FundraisingAppeal` only works well on YouTube.

### Content topic
| Topic | Avg Donation Probability | Actual Donations |
|---|---|---|
| Health | 69.8% | 1,515 |
| CampaignLaunch | 67.7% | 932 |
| Reintegration | 66.7% | 1,212 |
| DonorImpact | 66.4% | 1,061 |
| Education | 65.5% | 1,294 |
| SafehouseLife | 64.5% | 1,910 |
| AwarenessRaising | 62.6% | 1,227 |
| Gratitude | 60.8% | 1,038 |
| EventRecap | 57.8% | 201 |

Health outcomes and reintegration stories convert best. EventRecap is the weakest topic — only 201 actual donations across 42 posts.

### Sentiment tone
| Tone | Avg Donation Probability | Avg High Engagement |
|---|---|---|
| Emotional | **72.7%** | 47.1% |
| Celebratory | 72.5% | 50.4% |
| Grateful | 67.0% | 27.3% |
| Hopeful | 64.2% | 33.3% |
| Urgent | 63.1% | 36.1% |
| Informative | 54.3% | 10.7% |

`Emotional` and `Celebratory` tone both drive high engagement AND donations. `Informative` tone has the lowest high-engagement probability (10.7%) — it reads as flat and does not move people to act.

### Call to action type
| CTA | Avg Donation Probability | Actual Donations |
|---|---|---|
| SignUp | **73.2%** | 1,465 |
| DonateNow | 70.2% | 899 |
| LearnMore | 67.1% | 1,965 |
| ShareStory | 65.7% | 1,502 |
| No CTA | 59.1% | 4,559 |

Any CTA outperforms no CTA. `SignUp` edges out `DonateNow` — soft commitment asks convert slightly better than direct asks. Posts with no CTA account for 39% of all posts but only 44% of donations.

### Day of week
| Day | Avg Donation Probability | Actual Donations |
|---|---|---|
| Saturday | **68.4%** | 1,395 |
| Friday | 66.3% | 1,662 |
| Monday | 66.3% | 1,436 |
| Sunday | 66.0% | 1,313 |
| Tuesday | 64.5% | 2,204 |
| Wednesday | 62.6% | 1,231 |
| Thursday | 61.5% | 1,149 |

Weekends and Mondays have the highest donation probability. Thursday is the weakest day — the opposite of common social media wisdom.

### Best hours to post
| Hour | Avg Donation Probability |
|---|---|
| 1pm | 83.8% |
| 7pm | 80.1% |
| 10am | 78.0% |
| 5pm | 77.1% |
| 6pm | 77.0% |
| 8pm | 76.2% |

**1pm is the single strongest posting slot** — likely catching people during lunch. The 5–8pm window is consistently strong. Post during these windows, not early morning.

### Number of hashtags
| Hashtags | Avg Donation Probability | Avg Engagement Rate |
|---|---|---|
| 0 | 65.4% | 0.0973 |
| 1 | 63.8% | 0.1018 |
| 2 | 65.5% | 0.1006 |
| 3 | 63.1% | 0.0994 |
| 4 | 66.4% | 0.0947 |
| 5 | **76.6%** | 0.0943 |

5 hashtags shows the highest donation probability. 0–4 hashtags are nearly identical — the volume doesn't matter much until you hit the maximum. Focus on hashtag quality over quantity.

### Boosted vs organic
| Boosted | Avg Donation Probability | Avg Donation Value (PHP) |
|---|---|---|
| Yes | 73.8% | ₱70,595 |
| No | 63.5% | ₱34,057 |

Boosted posts convert at a higher rate AND generate double the average donation value. However 84% of posts are not boosted — selectively boosting high-quality ImpactStory posts would likely give the best ROI.

### Campaign performance
| Campaign | Avg Donation Probability | Total Value (PHP) |
|---|---|---|
| Year-End Hope | **72.5%** | ₱3,358,823 |
| GivingTuesday | 70.5% | ₱4,085,500 |
| Summer of Safety | 68.4% | ₱3,393,441 |
| No Campaign | 63.7% | ₱20,265,288 |
| Back to School | 63.4% | ₱1,191,888 |

Named campaigns outperform unbranded posts on conversion probability. GivingTuesday generated the highest total value despite having only 22 posts — the highest value-per-post of any campaign.

### High engagement = high donations
| Engagement Tier | Avg Donation Probability | Actual Donations |
|---|---|---|
| High | 81.7% | 5,823 |
| Medium | 71.4% | 3,931 |
| Low | 40.8% | 636 |

Predicted `High` engagement posts generate 9x more actual donations than `Low` engagement posts. Engagement and donation conversion are correlated — optimise for engagement first.

### What to avoid (lowest-scoring post patterns)
These combinations score near 0% donation probability:
- `Facebook` + `EducationalContent` + `SafehouseLife` + `Informative` tone + no CTA
- `WhatsApp` + `EventPromotion` + `Informative` tone
- `Instagram` + `EducationalContent` + `EventRecap` + no CTA

The common threads: `EventPromotion` or `EducationalContent` type, `Informative` tone, no CTA.

### Summary: ideal post formula
To maximise donation probability, a post should have:
1. **Post type:** ImpactStory
2. **Features a real resident story:** Yes
3. **Media type:** Reel or Video
4. **Platform:** YouTube or TikTok (for conversion); Instagram/WhatsApp for volume
5. **Topic:** Health, Reintegration, or CampaignLaunch
6. **Tone:** Emotional or Celebratory
7. **CTA:** SignUp or DonateNow
8. **Time:** Saturday–Monday, 1pm or 7pm
9. **Hashtags:** 5
10. **Boosted:** Yes, if budget allows

---

## Re-training

Run after collecting new post performance data:

```bash
cd pipeline
.venv/bin/python jobs/etl.py
.venv/bin/python jobs/train_social.py
.venv/bin/python jobs/inference_social.py
```

Each run overwrites the `.sav` artifact files and upserts all predictions in the DB. Training date is recorded in `artifacts/*_metadata.json`.
