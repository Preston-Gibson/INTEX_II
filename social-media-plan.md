# Social Media Post Composer — Implementation Plan (Updated)

## Context

Lighthouse Sanctuary's founders post sporadically and lack marketing experience. This feature adds an admin-only social media post composer to the existing dashboard. The key differentiator: the org already has **812 historical posts** and **two trained ML models** that predict engagement tier and donation conversion probability. The composer will surface these data-driven insights in real time as the admin composes a post — telling them *before* they publish how likely the post is to drive donations, and what to change to improve it.

---

## What Already Exists (Do Not Rebuild)

| Asset | Location | Status |
|---|---|---|
| `SocialMediaPost` model (44 fields) | `backend/.../Models/SocialMediaPost.cs` | Complete |
| `DbSet<SocialMediaPost>` | `backend/.../Data/IntexIIContext.cs` | Registered |
| 812 historical posts | `pipeline/data/social_media_posts.csv` | Seeded |
| Engagement tier ML model | `pipeline/artifacts/*.sav` | Trained (63.5% acc) |
| Donation conversion ML model | `pipeline/artifacts/*.sav` | Trained (78.8% acc) |
| ETL + train + inference scripts | `pipeline/jobs/` | Complete |
| `Donation.ReferralPostId` FK | `backend/.../Models/Donation.cs` | Registered |
| SOCIAL_MEDIA.md controller template | `pipeline/SOCIAL_MEDIA.md` | Reference |

---

## Tech Stack
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS
- **Backend:** ASP.NET Core 10, Entity Framework Core 9, PostgreSQL (Supabase)
- **ML Layer:** Python (scikit-learn), predictions stored in `social_media_predictions` table
- **Auth:** JWT Bearer + ASP.NET Identity (admin role gate)
- **Hosting:** Azure (backend), Vercel (frontend)

---

## ML Pipeline Insights (Key Findings from 812 Posts)

These facts drive the recommendations shown in the composer UI:

| Factor | Insight |
|---|---|
| **#1 signal** | Posts featuring a resident story: **96.6%** donation probability vs 57.1% without |
| **Best post type** | ImpactStory → 92.7% donation prob; FundraisingAppeal → 77.2% |
| **Best platform** | YouTube (74.5%) → TikTok (72.8%) → Instagram (67.5%) |
| **Best media** | Reel/Video (75%) vs Text-only (58.7%) |
| **Best time** | 1pm strongest (83.8%); 5–8pm window (76–77%); avoid Thursday |
| **Best tone** | Emotional or Celebratory |
| **Optimal hashtags** | 5 hashtags (not more, not fewer) |
| **Underused opportunity** | Only 20% of posts currently use resident stories — biggest gap |

**Perfect post formula:** ImpactStory + resident story + Reel/Video + YouTube or Instagram + Emotional tone + DonateNow CTA + 1pm Saturday–Monday + 5 hashtags + boosted.

---

## Platform API Approval Strategy

| Platform | Path | Timeline | Priority |
|---|---|---|---|
| Instagram + Facebook | One Meta Developer App → `instagram_content_publish` + `pages_manage_posts` | 1–4 weeks | 1 |
| Twitter/X | Twitter Developer account, free tier (1,500 posts/month) | Days | 2 |
| LinkedIn | LinkedIn Partner Program | Weeks–months | 3 |

**Fallback:** Every platform tab has "Copy caption" — works immediately with zero API dependency.

---

## Phase 1 — ML Pipeline Integration (backend plumbing)

### 1.1 Add `SocialMediaPrediction` Model

**File:** `backend/.../Models/SocialMediaPrediction.cs` (create)

```csharp
public class SocialMediaPrediction
{
    public int PostId { get; set; }
    public string PredictedEngagementTier { get; set; } = string.Empty; // Low/Medium/High
    public double ProbEngagementLow { get; set; }
    public double ProbEngagementMedium { get; set; }
    public double ProbEngagementHigh { get; set; }
    public int PredictedHasDonations { get; set; }       // 0 or 1
    public double ProbHasDonations { get; set; }          // 0.0–1.0
    public DateTime PredictionTs { get; set; }
    public SocialMediaPost Post { get; set; } = null!;
}
```

**Modify:** `IntexIIContext.cs` — add `DbSet<SocialMediaPrediction>` with composite key config.

**Run migration** to create `social_media_predictions` table.

### 1.2 Run ML Inference to Populate Predictions

```bash
cd pipeline
python jobs/etl.py              # Build features from raw posts
python jobs/train_social.py     # Train both models (already done, re-run to refresh)
python jobs/inference_social.py # Write predictions into social_media_predictions table
```

