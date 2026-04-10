import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { authHeaders } from '../../utils/auth';
import { supabase } from '../../utils/supabase';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/social-media`;

const BRAND_LOGO_SRC = '/logo.png';
const BRAND_INSTAGRAM_HANDLE = 'luceraofficial';
const BRAND_TWITTER_HANDLE = '@LuceraSafehouses';

function BrandAvatar({ size, borderWidth = 2 }: { size: number; borderWidth?: number }) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'contain',
        background: '#fff',
        border: `${borderWidth}px solid #fff`,
        display: 'block',
      }}
    />
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'Instagram' | 'Facebook' | 'LinkedIn' | 'Twitter';
type PostType = 'ImpactStory' | 'Campaign' | 'FundraisingAppeal' | 'ThankYou' | 'Educational' | 'EventPromotion';
type MediaType = 'Photo' | 'Video' | 'Reel' | 'Carousel' | 'Text';
type SentimentTone = 'Emotional' | 'Celebratory' | 'Grateful' | 'Hopeful' | 'Urgent' | 'Informative';
type CTAType = 'DonateNow' | 'LearnMore' | 'SignUp' | 'ShareStory';
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface DraftPost {
  postType: PostType;
  platforms: Platform[];
  mediaType: MediaType;
  sentimentTone: SentimentTone;
  hasCallToAction: boolean;
  callToActionType: CTAType;
  featuresResidentStory: boolean;
  caption: string;
  hashtags: string[];
  postHour: number;
  dayOfWeek: DayOfWeek;
  scheduleLater: boolean;
  scheduledAt: string;
}

interface Suggestion { text: string; type: 'warning' | 'tip' | 'good' }

interface PlatformResult {
  platform: string;
  status: 'published' | 'failed' | 'preview_only';
  externalPostId?: string | null;
  permalink?: string | null;
  errorMessage?: string | null;
}

interface Insights {
  totalPosts: number;
  overallDonationRate: number;
  bestPlatform: string;
  bestPlatformRate: number;
  bestHour: number;
  bestHourRate: number;
  bestDay: string;
  bestDayRate: number;
  optimalHashtagCount: number;
  bestPostType: string;
  bestPostTypeRate: number;
  bestMediaType: string;
  bestMediaTypeRate: number;
  bestSentimentTone: string;
  residentStoryDonationRate: number;
  noResidentStoryDonationRate: number;
  residentStoryPctOfPosts: number;
  ctaWithDonationRate: number;
  ctaWithoutDonationRate: number;
  platformRates: Record<string, number>;
  postTypeRates: Record<string, number>;
  mediaTypeRates: Record<string, number>;
  dayRates: Record<string, number>;
  hourRates: Record<number, number>;
  hashtagEngagementRates: Record<number, number>;
  sentimentToneRates: Record<string, number>;
}

// ─── Scoring (driven by live API data) ───────────────────────────────────────

function scoreDraft(post: DraftPost, ins: Insights | null): { probability: number; tier: 'Low' | 'Medium' | 'High'; suggestions: Suggestion[] } {
  if (!ins) return { probability: 0.5, tier: 'Medium', suggestions: [] };

  const base = ins.overallDonationRate;
  let delta = 0;

  // Post type contribution
  const typeRate = ins.postTypeRates[post.postType];
  if (typeRate !== undefined) delta += (typeRate - base) * 0.9;

  // Resident story — biggest lever
  const storyRate = post.featuresResidentStory ? ins.residentStoryDonationRate : ins.noResidentStoryDonationRate;
  delta += (storyRate - base) * 0.8;

  // Platform (first selected)
  const platRate = ins.platformRates[post.platforms[0]];
  if (platRate !== undefined) delta += (platRate - base) * 0.5;

  // Media type
  const mediaRate = ins.mediaTypeRates[post.mediaType];
  if (mediaRate !== undefined) delta += (mediaRate - base) * 0.5;

  // Hour
  const hourRate = ins.hourRates[post.postHour];
  if (hourRate !== undefined) delta += (hourRate - base) * 0.4;

  // Day
  const dayRate = ins.dayRates[post.dayOfWeek];
  if (dayRate !== undefined) delta += (dayRate - base) * 0.3;

  // Sentiment tone
  const toneRate = ins.sentimentToneRates[post.sentimentTone];
  if (toneRate !== undefined) delta += (toneRate - base) * 0.4;

  // CTA
  const ctaRate = post.hasCallToAction ? ins.ctaWithDonationRate : ins.ctaWithoutDonationRate;
  delta += (ctaRate - base) * 0.35;

  // Hashtag count
  const hashtagRate = ins.hashtagEngagementRates[post.hashtags.length];
  const avgHashtagEngagement = Object.values(ins.hashtagEngagementRates).reduce((a, b) => a + b, 0) / Math.max(Object.keys(ins.hashtagEngagementRates).length, 1);
  if (hashtagRate !== undefined) delta += (hashtagRate - avgHashtagEngagement) * 0.3;

  const prob = Math.max(0.04, Math.min(0.97, base + delta));
  const tier: 'Low' | 'Medium' | 'High' = prob > 0.70 ? 'High' : prob > 0.45 ? 'Medium' : 'Low';

  // Build suggestions
  const suggestions: Suggestion[] = [];
  const fmt = (n: number) => `${Math.round(n * 100)}%`;

  if (post.featuresResidentStory) {
    suggestions.push({ text: `Resident story included — ${fmt(ins.residentStoryDonationRate)} donation rate vs ${fmt(ins.noResidentStoryDonationRate)} without`, type: 'good' });
  } else {
    suggestions.push({ text: `Add a resident story — lifts donation rate from ${fmt(ins.noResidentStoryDonationRate)} to ${fmt(ins.residentStoryDonationRate)}`, type: 'warning' });
  }

  if (post.postType === ins.bestPostType) {
    suggestions.push({ text: `${post.postType.replace(/([A-Z])/g, ' $1').trim()} is your highest-converting post type at ${fmt(ins.bestPostTypeRate)}`, type: 'good' });
  } else if (ins.postTypeRates[post.postType] < ins.overallDonationRate) {
    suggestions.push({ text: `Switch to ${ins.bestPostType.replace(/([A-Z])/g, ' $1').trim()} for ${fmt(ins.bestPostTypeRate)} vs current ${fmt(ins.postTypeRates[post.postType] ?? base)}`, type: 'tip' });
  }

  if (post.hasCallToAction) {
    suggestions.push({ text: `CTA included — posts with CTA convert at ${fmt(ins.ctaWithDonationRate)} vs ${fmt(ins.ctaWithoutDonationRate)} without`, type: 'good' });
  } else {
    suggestions.push({ text: `Add a Call to Action — lifts conversion by ${Math.round((ins.ctaWithDonationRate - ins.ctaWithoutDonationRate) * 100)}pp`, type: 'warning' });
  }

  const optCount = ins.optimalHashtagCount;
  if (post.hashtags.length === optCount) {
    suggestions.push({ text: `${optCount} hashtags — optimal for engagement`, type: 'good' });
  } else if (post.hashtags.length === 0) {
    suggestions.push({ text: `Add hashtags — aim for ${optCount} (your optimal count)`, type: 'warning' });
  } else {
    suggestions.push({ text: `Aim for ${optCount} hashtags (currently ${post.hashtags.length})`, type: 'tip' });
  }

  if (post.postHour === ins.bestHour || (ins.hourRates[post.postHour] ?? 0) >= ins.bestHourRate * 0.9) {
    suggestions.push({ text: `Posting hour ${post.postHour}:00 is in the peak window`, type: 'good' });
  } else {
    suggestions.push({ text: `Best hour is ${ins.bestHour}:00 (${fmt(ins.bestHourRate)} conversion) — currently ${post.postHour}:00`, type: 'tip' });
  }

  if (post.dayOfWeek === ins.bestDay) {
    suggestions.push({ text: `${ins.bestDay} is your best day at ${fmt(ins.bestDayRate)} donation rate`, type: 'good' });
  } else if ((ins.dayRates[post.dayOfWeek] ?? 0) < ins.overallDonationRate * 0.85) {
    suggestions.push({ text: `${post.dayOfWeek} performs below average — try ${ins.bestDay}`, type: 'tip' });
  }

  return { probability: prob, tier, suggestions };
}

// ─── Caption adapters ─────────────────────────────────────────────────────────

