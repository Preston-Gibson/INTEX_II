# Social Media Post Composer — Implementation Plan

## Context

Lighthouse Sanctuary needs a social media tool inside the existing admin dashboard. The founders post sporadically and lack marketing experience. This tool lets admins compose one post, auto-adapt it per platform, upload media, and publish or schedule it to Instagram, Facebook, Twitter/X, and LinkedIn — all from one UI. A post analytics view shows what is working.

**Key existing asset:** `SocialMediaPost` table (44 fields) already exists with historical engagement data. No DB schema changes needed.

---

## Tech Stack
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS
- **Backend:** ASP.NET Core 10, Entity Framework Core 9, PostgreSQL (Supabase)
- **Auth:** JWT Bearer + ASP.NET Identity (admin role gate)
- **Hosting:** Azure (backend), Vercel (frontend)

---

## Platform API Approval Strategy

| Platform | Path | Timeline | Priority |
|---|---|---|---|
| Instagram + Facebook | One Meta Developer App → `instagram_content_publish` + `pages_manage_posts` | 1–4 weeks (nonprofit-friendly) | 1 |
| Twitter/X | Twitter Developer account, free tier (1,500 posts/month) | Days | 2 |
| LinkedIn | LinkedIn Partner Program (slow, uncertain for small orgs) | Weeks–months | 3 |

**Fallback built-in:** Every platform tab has a "Copy caption" button. If API approval is pending, the org pastes manually — no value lost.

---

## Phase 1 — Core UI + Database (no API approval needed)

### 1.1 Backend: New Controller + Service

**File:** `backend/Controllers/SocialMediaController.cs`

```csharp
[ApiController]
[Route("api/social-media")]
[Authorize(Roles = "Admin")]
public class SocialMediaController : ControllerBase
{
    // POST /api/social-media/draft       — save a draft post
    // POST /api/social-media/schedule    — save with scheduled_at timestamp
    // GET  /api/social-media/posts       — paginated post history
    // GET  /api/social-media/posts/{id}  — single post detail + metrics
    // POST /api/social-media/upload-media — upload image/video, return temp URL
}
```

**File:** `backend/Services/SocialMediaAdapterService.cs`

Rule-based caption adaptation (no AI):
- **Instagram:** full caption + `\n\n` + hashtag block
- **Facebook:** full caption, optional hashtags appended
- **Twitter/X:** truncate to 257 chars + `…` + 2–3 key hashtags (≤280 total)
- **LinkedIn:** strip inline hashtags, append max 3 at end

### 1.2 Frontend: Composer Page

**File:** `frontend/src/pages/admin/SocialMediaComposer.tsx`

Layout:

```
┌─────────────────────────────────────────────────────┐
│  COMPOSE                                            │
│  ┌──────────────────────────────────────────────┐  │
│  │  Caption textarea (char counter)             │  │
│  └──────────────────────────────────────────────┘  │
│  [📎 Upload Image/Video]                            │
│                                                     │
│  Post to:  [✓] Instagram  [✓] Facebook             │
│            [✓] Twitter/X  [ ] LinkedIn              │
│                                                     │
│  ┌──── Preview Tabs ──────────────────────────────┐ │
│  │ Instagram | Facebook | Twitter/X | LinkedIn   │ │
│  │ ─────────────────────────────────────────── │ │
│  │  [Adapted caption shown here — editable]    │ │
│  │                            [Copy Caption]   │ │
│  └─────────────────────────────────────────────┘ │
│                                                     │
│  [ Post Now ]   [ Schedule ▼ date/time picker ]    │
└─────────────────────────────────────────────────────┘
```

Key behaviors:
- Caption changes auto-update all platform preview tabs
- Each tab is independently editable (overrides the auto-adaptation)
- "Copy Caption" always available — works before any API is connected
- "Post Now" calls `POST /api/social-media/publish` (Phase 2) or saves draft
- "Schedule" opens inline date/time picker, calls `POST /api/social-media/schedule`

### 1.3 Frontend: Analytics Page

**File:** `frontend/src/pages/admin/SocialMediaAnalytics.tsx`

```
┌─────────────────────────────────────────────────────┐
│  POST HISTORY                  [Filter by platform] │
│  ┌───────────────────────────────────────────────┐  │
│  │ Date | Platform | Caption preview | Status   │  │
│  │ ──────────────────────────────────────────── │  │
│  │ Apr 5 | Instagram | "Last week our…"      ✓  │  │
│  │  ↳ Likes: 142  Reach: 2,400  Donations: 3   │  │
│  │ Apr 3 | Twitter   | "Meet Sarah…"         ✓  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  TOP PERFORMING CONTENT                             │
│  Best time to post: Tue/Thu 7–9pm                  │
│  Top hashtag: #domesticviolenceawareness (+34%)    │
│  Stories with resident photos: 2.1x more donations │
└─────────────────────────────────────────────────────┘
```

Analytics are computed from existing `social_media_posts` data — no external API needed for the insights panel. Live metrics (likes, reach) sync from platform APIs in Phase 3.

### 1.4 Routing + Nav