This populates `social_media_predictions` with donation conversion probability for all 812 existing posts.

### 1.3 `SocialMediaController` — Analytics Endpoints

**File:** `backend/.../Controllers/SocialMediaController.cs` (create, use SOCIAL_MEDIA.md as template)

```
GET  /api/social-media/posts          — all posts + predictions (sorted by donation prob)
GET  /api/social-media/posts/{id}     — single post + prediction detail
GET  /api/social-media/insights       — aggregate: best platform, best hour, best topic
POST /api/social-media/score-draft    — score a draft post on-the-fly (key new endpoint)
POST /api/social-media/draft          — save a draft post to DB
POST /api/social-media/schedule       — save with scheduled_at timestamp
POST /api/social-media/upload-media   — upload image/video, return temp URL
```

### `POST /api/social-media/score-draft` — Real-Time Scoring

This is the key endpoint that makes the composer intelligent. Request body:

```json
{
  "postType": "ImpactStory",
  "platform": "Instagram",
  "mediaType": "Reel",
  "sentimentTone": "Emotional",
  "hasCallToAction": true,
  "callToActionType": "DonateNow",
  "featuresResidentStory": true,
  "numHashtags": 5,
  "captionLength": 220,
  "postHour": 13,
  "dayOfWeek": "Saturday"
}
```

Response:

```json
{
  "donationProbability": 0.91,
  "engagementTier": "High",
  "probEngagementHigh": 0.78,
  "suggestions": [
    "Add a resident story to increase donation probability by ~40%",
    "Switch from Thursday to Saturday for +15% donation probability",
    "Trim to 5 hashtags (currently 12) for optimal engagement"
  ]
}
```

**Implementation:** The backend calls the Python inference script via a pre-computed lookup table (rules derived from the model) — no live Python call needed. The "suggestions" are rule-based comparisons against the ML findings above.

---

## Phase 2 — Composer UI

### 2.1 Composer Page

**File:** `frontend/src/pages/admin/SocialMediaComposer.tsx` (create)

Layout — three-panel:

```
┌────────────────────┬──────────────────────┬──────────────────────┐
│   COMPOSE          │   PLATFORM PREVIEW   │   INSIGHTS           │
│                    │                      │                      │
│ Post Type ▼        │ [Instagram] [FB] ... │ Donation Score       │
│ ImpactStory        │ ─────────────────── │ ████████░░  91%      │
│                    │ Caption text here    │                      │
│ Caption:           │ (editable)           │ Engagement: HIGH     │
│ ┌──────────────┐  │                      │                      │
│ │              │  │ [Copy Caption]       │ Suggestions:         │
│ │  textarea    │  │                      │ ✓ Has resident story │
│ │  (char cntr) │  │                      │ ✓ DonateNow CTA      │
│ └──────────────┘  │                      │ ⚠ Post at 1pm not   │
│                    │                      │   7pm for +8%        │
│ [Upload Media]     │                      │                      │
│                    │                      │ Best time: Sat 1pm   │
│ Features           │                      │ Best platform: IG    │
│ resident story ☑  │                      │ Top format: Reel     │
│                    │                      │                      │
│ Platforms:         │                      │                      │
│ [✓]IG [✓]FB        │                      │                      │
│ [✓]TW [ ]LI        │                      │                      │
│                    │                      │                      │
│ Hashtags:          │                      │                      │
│ [tag input]  (5✓) │                      │                      │
│                    │                      │                      │
│ Schedule:          │                      │                      │
│ [Now] [Later ▼]   │                      │                      │
│                    │                      │                      │
│ [Post Now]         │                      │                      │
└────────────────────┴──────────────────────┴──────────────────────┘
```

Key behaviors:
- Every change to post type, platform, media type, tone, hashtag count, resident story toggle, or scheduled hour triggers a debounced call to `POST /api/social-media/score-draft`
- Donation probability gauge updates live (color: red < 50%, yellow 50–75%, green > 75%)
- Suggestions list shows 1–3 actionable tips derived from the ML findings
- Caption auto-adapts per platform (Twitter truncates to 280, LinkedIn strips hashtags)
- Each platform preview tab is independently editable
- "Copy Caption" available on every tab — no API dependency

### 2.2 Analytics Page

**File:** `frontend/src/pages/admin/SocialMediaAnalytics.tsx` (create)

Sections:
1. **Top-line stats** — avg donation prob across all posts, total donation referrals, total estimated value
2. **Post history table** — date, platform, post type, engagement tier (predicted vs actual), donation referrals
3. **Insights panel** — best platform chart, best time heatmap (hour × day), best content topic bar chart — all from `GET /api/social-media/insights`
4. **Underused opportunities** — "Only 20% of your posts feature resident stories. Posts with stories are 2.1x more likely to drive donations."