function adaptCaption(caption: string, hashtags: string[], platform: Platform): string {
  const tagged = hashtags.map(h => h.startsWith('#') ? h : `#${h}`);
  if (platform === 'Instagram') return caption + (tagged.length ? `\n\n${tagged.join(' ')}` : '');
  if (platform === 'Facebook') return caption + (tagged.length ? `\n\n${tagged.slice(0, 5).join(' ')}` : '');
  if (platform === 'Twitter') {
    const top = tagged.slice(0, 2).join(' ');
    const max = 280 - top.length - (top ? 2 : 0);
    const body = caption.length > max ? caption.slice(0, max - 1) + '…' : caption;
    return body + (top ? ` ${top}` : '');
  }
  if (platform === 'LinkedIn') {
    const top = tagged.slice(0, 3).join(' ');
    return caption + (top ? `\n\n${top}` : '');
  }
  return caption;
}

// ─── Platform Previews ────────────────────────────────────────────────────────

function InstagramPreview({ caption, hashtags, media }: { caption: string; hashtags: string[]; media: string | null }) {
  const text = adaptCaption(caption, hashtags, 'Instagram');

  // iPhone 16 Pro dimensions: 393 × 852 logical pixels (screen), aspect ~2.167:1
  // We render at 320px wide phone body → screen width ≈ 294px
  const phoneW = 320;
  const phoneH = 680;
  // Black Titanium (Space Black) — iPhone 16 Pro
  const titaniumOuter = 'linear-gradient(165deg,#3a3a3c 0%,#1c1c1e 22%,#0a0a0a 48%,#252528 72%,#141416 100%)';
  const titaniumInner = 'linear-gradient(165deg,#2c2c2e 0%,#161618 45%,#0c0c0d 100%)';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', fontFamily: '-apple-system,system-ui,sans-serif' }}>
      {/* Outer titanium frame */}
      <div style={{
        width: phoneW, height: phoneH,
        borderRadius: 54, padding: 4,
        background: titaniumOuter,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 28px 80px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.14)',
        position: 'relative', flexShrink: 0,
      }}>
        {/* Side buttons – Volume up */}
        <div style={{ position: 'absolute', left: -3, top: 128, width: 3, height: 32, borderRadius: '2px 0 0 2px', background: titaniumOuter }} />
        {/* Volume down */}
        <div style={{ position: 'absolute', left: -3, top: 172, width: 3, height: 32, borderRadius: '2px 0 0 2px', background: titaniumOuter }} />
        {/* Action button */}
        <div style={{ position: 'absolute', left: -3, top: 92, width: 3, height: 28, borderRadius: '2px 0 0 2px', background: titaniumOuter }} />
        {/* Power/Sleep button */}
        <div style={{ position: 'absolute', right: -3, top: 148, width: 3, height: 64, borderRadius: '0 2px 2px 0', background: titaniumOuter }} />

        {/* Inner frame edge (slightly recessed) */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 51, padding: 2,
          background: titaniumInner,
        }}>
          {/* Screen bezel (black gap between frame and screen) */}
          <div style={{
            width: '100%', height: '100%',
            borderRadius: 49, background: '#000',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Screen content — white Instagram light mode */}
            <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* ── Status bar ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0', flexShrink: 0, minHeight: 44 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#000', letterSpacing: -0.3 }}>9:41</span>
                {/* Dynamic Island */}
                <div style={{
                  position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                  width: 112, height: 34, borderRadius: 20, background: '#000',
                  zIndex: 10,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Signal bars */}
                  <svg width="17" height="12" viewBox="0 0 17 12" fill="#000"><rect x="0" y="5" width="3" height="7" rx="0.5"/><rect x="4.5" y="3" width="3" height="9" rx="0.5"/><rect x="9" y="1" width="3" height="11" rx="0.5"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.25"/></svg>
                  {/* WiFi */}
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="#000"><path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/><path d="M3.5 5.8A6.5 6.5 0 0 1 8 4a6.5 6.5 0 0 1 4.5 1.8l1.3-1.3A8.3 8.3 0 0 0 8 2.2a8.3 8.3 0 0 0-5.8 2.3l1.3 1.3z" opacity="0.4"/><path d="M5.6 7.6A3.5 3.5 0 0 1 8 6.6a3.5 3.5 0 0 1 2.4 1l1.3-1.3A5.3 5.3 0 0 0 8 4.8a5.3 5.3 0 0 0-3.7 1.5l1.3 1.3z"/></svg>
                  {/* Battery */}
                  <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#000" strokeOpacity="0.35"/><rect x="2" y="2" width="17" height="8" rx="2" fill="#000"/><path d="M23 4v4a2 2 0 0 0 0-4z" fill="#000" fillOpacity="0.4"/></svg>
                </div>
              </div>

              {/* ── IG top nav ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px 6px', flexShrink: 0 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#000', fontFamily: 'Georgia,serif', fontStyle: 'italic', letterSpacing: -0.5 }}>Instagram</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  {/* Heart */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {/* Messenger */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
              </div>

              {/* ── Stories ── */}
              <div style={{ display: 'flex', gap: 10, padding: '4px 12px 10px', overflowX: 'hidden', borderBottom: '1px solid #efefef', flexShrink: 0 }}>
                {/* Your story */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1.5px dashed #dbdbdb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#f0f0f0' }} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: '#0095f6', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 10 10" fill="white" style={{ width: 10, height: 10 }}><path d="M5 1v8M1 5h8"/></svg>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, color: '#262626', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Your story</span>
                </div>
                {[{ label: 'hope' }, { label: 'relief' }, { label: 'giving' }, { label: 'impact' }].map((s) => (
                  <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <div style={{ padding: 2, borderRadius: '50%', background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                      <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#e0dcd8', border: '2px solid #fff' }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#262626', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* ── Feed (scrollable) ── */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Post header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ padding: 2, borderRadius: '50%', background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                      <BrandAvatar size={30} borderWidth={2} />
                    </div>
                    <div>
                      <p style={{ color: '#262626', fontSize: 12, fontWeight: 600, lineHeight: 1.2, margin: 0 }}>{BRAND_INSTAGRAM_HANDLE}</p>
                      <p style={{ color: '#8e8e8e', fontSize: 10, lineHeight: 1.2, margin: 0 }}>Sponsored · 1h</p>
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="#262626" style={{ width: 18, height: 18 }}><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                </div>

                {/* Media */}
                {media ? (
                  <img src={media} alt="Post" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1/1', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderTop: '1px solid #efefef', borderBottom: '1px solid #efefef' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="1.5" style={{ width: 36, height: 36 }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span style={{ fontSize: 10, color: '#c7c7c7' }}>Upload media to preview</span>
                  </div>
                )}

                {/* Action icons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" style={{ width: 22, height: 22 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>

                {/* Likes */}
                <p style={{ padding: '0 12px 3px', color: '#262626', fontSize: 12, fontWeight: 600, margin: 0 }}>1,247 likes</p>

                {/* Caption */}
                <div style={{ padding: '2px 12px 4px' }}>
                  <p style={{ color: '#262626', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>{BRAND_INSTAGRAM_HANDLE} </span>
                    {text
                      ? text.length > 100
                        ? <>{text.slice(0, 100)}<span style={{ color: '#8e8e8e' }}> ...more</span></>
                        : text
                      : <span style={{ color: '#c7c7c7', fontStyle: 'italic' }}>Your caption will appear here...</span>
                    }
                  </p>
                </div>
                <p style={{ padding: '0 12px 8px', color: '#8e8e8e', fontSize: 11, margin: 0 }}>View all 4 comments</p>
              </div>

              {/* ── Bottom tab bar ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 20px', borderTop: '1px solid #efefef', background: '#fff', flexShrink: 0 }}>
                {/* Home (active) */}
                <svg viewBox="0 0 24 24" fill="#262626" style={{ width: 24, height: 24 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="#262626" strokeWidth="2"/></svg>
                {/* Search */}
                <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8" style={{ width: 24, height: 24 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {/* Reels */}
                <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8" style={{ width: 24, height: 24 }}><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>
                {/* Shop */}
                <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8" style={{ width: 24, height: 24 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {/* Profile */}
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #262626', overflow: 'hidden', background: '#fff' }}>
                  <img src={BRAND_LOGO_SRC} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared iPhone 16 Pro Black Shell ────────────────────────────────────────

function IPhoneBlackShell({ children, statusDark = false }: { children: React.ReactNode; statusDark?: boolean }) {
  const phoneW = 320;
  const phoneH = 680;
  // Black Titanium: deep charcoal with subtle cold-gray highlights
  const frame = 'linear-gradient(160deg,#3a3a3c 0%,#1c1c1e 20%,#2c2c2e 45%,#111113 70%,#28282a 100%)';
  const innerRim = 'linear-gradient(160deg,#111113 0%,#222224 50%,#0a0a0c 100%)';
  const statusColor = statusDark ? '#fff' : '#000';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', fontFamily: '-apple-system,system-ui,sans-serif' }}>
      <div style={{
        width: phoneW, height: phoneH, borderRadius: 54, padding: 4,
        background: frame,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 0 1.5px rgba(0,0,0,0.6), 0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
        position: 'relative', flexShrink: 0,
      }}>
        {/* Action button */}
        <div style={{ position: 'absolute', left: -3, top: 92, width: 3, height: 28, borderRadius: '2px 0 0 2px', background: frame }} />
        {/* Volume up */}
        <div style={{ position: 'absolute', left: -3, top: 134, width: 3, height: 32, borderRadius: '2px 0 0 2px', background: frame }} />
        {/* Volume down */}
        <div style={{ position: 'absolute', left: -3, top: 178, width: 3, height: 32, borderRadius: '2px 0 0 2px', background: frame }} />
        {/* Power */}
        <div style={{ position: 'absolute', right: -3, top: 148, width: 3, height: 64, borderRadius: '0 2px 2px 0', background: frame }} />

        {/* Inner recessed rim */}
        <div style={{ width: '100%', height: '100%', borderRadius: 51, padding: 2, background: innerRim }}>
          {/* Screen bezel */}
          <div style={{ width: '100%', height: '100%', borderRadius: 49, background: '#000', overflow: 'hidden', position: 'relative' }}>
            {/* Dynamic Island */}
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 112, height: 34, borderRadius: 20, background: '#000', zIndex: 20 }} />

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0', minHeight: 44, position: 'relative', zIndex: 5, background: statusDark ? '#000' : '#fff' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, letterSpacing: -0.3 }}>9:41</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="5" width="3" height="7" rx="0.5" fill={statusColor}/><rect x="4.5" y="3" width="3" height="9" rx="0.5" fill={statusColor}/><rect x="9" y="1" width="3" height="11" rx="0.5" fill={statusColor}/><rect x="13.5" y="0" width="3" height="12" rx="0.5" fill={statusColor} fillOpacity="0.3"/></svg>
                <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill={statusColor}/><path d="M5.6 7.6A3.5 3.5 0 0 1 8 6.6a3.5 3.5 0 0 1 2.4 1l1.3-1.3A5.3 5.3 0 0 0 8 4.8a5.3 5.3 0 0 0-3.7 1.5l1.3 1.3z" fill={statusColor}/><path d="M3.5 5.8A6.5 6.5 0 0 1 8 4a6.5 6.5 0 0 1 4.5 1.8l1.3-1.3A8.3 8.3 0 0 0 8 2.2a8.3 8.3 0 0 0-5.8 2.3l1.3 1.3z" fill={statusColor} fillOpacity="0.35"/></svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={statusColor} strokeOpacity="0.35"/><rect x="2" y="2" width="17" height="8" rx="2" fill={statusColor}/><path d="M23 4v4a2 2 0 0 0 0-4z" fill={statusColor} fillOpacity="0.4"/></svg>
              </div>
            </div>

            {/* Screen content */}
            <div style={{ height: 'calc(100% - 44px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Facebook Preview ─────────────────────────────────────────────────────────

function FacebookPreview({ caption, hashtags, media }: { caption: string; hashtags: string[]; media: string | null }) {
  const text = adaptCaption(caption, hashtags, 'Facebook');
  const border = '1px solid #e4e6eb';

  return (
    <IPhoneBlackShell statusDark={false}>
      <div style={{ flex: 1, background: '#f0f2f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* FB top nav */}
        <div style={{ background: '#fff', borderBottom: border, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="#1877f2" style={{ width: 26, height: 26 }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Search */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2.5" style={{ width: 16, height: 16 }}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            {/* Messenger */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="#050505" style={{ width: 16, height: 16 }}><path d="M12 2C6.477 2 2 6.145 2 11.243c0 3.025 1.517 5.716 3.878 7.472V22l3.547-1.945c.947.261 1.949.4 2.975.4 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2z"/></svg>
            </div>
          </div>
        </div>

        {/* What's on your mind row */}
        <div style={{ background: '#fff', borderBottom: border, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <img src={BRAND_LOGO_SRC} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'contain', background: '#fff', border: '1px solid #e4e6eb', flexShrink: 0 }} />
          <div style={{ flex: 1, background: '#f0f2f5', borderRadius: 20, padding: '8px 14px' }}>
            <span style={{ color: '#65676b', fontSize: 13 }}>What's on your mind, Lucera Offical?</span>
          </div>
        </div>

        {/* Create post modal sheet */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', marginTop: 8, borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>

          {/* Modal header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 14px', borderBottom: border, position: 'relative', flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#050505' }}>Create post</span>
            <div style={{ position: 'absolute', right: 14, width: 28, height: 28, borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="#050505" style={{ width: 14, height: 14 }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </div>
          </div>

          {/* Page identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 6px', flexShrink: 0 }}>
            <img src={BRAND_LOGO_SRC} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'contain', background: '#fff', border: '1px solid #e4e6eb' }} />
            <div>
              <p style={{ color: '#050505', fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>Lucera Offical</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e4e6eb', borderRadius: 6, padding: '2px 7px', marginTop: 3 }}>
                <svg viewBox="0 0 24 24" fill="#050505" style={{ width: 11, height: 11 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#050505' }}>Public</span>
                <svg viewBox="0 0 24 24" fill="#050505" style={{ width: 10, height: 10 }}><path d="M7 10l5 5 5-5z"/></svg>
              </div>
            </div>
          </div>

          {/* Caption text */}
          <div style={{ padding: '4px 14px 8px', flexShrink: 0 }}>
            <p style={{ color: text ? '#050505' : '#bcc0c4', fontSize: 16, lineHeight: 1.4, margin: 0, whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {text || "What's on your mind, Lucera Offical?"}
            </p>
          </div>
          {/* Media preview — full width, outside caption scroll */}
          {media && (
            <div style={{ flexShrink: 0 }}>
              <img src={media} alt="Post" style={{ width: '100%', objectFit: 'cover', maxHeight: 180, display: 'block' }} />
            </div>
          )}

          {/* Background color + emoji row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ffd200,#f7971e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Aa</span>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#65676b" strokeWidth="1.8" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="9"/><path d="M8.5 14s1.5 2 3.5 2 3.5-2 3.5-2"/><circle cx="9" cy="10" r="1" fill="#65676b"/><circle cx="15" cy="10" r="1" fill="#65676b"/></svg>
            </div>
          </div>

          {/* Add to your post bar */}
          <div style={{ border: `1px solid #e4e6eb`, borderRadius: 10, margin: '0 12px 10px', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#050505' }}>Add to your post</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Photo */}
              <svg viewBox="0 0 24 24" fill="#45bd62" style={{ width: 22, height: 22 }}><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              {/* Tag */}
              <svg viewBox="0 0 24 24" fill="#1877f2" style={{ width: 22, height: 22 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {/* Video */}
              <svg viewBox="0 0 24 24" fill="#f02849" style={{ width: 22, height: 22 }}><path d="M15 10l4.553-2.277A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
              {/* Location */}
              <svg viewBox="0 0 24 24" fill="#f5533d" style={{ width: 22, height: 22 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              {/* Emoji */}
              <svg viewBox="0 0 24 24" fill="#f7b928" style={{ width: 22, height: 22 }}><circle cx="12" cy="12" r="10"/><path d="M8.5 14s1.5 2 3.5 2 3.5-2 3.5-2" stroke="#fff" strokeWidth="1.5" fill="none"/><circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/></svg>
              {/* More */}
              <svg viewBox="0 0 24 24" fill="#65676b" style={{ width: 22, height: 22 }}><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
            </div>
          </div>

          {/* Next button */}
          <div style={{ margin: '0 12px 14px', background: '#e4e6eb', borderRadius: 8, padding: '10px 0', textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: text ? '#050505' : '#bcc0c4' }}>Next</span>
          </div>
        </div>
      </div>
    </IPhoneBlackShell>
  );
}

// ─── LinkedIn Preview ─────────────────────────────────────────────────────────

// ─── Twitter / X Preview ──────────────────────────────────────────────────────

function TwitterPreview({ caption, hashtags, media }: { caption: string; hashtags: string[]; media: string | null }) {
  const text = adaptCaption(caption, hashtags, 'Twitter');
  const bg = '#000';
  const sep = '#2f3336';
  const sub = '#71767b';
  const blue = '#1d9bf0';

  const toolbarIcons = [
    <svg key="img" viewBox="0 0 24 24" fill={blue} style={{ width: 19, height: 19 }}><path d="M3 5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm16 9.59l-3-3-4.5 4.5-3-3L5 16.5V19h14v-4.41zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>,
    <svg key="gif" viewBox="0 0 24 24" fill={blue} style={{ width: 19, height: 19 }}><rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke={blue} strokeWidth="1.8"/><text x="5" y="15" fontSize="7" fontWeight="800" fill={blue} fontFamily="sans-serif">GIF</text></svg>,
    <svg key="poll" viewBox="0 0 24 24" fill={blue} style={{ width: 19, height: 19 }}><rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>,
    <svg key="emoji" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="1.8" style={{ width: 19, height: 19 }}><circle cx="12" cy="12" r="9"/><path d="M8.5 14s1.5 2 3.5 2 3.5-2 3.5-2"/><circle cx="9" cy="10" r="1" fill={blue}/><circle cx="15" cy="10" r="1" fill={blue}/></svg>,
    <svg key="sched" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="1.8" style={{ width: 19, height: 19 }}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>,
    <svg key="loc" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="1.8" style={{ width: 19, height: 19 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  ];

  const charsLeft = 280 - text.length;
  const pct = Math.min(text.length / 280, 1);
  const circleR = 9;
  const circleC = 2 * Math.PI * circleR;
  const circleDash = pct * circleC;

  return (
    <IPhoneBlackShell statusDark={true}>
      <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar: × | Drafts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill={sub} style={{ width: 20, height: 20 }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          <span style={{ color: blue, fontSize: 14, fontWeight: 700 }}>Drafts</span>
        </div>

        {/* Compose area */}
        <div style={{ flex: 1, padding: '4px 14px 0', display: 'flex', gap: 10, overflowY: 'auto' }}>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <img src={BRAND_LOGO_SRC} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'contain', background: '#fff', border: `1px solid ${sep}` }} />
            <div style={{ width: 2, flex: 1, background: sep, borderRadius: 1, minHeight: 20 }} />
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingBottom: 8 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{BRAND_TWITTER_HANDLE} </span>
            <p style={{ color: text ? '#fff' : sub, fontSize: 15, lineHeight: 1.5, margin: '6px 0 10px', whiteSpace: 'pre-wrap' }}>
              {text || "What's happening?"}
            </p>
            {media && (
              <img src={media} alt="Post" style={{ width: '100%', borderRadius: 14, objectFit: 'cover', maxHeight: 160, display: 'block', marginBottom: 8 }} />
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: `1px solid ${blue}`, borderRadius: 20, padding: '3px 10px', marginBottom: 4 }}>
              <svg viewBox="0 0 24 24" fill={blue} style={{ width: 13, height: 13 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              <span style={{ color: blue, fontSize: 11, fontWeight: 600 }}>Everyone can reply</span>
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div style={{ borderTop: `1px solid ${sep}`, padding: '8px 14px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {toolbarIcons.map((icon, i) => <div key={i} style={{ cursor: 'default', opacity: 0.9 }}>{icon}</div>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r={circleR} fill="none" stroke={sep} strokeWidth="2"/>
                <circle cx="11" cy="11" r={circleR} fill="none"
                  stroke={charsLeft < 0 ? '#f4212e' : charsLeft < 20 ? '#ffd400' : blue}
                  strokeWidth="2" strokeDasharray={`${circleDash} ${circleC}`}
                  strokeLinecap="round" transform="rotate(-90 11 11)"
                  style={{ transition: 'stroke-dasharray 0.2s' }}/>
                {charsLeft <= 20 && (
                  <text x="11" y="15" textAnchor="middle" fontSize="7" fill={charsLeft < 0 ? '#f4212e' : sub} fontFamily="sans-serif">{charsLeft}</text>
                )}
              </svg>
              <div style={{ width: 1, height: 22, background: sep }} />
              <div style={{ background: '#fff', borderRadius: 20, padding: '6px 14px', cursor: 'default' }}>
                <span style={{ color: '#000', fontSize: 13, fontWeight: 800 }}>Post</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IPhoneBlackShell>
  );
}

// ─── Donation Gauge ───────────────────────────────────────────────────────────

function DonationGauge({ probability }: { probability: number }) {
  const arcLen = 157;
  const filled = probability * arcLen;
  const color = probability > 0.70 ? '#006a6a' : probability > 0.45 ? '#d97706' : '#ba1a1a';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-36">
        <svg viewBox="0 0 120 70" className="w-full">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e7e8e9" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${filled} ${arcLen}`} style={{ transition: 'stroke-dasharray 0.4s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="font-manrope font-extrabold text-2xl leading-none" style={{ color }}>
            {Math.round(probability * 100)}%
          </p>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {probability > 0.70 ? 'High Likelihood' : probability > 0.45 ? 'Moderate' : 'Low Likelihood'}
      </p>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = ['Facebook', 'Instagram', 'Twitter'];
const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PLATFORM_META: Record<Platform, { gradient: string; icon: ReactNode }> = {
  Instagram: {
    gradient: 'from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]',
    icon: <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  },
  Facebook: {
    gradient: 'from-[#1877F2] to-[#0c5dc7]',
    icon: <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  },
  LinkedIn: {
    gradient: 'from-[#0a66c2] to-[#0959aa]',
    icon: <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  },
  Twitter: {
    gradient: 'from-[#111] to-[#333]',
    icon: <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  },
};

const SITE = 'https://intex-ii-eta.vercel.app/';

// CTA scripts keyed by PostType → SentimentTone → CTAType
type CTAKey = `${PostType}:${SentimentTone}`;
const CTA_MATRIX: Partial<Record<CTAKey, Partial<Record<CTAType, { label: string; text: string }[]>>>> = {
  'ImpactStory:Emotional': {
    DonateNow: [
      { label: 'Her story changed everything', text: `Stories like this remind us why we fight. Help us shelter the next survivor → ${SITE}/donate` },
      { label: 'Give her safety tonight', text: `Behind every statistic is a person who deserves safety. Your donation changes that tonight → ${SITE}/donate` },
    ],
    ShareStory: [
      { label: 'Share her story', text: `This story deserves to be heard. Share it so more people know help exists 💙 ${SITE}` },
      { label: 'Reach one more person', text: `One share could reach someone who needs this right now. Please repost 🙏` },
    ],
  },
  'ImpactStory:Hopeful': {
    DonateNow: [
      { label: 'Keep hope alive', text: `Hope is possible because of donors like you. Keep it going → ${SITE}/donate` },
      { label: 'Fund the next chapter', text: `Every survivor deserves a hopeful next chapter. Help write it → ${SITE}/donate` },
    ],
    ShareStory: [
      { label: 'Spread hope', text: `Know someone who needs to hear this? Share this story of hope 💜 ${SITE}` },
    ],
  },
  'ImpactStory:Grateful': {
    DonateNow: [
      { label: 'Gratitude in action', text: `Gratitude turns into hope when you give. Thank you for making this possible → ${SITE}/donate` },
    ],
    LearnMore: [
      { label: 'See full story', text: `Read the full story of impact and healing → ${SITE}/impact` },
    ],
  },
  'Campaign:Urgent': {
    DonateNow: [
      { label: 'Campaign closing soon', text: `We're almost at our goal — but we need you NOW. Donate before midnight → ${SITE}/donate` },
      { label: 'Match deadline', text: `Every dollar matched until midnight. Don't let this opportunity pass → ${SITE}/donate` },
      { label: 'Gap to close', text: `We're $X short of our goal. Close the gap today → ${SITE}/donate` },
    ],
    ShareStory: [
      { label: 'Rally your network', text: `We need everyone. Share this campaign and help us cross the finish line 🏁 ${SITE}` },
    ],
  },
  'Campaign:Celebratory': {
    DonateNow: [
      { label: 'Celebrate by giving', text: `We hit a milestone — now let's set a new one. Celebrate by donating → ${SITE}/donate` },
      { label: 'Keep the momentum', text: `The momentum is real. Keep it going — donate today and be part of the movement → ${SITE}/donate` },
    ],
    ShareStory: [
      { label: 'Celebrate together', text: `We did it — and we're not done. Share the win and keep building 🎉 ${SITE}` },
    ],
  },
  'Campaign:Hopeful': {
    DonateNow: [
      { label: 'Build toward the goal', text: `Every donation brings us closer to the world we're working for. Join us → ${SITE}/donate` },
    ],
    SignUp: [
      { label: 'Follow the journey', text: `Want to stay in the loop as we hit milestones? Sign up for updates → ${SITE}` },
    ],
  },
  'FundraisingAppeal:Urgent': {
    DonateNow: [
      { label: 'Tonight only', text: `We need to raise $X by midnight to keep our doors open. Give now → ${SITE}/donate` },
      { label: 'Beds at risk', text: `Without your help, we may not be able to shelter survivors this week. Please donate → ${SITE}/donate` },
      { label: 'Match window closing', text: `A generous donor is matching every gift — but only until midnight. Act now → ${SITE}/donate` },
    ],
  },
  'FundraisingAppeal:Emotional': {
    DonateNow: [
      { label: 'She needs you', text: `Somewhere tonight, a woman is searching for safety. Your donation answers that call → ${SITE}/donate` },
      { label: 'Real people, real need', text: `This isn't hypothetical. Right now, women need shelter. Donate today → ${SITE}/donate` },
    ],
  },
  'FundraisingAppeal:Hopeful': {
    DonateNow: [
      { label: 'Hope is a gift you give', text: `Hope isn't just a feeling — it's a bed, a meal, a safe door. Give it today → ${SITE}/donate` },
    ],
    SignUp: [
      { label: 'Join the giving community', text: `Become a monthly donor and be hope every single month → ${SITE}/donate` },
    ],
  },
  'ThankYou:Grateful': {
    ShareStory: [
      { label: 'Pass it on', text: `Because of YOU, survivors have hope. Share this thank-you so others can join in 💜 ${SITE}` },
      { label: 'Tag a donor', text: `Know someone who made this possible? Tag them and say thank you 🙏` },
    ],
    DonateNow: [
      { label: 'Keep giving', text: `Your generosity made an impact. Give again to keep the momentum going → ${SITE}/donate` },
    ],
  },
  'ThankYou:Celebratory': {
    ShareStory: [
      { label: 'Celebrate the community', text: `This community showed UP. Share the win and let everyone know what we built together 🎉 ${SITE}` },
    ],
    SignUp: [
      { label: 'Stay connected', text: `Want to be part of every celebration? Sign up for updates → ${SITE}` },
    ],
  },
  'Educational:Informative': {
    LearnMore: [
      { label: 'Go deeper', text: `Want to learn more about how trafficking affects our region? Read the full breakdown → ${SITE}/about` },
      { label: 'Share the facts', text: `Most people don't know this. Share so they do. ${SITE}/about` },
      { label: 'Resources', text: `Know someone who needs help? Share these resources → ${SITE}` },
    ],
    SignUp: [
      { label: 'Stay informed', text: `Follow us for weekly insights on how we're fighting trafficking in our community → ${SITE}` },
    ],
  },
  'Educational:Hopeful': {
    LearnMore: [
      { label: 'The progress is real', text: `Change is possible — and it's already happening. See the evidence → ${SITE}/impact` },
    ],
    DonateNow: [
      { label: 'Fund the education', text: `Awareness saves lives. Help us reach more people with resources → ${SITE}/donate` },
    ],
  },
  'Educational:Urgent': {
    LearnMore: [
      { label: 'Know the signs', text: `This information could save a life. Read and share → ${SITE}/about` },
    ],
    SignUp: [
      { label: 'Get trained', text: `Sign up for our next awareness training — spots are limited → ${SITE}` },
    ],
  },
  'EventPromotion:Celebratory': {
    SignUp: [
      { label: 'Reserve your spot', text: `Spots are filling up fast! Join us at the event → ${SITE}` },
      { label: 'Bring a friend', text: `The more the merrier — bring someone who cares about the mission. RSVP → ${SITE}` },
    ],
    ShareStory: [
      { label: 'Spread the word', text: `Know someone who'd love this event? Share it with them 🎉 ${SITE}` },
    ],
  },
  'EventPromotion:Hopeful': {
    SignUp: [
      { label: 'Be part of the change', text: `Join us for an evening of hope, community, and action. RSVP today → ${SITE}` },
    ],
    DonateNow: [
      { label: 'Sponsor the event', text: `Help us make this event possible for every survivor who attends → ${SITE}/donate` },
    ],
  },
  'EventPromotion:Urgent': {
    SignUp: [
      { label: 'Last chance to register', text: `Registration closes soon — secure your spot now → ${SITE}` },
    ],
  },
};

// Fallback scripts when no matrix match
const CTA_FALLBACK: Record<CTAType, { label: string; text: string }[]> = {
  DonateNow: [
    { label: 'Shelter a survivor', text: `Every dollar you give today shelters a survivor. Donate now → ${SITE}/donate` },
    { label: 'Gift of safety', text: `Your gift provides safety, healing, and hope → ${SITE}/donate` },
  ],
  LearnMore: [
    { label: 'See our impact', text: `Learn how your community is making a difference → ${SITE}/impact` },
    { label: 'Our mission', text: `Discover the work we do every day to protect survivors → ${SITE}/about` },
  ],
  SignUp: [
    { label: 'Join us', text: `Join our community of change-makers. Sign up for updates → ${SITE}` },
    { label: 'Volunteer', text: `Want to make a hands-on difference? Sign up to volunteer → ${SITE}/volunteer` },
  ],
  ShareStory: [
    { label: 'Spread hope', text: `Share this post and spread hope 🙏 ${SITE}` },
    { label: 'Tag a friend', text: `Tag someone who believes in this mission. Together we're stronger 💜 ${SITE}` },
  ],
};

function getDynamicCTAs(postType: PostType, tone: SentimentTone, ctaType: CTAType): { label: string; text: string }[] {
  const key: CTAKey = `${postType}:${tone}`;
  return CTA_MATRIX[key]?.[ctaType] ?? CTA_FALLBACK[ctaType] ?? [];
}

// Hashtag suggestions keyed by PostType → SentimentTone
const HASHTAG_SUGGESTIONS: Partial<Record<CTAKey, string[]>> & { _base: Record<PostType, string[]> } = {
  _base: {
    ImpactStory:       ['survivorstrong', 'lucera', 'humantraffickingawareness', 'safehouses', 'endtrafficking'],
    Campaign:          ['lucera', 'givingseason', 'fundraising', 'makeadifference', 'communityimpact'],
    FundraisingAppeal: ['donate', 'lucera', 'shelter', 'safehouse', 'givingtuesday'],
    ThankYou:          ['grateful', 'community', 'thankful', 'lucera', 'togetherwecan'],
    Educational:       ['awareness', 'humantrafficking', 'knowthesigns', 'education', 'lucera'],
    EventPromotion:    ['event', 'lucera', 'community', 'joinus', 'networking'],
  },
  'ImpactStory:Emotional':    ['emotionalstory', 'survivorvoice', 'healingjourney', 'hopeforsurvivors', 'livechanged'],
  'ImpactStory:Hopeful':      ['hopeful', 'newbeginnings', 'survivorstrong', 'bettertomorrow', 'hopeisreal'],
  'ImpactStory:Grateful':     ['grateful', 'thankful', 'blessed', 'communitycare', 'thankyoudonors'],
  'Campaign:Urgent':          ['urgent', 'actNow', 'deadline', 'helpnow', 'lastchance'],
  'Campaign:Celebratory':     ['milestone', 'wegothere', 'celebrate', 'wedidit', 'progress'],
  'Campaign:Hopeful':         ['togetherwecan', 'buildingbetter', 'makingprogress', 'impact', 'hope'],
  'FundraisingAppeal:Urgent': ['urgent', 'donate', 'helpnow', 'needyou', 'emergency'],
  'FundraisingAppeal:Emotional': ['compassion', 'helpothers', 'sheltersurvivors', 'kindness', 'humanity'],
  'FundraisingAppeal:Hopeful':   ['hopeful', 'givetoday', 'changelife', 'monthlygiver', 'impact'],
  'ThankYou:Grateful':        ['thankyou', 'donors', 'community', 'grateful', 'youmadethishappen'],
  'ThankYou:Celebratory':     ['winning', 'celebrate', 'wedidit', 'community', 'milestone'],
  'Educational:Informative':  ['didyouknow', 'awareness', 'humantrafficking', 'education', 'spreadawareness'],
  'Educational:Hopeful':      ['changeispossible', 'progress', 'awareness', 'hope', 'impact'],
  'Educational:Urgent':       ['knowthesigns', 'critical', 'awareness', 'actfast', 'urgent'],
  'EventPromotion:Celebratory': ['event', 'comejoin', 'celebrate', 'community', 'fun'],
  'EventPromotion:Hopeful':   ['event', 'togetherwegrow', 'community', 'jointhechange', 'hopeful'],
  'EventPromotion:Urgent':    ['lastchance', 'rsvpnow', 'event', 'registernow', 'limited'],
};

const tierColors = { High: 'bg-secondary/10 text-secondary', Medium: 'bg-tertiary-fixed text-on-tertiary-fixed', Low: 'bg-error-container text-error' };
const suggestionIcon = { good: 'check_circle', warning: 'warning', tip: 'lightbulb' };
const suggestionColor = { good: 'text-secondary', warning: 'text-error', tip: 'text-primary' };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialMediaComposer() {
  const [draft, setDraft] = useState<DraftPost>({
    postType: 'ImpactStory', platforms: ['Facebook'], mediaType: 'Photo',
    sentimentTone: 'Emotional', hasCallToAction: true, callToActionType: 'DonateNow',
    featuresResidentStory: false, caption: '', hashtags: [], postHour: 13,
    dayOfWeek: 'Saturday', scheduleLater: false, scheduledAt: '',
  });
  const [activeTab, setActiveTab] = useState<Platform>('Facebook');
  const [hashtagInput, setHashtagInput] = useState('');
  const [media, setMedia] = useState<string | null>(null);           // blob URL — display only
  const [mediaPublicUrl, setMediaPublicUrl] = useState<string | null>(null); // Supabase URL — publish only
  const [copied, setCopied] = useState<Platform | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PlatformResult[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch real insights from backend
  useEffect(() => {
    fetch(`${API}/insights`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setInsights(data); })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }, []);

  const score = scoreDraft(draft, insights);
  const update = useCallback(<K extends keyof DraftPost>(key: K, val: DraftPost[K]) =>
    setDraft(p => ({ ...p, [key]: val })), []);

  const togglePlatform = (p: Platform) => {
    setDraft(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p],
    }));
    if (!draft.platforms.includes(p)) setActiveTab(p);
  };

  const addHashtag = () => {
    const raw = hashtagInput.trim().replace(/^#+/, '');
    if (!raw || draft.hashtags.includes(raw)) { setHashtagInput(''); return; }
    update('hashtags', [...draft.hashtags, raw]);
    setHashtagInput('');
  };

  const removeHashtag = (t: string) => update('hashtags', draft.hashtags.filter(h => h !== t));

  const handleHashtagKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') { e.preventDefault(); addHashtag(); }
    if (e.key === 'Backspace' && !hashtagInput && draft.hashtags.length) update('hashtags', draft.hashtags.slice(0, -1));
  };

  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadFailed, setMediaUploadFailed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const blobUrl = URL.createObjectURL(f);
    setMedia(blobUrl);
    setMediaPublicUrl(null);
    setMediaUploadFailed(false);
    setMediaUploading(true);

    try {
      const ext = f.name.split('.').pop();
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('Social Media Uploads')
        .upload(path, f, { upsert: true });

      if (error) { console.error('Supabase upload error:', error); setMediaUploadFailed(true); showToast(`Upload failed: ${error.message}`); return; }

      const { data } = supabase.storage
        .from('Social Media Uploads')
        .getPublicUrl(path);

      setMediaPublicUrl(data.publicUrl);  // only used for publish API call
      showToast('Photo ready to publish');
    } catch (err) {
      console.error('Supabase upload exception:', err);
      setMediaUploadFailed(true);
      showToast('Upload failed — check Supabase storage permissions');
    } finally {
      setMediaUploading(false);
    }
  };

  const copyCaption = (p: Platform) => {
    navigator.clipboard.writeText(adaptCaption(draft.caption, draft.hashtags, p)).then(() => {
      setCopied(p);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handlePublish = async () => {
    if (!draft.caption.trim()) { showToast('Caption is required'); return; }
    if (!draft.platforms.includes('Facebook')) { showToast('Select Facebook to publish'); return; }
    if (draft.mediaType !== 'Text' && !media) { showToast('Please upload a photo first'); return; }
    if (draft.mediaType !== 'Text' && mediaUploadFailed) { showToast('Photo upload failed — please re-upload the image'); return; }
    if (draft.mediaType !== 'Text' && mediaUploading) { showToast('Photo still uploading — please wait'); return; }
    if (draft.mediaType !== 'Text' && !mediaPublicUrl) { showToast('Photo upload failed — please re-upload the image'); return; }

    setPublishing(true);
    setPublishResults([]);
    try {
      const payload = {
        platforms: ['Facebook'],
        caption: draft.caption,
        mediaType: draft.mediaType,
        mediaUrl: mediaPublicUrl ?? undefined,
        hashtags: draft.hashtags,
        postType: draft.postType,
        sentimentTone: draft.sentimentTone,
        hasCallToAction: draft.hasCallToAction,
        callToActionType: draft.callToActionType,
        featuresResidentStory: draft.featuresResidentStory,
        campaignName: undefined,
      };
      const res = await fetch(`${API}/publish`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.results) {
        setPublishResults(data.results);
      } else {
        setPublishResults([{ platform: 'All', status: 'failed', errorMessage: data.error ?? 'Unknown error' }]);
      }
    } catch (err) {
      setPublishResults([{ platform: 'All', status: 'failed', errorMessage: 'Network error — could not reach backend' }]);
    } finally {
      setPublishing(false);
    }
  };

  const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
  const fmtHour = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

  const previewPlatforms = draft.platforms.length ? draft.platforms : ['Instagram' as Platform];

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/20 bg-surface-container-lowest sticky top-0 z-10">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Admin · Social Media</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-manrope text-2xl font-extrabold text-primary tracking-tight">Post Composer</h1>
              <p className="text-on-surface-variant text-sm mt-0.5">Publish to Facebook · Draft & preview for Instagram and Twitter.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => showToast('Draft saved')} className="bg-surface-container-low text-on-surface px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="aurora-gradient text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {publishing
                  ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  : <span className="material-symbols-outlined text-[16px]">send</span>
                }
                {publishing ? 'Publishing…' : 'Publish to Facebook'}
              </button>
            </div>
          </div>
        </div>

        {/* Publish results banner */}
        {publishResults.length > 0 && (
          <div className="px-6 py-3 border-b border-outline-variant/20 bg-surface-container-lowest flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mr-1">Publish Results</span>
            {publishResults.map((r, i) => {
              const chip =
                r.status === 'published' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                r.status === 'failed'    ? 'bg-error-container text-error border-error/20' :
                                           'bg-surface-container text-on-surface-variant border-outline-variant/30';
              const icon =
                r.status === 'published' ? 'check_circle' :
                r.status === 'failed'    ? 'cancel' :
                                           'visibility';
              return (
                <div key={i} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold ${chip}`}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: r.status === 'published' ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                  <span>{r.platform}</span>
                  {r.status === 'published' && r.permalink && (
                    <a href={r.permalink} target="_blank" rel="noopener noreferrer" className="underline opacity-70 hover:opacity-100 text-[11px]">view</a>
                  )}
                  {r.status === 'failed' && r.errorMessage && (
                    <span className="opacity-70 text-[11px]">— {r.errorMessage}</span>
                  )}
                  {r.status === 'preview_only' && (
                    <span className="opacity-60 text-[11px]">preview only</span>
                  )}
                </div>
              );
            })}
            <button onClick={() => setPublishResults([])} className="ml-auto text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* 3-column layout */}
        <div className="flex h-[calc(100vh-89px)]">

          {/* ── LEFT PANEL: Compose ── */}
          <div className="w-72 flex-shrink-0 border-r border-outline-variant/20 overflow-y-auto bg-surface-container-lowest">
            <div className="p-5 space-y-5">

              {/* Post type */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Post Type</label>
                <select value={draft.postType} onChange={e => update('postType', e.target.value as PostType)}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20">
                  {(['ImpactStory','Campaign','FundraisingAppeal','ThankYou','Educational','EventPromotion'] as PostType[]).map(t => (
                    <option key={t} value={t}>{t.replace(/([A-Z])/g,' $1').trim()}</option>
                  ))}
                </select>
                {insights && (
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Best: <span className="font-bold text-secondary">{insights.bestPostType.replace(/([A-Z])/g,' $1').trim()}</span> at {fmtPct(insights.bestPostTypeRate)}
                  </p>
                )}
              </div>

              {/* Tone */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Sentiment Tone</label>
                <select value={draft.sentimentTone} onChange={e => update('sentimentTone', e.target.value as SentimentTone)}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20">
                  {(['Emotional','Celebratory','Grateful','Hopeful','Urgent','Informative'] as SentimentTone[]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {insights && (
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Best: <span className="font-bold text-secondary">{insights.bestSentimentTone}</span>
                  </p>
                )}
              </div>


              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Caption</label>
                  <span className={`text-[10px] font-bold ${draft.caption.length > 2000 ? 'text-error' : 'text-on-surface-variant'}`}>{draft.caption.length}/2,200</span>
                </div>
                <textarea value={draft.caption} onChange={e => update('caption', e.target.value)}
                  placeholder="Start with your most important message in the first 125 characters..."
                  rows={5} maxLength={2200}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed placeholder:text-on-surface-variant/40" />
              </div>

              {/* CTA Scripts */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">CTA Scripts</label>
                  <span className="text-[9px] text-on-surface-variant/50 normal-case tracking-normal">— for {draft.postType.replace(/([A-Z])/g,' $1').trim()} · {draft.sentimentTone}</span>
                </div>
                <div className="space-y-2">
                  {getDynamicCTAs(draft.postType, draft.sentimentTone, draft.callToActionType).map((script) => (
                    <button
                      key={script.label}
                      onClick={() => update('caption', draft.caption ? `${draft.caption}\n\n${script.text}` : script.text)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-surface-container-low hover:bg-primary/8 border border-outline-variant/20 hover:border-primary/30 transition-all group"
                    >
                      <p className="text-[11px] font-bold text-primary mb-0.5">{script.label}</p>
                      <p className="text-[10px] text-on-surface-variant leading-snug line-clamp-2">{script.text}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-on-surface-variant/50 mt-1.5">Click any script to append it to your caption</p>
              </div>

              {/* Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Hashtags</label>
                  <span className={`text-[10px] font-bold ${draft.hashtags.length === (insights?.optimalHashtagCount ?? 5) ? 'text-secondary' : draft.hashtags.length === 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {draft.hashtags.length}/{insights?.optimalHashtagCount ?? 5} optimal
                  </span>
                </div>
                <div className="bg-surface-container-low rounded-xl p-2 min-h-[44px] flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-primary/20">
                  {draft.hashtags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} className="hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </span>
                  ))}
                  <input value={hashtagInput} onChange={e => setHashtagInput(e.target.value)} onKeyDown={handleHashtagKey} onBlur={addHashtag}
                    placeholder={!draft.hashtags.length ? 'Type a tag, press Enter' : ''}
                    className="flex-1 min-w-[80px] bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40" />
                </div>
                {/* Dynamic suggestions */}
                {(() => {
                  const key: CTAKey = `${draft.postType}:${draft.sentimentTone}`;
                  const toneSpecific = HASHTAG_SUGGESTIONS[key] ?? [];
                  const base = HASHTAG_SUGGESTIONS._base[draft.postType] ?? [];
                  const suggestions = [...new Set([...toneSpecific, ...base])].filter(t => !draft.hashtags.includes(t));
                  if (!suggestions.length) return null;
                  return (
                    <div className="mt-2">
                      <p className="text-[9px] text-on-surface-variant/60 mb-1.5 uppercase tracking-widest font-bold">Suggested</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.slice(0, 10).map(tag => (
                          <button key={tag} onClick={() => update('hashtags', [...draft.hashtags, tag])}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors">
                            <span className="text-[10px]">+</span> #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Post format: Photo or Text */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Post Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Photo', 'Text'] as const).map(opt => (
                    <button key={opt} onClick={() => update('mediaType', opt)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors border ${draft.mediaType === opt ? 'aurora-gradient text-white border-transparent' : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'}`}>
                      <span className="material-symbols-outlined text-[17px]">{opt === 'Photo' ? 'image' : 'notes'}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media upload — only shown for Photo */}
              {draft.mediaType === 'Photo' && (
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Photo</label>
                {media ? (
                  <div className="relative rounded-xl overflow-hidden border border-outline-variant/30 cursor-pointer group"
                    onClick={() => !mediaUploading && fileRef.current?.click()}>
                    <img src={media} alt="Preview" className="w-full max-h-40 object-cover block" />
                    {mediaUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[28px] text-white animate-spin">refresh</span>
                      </div>
                    )}
                    {!mediaUploading && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-[11px] font-bold bg-black/50 px-3 py-1 rounded-full">Change photo</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={mediaUploading}
                    className="w-full border-2 border-dashed border-outline-variant rounded-xl py-6 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <span className="material-symbols-outlined text-[28px] text-on-surface-variant/50">upload</span>
                    <p className="text-xs font-semibold text-on-surface-variant">Upload a photo</p>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleMedia} />
              </div>
              )}

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { key: 'featuresResidentStory' as const, label: 'Resident Story', sub: insights ? `+${Math.round((insights.residentStoryDonationRate - insights.noResidentStoryDonationRate) * 100)}pp donation rate` : '+40% donation rate' },
                  { key: 'hasCallToAction' as const, label: 'Call to Action', sub: insights ? `+${Math.round((insights.ctaWithDonationRate - insights.ctaWithoutDonationRate) * 100)}pp with CTA` : '+8pp with CTA' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{label}</p>
                      <p className="text-[10px] text-on-surface-variant">{sub}</p>
                    </div>
                    <button onClick={() => update(key, !draft[key])}
                      className={`w-11 h-6 rounded-full transition-colors relative ${draft[key] ? 'bg-secondary' : 'bg-surface-container-high'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${draft[key] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
                {draft.hasCallToAction && (
                  <select value={draft.callToActionType} onChange={e => update('callToActionType', e.target.value as CTAType)}
                    className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20">
                    {(['DonateNow','LearnMore','SignUp','ShareStory'] as CTAType[]).map(c => (
                      <option key={c} value={c}>{c.replace(/([A-Z])/g,' $1').trim()}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Platforms */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Platforms</label>
                <div className="space-y-2">
                  {PLATFORMS.map(p => {
                    const isDraftOnly = p === 'Instagram' || p === 'Twitter';
                    return (
                      <button key={p} onClick={() => togglePlatform(p)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-sm font-semibold ${draft.platforms.includes(p) ? 'border-primary/30 bg-primary/5 text-primary' : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${PLATFORM_META[p].gradient} flex items-center justify-center flex-shrink-0`}>
                          {PLATFORM_META[p].icon}
                        </div>
                        <span>{p}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${isDraftOnly ? 'bg-surface-container text-on-surface-variant' : 'bg-secondary/10 text-secondary'}`}>
                          {isDraftOnly ? 'Draft' : 'Publish'}
                        </span>
                        {insights && (
                          <span className="ml-auto text-[10px] text-on-surface-variant font-normal">
                            {fmtPct(insights.platformRates[p] ?? 0)}
                          </span>
                        )}
                        {draft.platforms.includes(p) && (
                          <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-on-surface-variant mt-1.5">% = donation conversion rate from your post history</p>
              </div>

              {/* Timing */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Posting Time</label>
                {(() => {
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();
                  const currentSecond = now.getSeconds();
                  const currentDay = DAYS[(now.getDay() + 6) % 7];
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const ampm = currentHour < 12 ? 'AM' : 'PM';
                  const displayHour = currentHour % 12 || 12;
                  const clockDisplay = `${displayHour}:${pad(currentMinute)}:${pad(currentSecond)} ${ampm}`;
                  const isNearPeak = insights && (currentHour === insights.bestHour || (insights.hourRates?.[currentHour] ?? 0) >= (insights.bestHourRate ?? 0) * 0.9);
                  const isPeakDay = insights && currentDay === insights.bestDay;
                  const suggestion = !insights ? null
                    : isNearPeak && isPeakDay ? { icon: 'star', color: 'bg-secondary/10 text-secondary', msg: 'Great time to post — peak hour and best day' }
                    : isNearPeak ? { icon: 'schedule', color: 'bg-primary/10 text-primary', msg: `Good hour, but ${insights.bestDay} tends to perform better` }
                    : isPeakDay ? { icon: 'schedule', color: 'bg-primary/10 text-primary', msg: `Good day, but ${fmtHour(insights.bestHour)} tends to get more donations` }
                    : { icon: 'info', color: 'bg-surface-container text-on-surface-variant', msg: `Consider posting ${insights.bestDay} at ${fmtHour(insights.bestHour)} for best results` };
                  return (
                    <div className="space-y-2">
                      {/* Live clock */}
                      <div className="rounded-xl bg-surface-container-low px-3 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-on-surface-variant mb-0.5">Right now</p>
                          <p className="text-sm font-bold text-on-surface tabular-nums">{clockDisplay}</p>
                          <p className="text-[11px] text-on-surface-variant">{currentDay}</p>
                        </div>
                        {suggestion && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${suggestion.color}`}>
                            <span className="material-symbols-outlined text-[13px]">{suggestion.icon}</span>
                            {isNearPeak && isPeakDay ? 'Peak now' : isNearPeak ? 'Good hour' : isPeakDay ? 'Good day' : 'Off-peak'}
                          </div>
                        )}
                      </div>

                      {/* Best time banner */}
                      {insights && (
                        <div className="rounded-xl overflow-hidden border border-secondary/20">
                          <div className="bg-secondary/10 px-3 py-1.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[13px] text-secondary">trending_up</span>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Best time to post · from your history</p>
                          </div>
                          <div className="bg-surface-container-low px-3 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-base font-bold text-on-surface">{fmtHour(insights.bestHour)}</p>
                                <p className="text-[11px] text-on-surface-variant">{insights.bestDay}</p>
                              </div>
                              <div className="w-px h-8 bg-outline-variant/30" />
                              <div>
                                <p className="text-base font-bold text-secondary">{fmtPct(insights.bestHourRate)}</p>
                                <p className="text-[11px] text-on-surface-variant">donation rate</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-on-surface-variant">vs. overall avg</p>
                              <p className="text-xs font-bold text-secondary">
                                +{Math.round((insights.bestHourRate - insights.overallDonationRate) * 100)}pp
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Full suggestion text */}
                      {suggestion && !(isNearPeak && isPeakDay) && (
                        <p className="text-[10px] text-on-surface-variant px-1">{suggestion.msg}</p>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>

          {/* ── MIDDLE PANEL: Platform Preview ── */}
          <div className="flex-1 overflow-y-auto bg-surface-container">
            {/* Platform tabs */}
            <div className="flex items-center gap-1 px-6 pt-5 pb-4 sticky top-0 bg-surface-container z-10 border-b border-outline-variant/10">
              {previewPlatforms.map(p => (
                <button key={p} onClick={() => setActiveTab(p)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === p ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${PLATFORM_META[p].gradient} flex items-center justify-center`}>
                    {PLATFORM_META[p].icon}
                  </div>
                  {p}
                </button>
              ))}
            </div>

            {/* Preview area */}
            <div className="p-6">
              {/* Draft banner for Instagram / Twitter */}
              {(activeTab === 'Instagram' || activeTab === 'Twitter') && (
                <div className="max-w-[500px] mx-auto mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit_note</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface">{activeTab} — Draft Preview</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Copy the caption below and paste it when posting manually.</p>
                  </div>
                  <button onClick={() => copyCaption(activeTab)}
                    className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[13px]">{copied === activeTab ? 'check' : 'content_copy'}</span>
                    {copied === activeTab ? 'Copied!' : 'Copy Caption'}
                  </button>
                </div>
              )}

              {activeTab === 'Instagram' && <InstagramPreview caption={draft.caption} hashtags={draft.hashtags} media={media} />}
              {activeTab === 'Facebook' && <FacebookPreview caption={draft.caption} hashtags={draft.hashtags} media={media} />}
              {activeTab === 'Twitter' && <TwitterPreview caption={draft.caption} hashtags={draft.hashtags} media={media} />}

              {/* Copy button for Facebook too */}
              {activeTab === 'Facebook' && (
                <div className="flex justify-center mt-5">
                  <button onClick={() => copyCaption(activeTab)}
                    className="flex items-center gap-2 bg-surface-container-lowest text-on-surface px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[16px]">{copied === activeTab ? 'check' : 'content_copy'}</span>
                    {copied === activeTab ? 'Copied!' : 'Copy Facebook Caption'}
                  </button>
                </div>
              )}

              {/* Char limit bars */}
              <div className="mt-4 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 max-w-[500px] mx-auto">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Character Limits</p>
                <div className="space-y-2">
                  {([['Facebook',63206],['Instagram',2200],['Twitter',280]] as [Platform,number][]).map(([p,lim]) => {
                    const len = adaptCaption(draft.caption, draft.hashtags, p).length;
                    const pct = Math.min(len / lim, 1);
                    const over = len > lim;
                    return (
                      <div key={p} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded bg-gradient-to-br ${PLATFORM_META[p].gradient} flex items-center justify-center flex-shrink-0`}>
                          {PLATFORM_META[p].icon}
                        </div>
                        <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${over ? 'bg-error' : 'bg-secondary'}`} style={{ width: `${pct * 100}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold w-20 text-right ${over ? 'text-error' : 'text-on-surface-variant'}`}>{len}/{lim}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Insights ── */}
          <div className="w-64 flex-shrink-0 border-l border-outline-variant/20 overflow-y-auto bg-surface-container-lowest">
            <div className="p-5 space-y-5">

              {/* Score gauge */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Donation Score</p>
                {insightsLoading ? (
                  <div className="flex justify-center py-4"><span className="material-symbols-outlined text-[28px] text-on-surface-variant/30 animate-spin">refresh</span></div>
                ) : (
                  <>
                    <DonationGauge probability={score.probability} />
                    <div className="flex justify-center mt-2">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${tierColors[score.tier]}`}>{score.tier} Engagement</span>
                    </div>
                  </>
                )}
              </div>

              <div className="h-px bg-outline-variant/20" />

              {/* Pipeline benchmarks (live from API) */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pipeline Benchmarks</p>
                  {!insightsLoading && insights && (
                    <span className="text-[9px] text-on-surface-variant/60">{insights.totalPosts} posts</span>
                  )}
                </div>
                {insightsLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-surface-container rounded-lg animate-pulse" />)}
                  </div>
                ) : insights ? (
                  <div className="space-y-2">
                    {[
                      { label: 'Best platform', value: insights.bestPlatform, sub: fmtPct(insights.bestPlatformRate) + ' donation rate' },
                      { label: 'Peak hour', value: fmtHour(insights.bestHour), sub: fmtPct(insights.bestHourRate) + ' conversion' },
                      { label: 'Best day', value: insights.bestDay, sub: fmtPct(insights.bestDayRate) + ' conversion' },
                      { label: 'Optimal hashtags', value: `${insights.optimalHashtagCount} tags`, sub: 'Peak engagement' },
                      { label: 'Resident story', value: fmtPct(insights.residentStoryDonationRate), sub: `vs ${fmtPct(insights.noResidentStoryDonationRate)} without` },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] text-on-surface-variant leading-tight">{label}</p>
                          <p className="text-[9px] text-on-surface-variant/60 leading-tight">{sub}</p>
                        </div>
                        <p className="text-xs font-bold text-on-surface text-right flex-shrink-0">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-on-surface-variant">Backend offline — connect API for live data</p>
                )}
              </div>

              <div className="h-px bg-outline-variant/20" />

              {/* Suggestions */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">Suggestions</p>
                <div className="space-y-2.5">
                  {score.suggestions.slice(0, 6).map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span className={`material-symbols-outlined text-[15px] flex-shrink-0 mt-0.5 ${suggestionColor[s.type]}`}
                        style={{ fontVariationSettings: s.type === 'good' ? "'FILL' 1" : "'FILL' 0" }}>
                        {suggestionIcon[s.type]}
                      </span>
                      <p className="text-[11px] text-on-surface leading-snug">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-outline-variant/20" />

              {/* Platform rates */}
              {insights && (
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">Platform Comparison</p>
                  <div className="space-y-2">
                    {PLATFORMS.filter(p => insights.platformRates[p] !== undefined).sort((a, b) => (insights.platformRates[b] ?? 0) - (insights.platformRates[a] ?? 0)).map(p => {
                      const rate = insights.platformRates[p] ?? 0;
                      const best = Math.max(...Object.values(insights.platformRates));
                      return (
                        <div key={p} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded bg-gradient-to-br ${PLATFORM_META[p].gradient} flex items-center justify-center flex-shrink-0`}>
                            <div className="scale-75">{PLATFORM_META[p].icon}</div>
                          </div>
                          <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(rate / best) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-on-surface w-8 text-right">{fmtPct(rate)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Model note */}
              <p className="text-[9px] text-on-surface-variant/50 text-center pb-2">
                Scores derived from {insights?.totalPosts ?? '—'} historical posts · 78.8% model accuracy
              </p>

            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