**Modify:** `frontend/src/App.tsx`
```tsx
<Route path="/admin-social-media" element={<SocialMediaComposer />} />
<Route path="/admin-social-analytics" element={<SocialMediaAnalytics />} />
```

**Modify:** Admin nav component — add "Social Media" and "Post Analytics" links.

---

## Phase 2 — Live Publishing (as API approvals land)

### 2.1 Backend: Publisher Service

**File:** `backend/Services/SocialMediaPublisher.cs`

```csharp
public interface ISocialMediaPublisher
{
    Task<PublishResult> PublishToInstagram(PostContent content, string accessToken);
    Task<PublishResult> PublishToFacebook(PostContent content, string accessToken);
    Task<PublishResult> PublishToTwitter(PostContent content, string bearerToken);
    Task<PublishResult> PublishToLinkedIn(PostContent content, string accessToken);
}
```

**Meta (Instagram + Facebook):**
- Step 1: `POST https://graph.facebook.com/v18.0/{ig-user-id}/media` → `creation_id`
- Step 2: `POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish` with `creation_id`
- Facebook: `POST https://graph.facebook.com/v18.0/{page-id}/feed`

**Twitter/X:**
- `POST https://api.twitter.com/2/tweets` with OAuth 2.0 Bearer token

**LinkedIn:**
- `POST https://api.linkedin.com/v2/ugcPosts` with OAuth 2.0 token

**Token storage:** All tokens stored as Azure App Service environment variables. Never in DB or frontend.

```
META_PAGE_ACCESS_TOKEN
META_IG_USER_ID
META_PAGE_ID
TWITTER_BEARER_TOKEN
LINKEDIN_ACCESS_TOKEN
```

### 2.2 Backend: Scheduled Post Worker

**File:** `backend/Services/ScheduledPostWorker.cs`

`IHostedService` that runs every 60 seconds:
1. Query `social_media_posts WHERE is_published = false AND scheduled_at <= NOW()`
2. For each due post, call `ISocialMediaPublisher` per platform
3. On success: set `is_published = true`, `posted_at = NOW()`
4. On failure: log error, increment retry count, skip if retried 3x

Register in `Program.cs`:
```csharp
builder.Services.AddHostedService<ScheduledPostWorker>();
```

---

## Phase 3 — Analytics Sync

**File:** `backend/Services/MetricsSyncService.cs`

Background sync (runs daily):
- Meta Insights API: `GET /{media-id}/insights?metric=impressions,reach,likes,comments,shares,saved`
- Twitter: `GET /2/tweets/{id}?tweet.fields=public_metrics`
- Update `social_media_posts` fields: `likes_count`, `comments_count`, `shares_count`, `reach`, `impressions`, `engagement_rate`

**Donation attribution** (no API needed):
```sql
SELECT sp.post_id, COUNT(d.donation_id) as referral_donations, SUM(d.amount) as total_value
FROM social_media_posts sp
JOIN donations d ON d.referral_post_id = sp.post_id
GROUP BY sp.post_id
```

---

## Files to Create / Modify

| File | Action |
|---|---|
| `frontend/src/pages/admin/SocialMediaComposer.tsx` | **Create** |
| `frontend/src/pages/admin/SocialMediaAnalytics.tsx` | **Create** |
| `frontend/src/App.tsx` | **Modify** — add 2 routes |
| Admin nav component | **Modify** — add nav links |
| `backend/Controllers/SocialMediaController.cs` | **Create** |
| `backend/Services/SocialMediaAdapterService.cs` | **Create** |
| `backend/Services/SocialMediaPublisher.cs` | **Create** (Phase 2) |
| `backend/Services/ScheduledPostWorker.cs` | **Create** (Phase 2) |
| `backend/Services/MetricsSyncService.cs` | **Create** (Phase 3) |
| `backend/Models/SocialMediaPost.cs` | **No change** — already complete |
| `backend/Data/IntexIIContext.cs` | **No change** — DbSet already registered |
| `backend/Program.cs` | **Modify** — register hosted service (Phase 2) |

---

## Recommended Build Order

1. `SocialMediaAdapterService` (rule-based caption adaptation)
2. `SocialMediaController` — draft + schedule endpoints + media upload
3. `SocialMediaComposer.tsx` — composer UI with copy-to-clipboard
4. `SocialMediaAnalytics.tsx` — post history table + insights panel from existing data
5. Routing + nav links
6. **[ API approvals in parallel ]**
7. `SocialMediaPublisher.cs` — Meta first, then Twitter, then LinkedIn
8. "Post Now" button goes live in UI
9. `ScheduledPostWorker.cs` — scheduled publishing
10. `MetricsSyncService.cs` — daily engagement metric sync

---

## Verification

- **Phase 1:** Compose a post as admin, verify per-platform preview tabs show adapted captions, verify "Copy Caption" works, verify post saves to DB with `is_published = false`
- **Phase 1:** Schedule a post 2 minutes out, confirm `scheduled_at` is set and worker processes it
- **Phase 2:** Configure Meta sandbox tokens, post to Instagram test account, confirm `is_published = true` + post appears on Instagram
- **Phase 3:** Verify analytics page shows engagement metrics updating daily, verify donation attribution query links correctly to `donations` table