### 2.3 Routing + Nav

**Modify:** `frontend/src/App.tsx`
```tsx
<Route path="/admin-social-media" element={<SocialMediaComposer />} />
<Route path="/admin-social-analytics" element={<SocialMediaAnalytics />} />
```

**Modify:** Admin nav — add "Social Media" and "Post Analytics" links (admin role only).

---

## Phase 3 — Live Publishing (as Meta/Twitter API approvals land)

### 3.1 Publisher Service

**File:** `backend/.../Services/SocialMediaPublisher.cs` (create)

```csharp
public interface ISocialMediaPublisher
{
    Task<PublishResult> PublishToInstagram(PostContent content, string accessToken);
    Task<PublishResult> PublishToFacebook(PostContent content, string accessToken);
    Task<PublishResult> PublishToTwitter(PostContent content, string bearerToken);
    Task<PublishResult> PublishToLinkedIn(PostContent content, string accessToken);
}
```

Meta two-step: `POST /media` → `creation_id` → `POST /media_publish`  
Twitter: `POST /2/tweets` with OAuth 2.0  
LinkedIn: `POST /v2/ugcPosts` with OAuth 2.0

**Token storage:** Azure App Service environment variables only. Never in DB or frontend.
```
META_PAGE_ACCESS_TOKEN, META_IG_USER_ID, META_PAGE_ID
TWITTER_BEARER_TOKEN
LINKEDIN_ACCESS_TOKEN
```

### 3.2 Scheduled Post Worker

**File:** `backend/.../Services/ScheduledPostWorker.cs` (create)

`IHostedService` polling every 60 seconds:
1. Query posts where `is_published = false AND scheduled_at <= NOW()`
2. Call `ISocialMediaPublisher` per selected platform
3. On success: `is_published = true`, `posted_at = NOW()`
4. On failure: log error, skip after 3 retries

Register in `Program.cs`:
```csharp
builder.Services.AddHostedService<ScheduledPostWorker>();
```

---

## Files to Create / Modify

| File | Action | Phase |
|---|---|---|
| `backend/.../Models/SocialMediaPrediction.cs` | **Create** | 1 |
| `backend/.../Data/IntexIIContext.cs` | **Modify** — add DbSet + key config | 1 |
| `backend/.../Controllers/SocialMediaController.cs` | **Create** | 1 |
| `frontend/src/pages/admin/SocialMediaComposer.tsx` | **Create** | 2 |
| `frontend/src/pages/admin/SocialMediaAnalytics.tsx` | **Create** | 2 |
| `frontend/src/App.tsx` | **Modify** — add 2 routes | 2 |
| Admin nav component | **Modify** — add nav links | 2 |
| `backend/.../Services/SocialMediaPublisher.cs` | **Create** | 3 |
| `backend/.../Services/ScheduledPostWorker.cs` | **Create** | 3 |
| `backend/.../Program.cs` | **Modify** — register hosted service | 3 |
| `backend/.../Models/SocialMediaPost.cs` | **No change** | — |

---

## Recommended Build Order

1. `SocialMediaPrediction` model + migration + run inference pipeline
2. `SocialMediaController` — insights + score-draft + draft + schedule endpoints
3. `SocialMediaComposer.tsx` — composer with live scoring gauge + suggestions + copy-to-clipboard
4. `SocialMediaAnalytics.tsx` — post history + insights charts
5. Routing + nav links
6. **[ Meta + Twitter API approvals in parallel ]**
7. `SocialMediaPublisher.cs` + `ScheduledPostWorker.cs`
8. "Post Now" button goes live

---

## Verification

- **Phase 1:** Call `GET /api/social-media/insights` — confirm best platform, hour, and topic return correctly from historical data
- **Phase 1:** Call `POST /api/social-media/score-draft` with an ImpactStory + resident story — confirm donation probability > 90% and no suggestions for improvement
- **Phase 1:** Call same endpoint with a ThankYou post on Thursday at midnight — confirm low probability + suggestions to switch type and time
- **Phase 2:** Open composer as admin, toggle "Features resident story" on/off — confirm gauge updates live
- **Phase 2:** Change post hour slider — confirm suggestions update to reflect best time recommendations
- **Phase 2:** Verify "Copy Caption" works on all platform tabs before any API is connected
- **Phase 3:** Configure Meta sandbox tokens → post to Instagram test account → confirm `is_published = true` in DB and post visible on Instagram
