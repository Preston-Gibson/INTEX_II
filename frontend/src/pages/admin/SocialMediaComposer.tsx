import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { authHeaders } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/social-media`;

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
  return (
    <div className="flex justify-center">
      {/* Phone shell */}
      <div className="w-[320px] bg-black rounded-[48px] border-[8px] border-gray-900 shadow-2xl overflow-hidden relative" style={{ boxShadow: '0 0 0 2px #333, 0 25px 60px rgba(0,0,0,0.5)' }}>
        {/* Dynamic island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
        {/* Screen */}
        <div className="bg-white overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-white">
            <span className="text-[11px] font-bold text-black">9:41</span>
            <div className="w-24" />
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-3" viewBox="0 0 18 12" fill="black"><rect x="0" y="4" width="3" height="8" rx="0.5"/><rect x="5" y="2" width="3" height="10" rx="0.5"/><rect x="10" y="0" width="3" height="12" rx="0.5"/><rect x="15" y="0" width="3" height="12" rx="0.5" opacity="0.25"/></svg>
              <svg className="w-4 h-3" viewBox="0 0 18 12" fill="black"><path d="M9 2.5C5.8 2.5 3 3.8 1 5.9l2 2C4.5 6.2 6.6 5.2 9 5.2s4.5 1 6 2.7l2-2C15 3.8 12.2 2.5 9 2.5Z" opacity="0.3"/><path d="M9 7c-2 0-3.8.8-5.1 2.1L5.8 11C6.9 9.8 8 9.3 9 9.3s2.1.5 3.2 1.7L14.1 9C12.8 7.8 11 7 9 7Z"/><circle cx="9" cy="12" r="1.5"/></svg>
              <svg className="w-6 h-3" viewBox="0 0 24 12" fill="black"><rect x="0" y="1" width="20" height="10" rx="2" stroke="black" strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="15" height="7" rx="1"/><path d="M21.5 4.5v3a1.5 1.5 0 0 0 0-3Z"/></svg>
            </div>
          </div>
          {/* IG top nav */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <span className="font-bold text-lg text-black tracking-tight" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Instagram</span>
            <div className="flex items-center gap-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
          </div>
          {/* Stories */}
          <div className="flex gap-3 px-3 py-2.5 overflow-x-auto border-b border-gray-100">
            {[{ label: 'Your story', add: true }, { label: 'hope', add: false }, { label: 'relief', add: false }, { label: 'giving', add: false }, { label: 'impact', add: false }].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center ${s.add ? 'border-2 border-dashed border-gray-300' : 'p-[2px]'}`}
                  style={!s.add ? { background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' } : {}}>
                  {s.add
                    ? <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center"><svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14M5 12h14"/></svg></div>
                    : <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-white" />
                  }
                </div>
                <p className="text-[10px] text-gray-700 truncate w-[52px] text-center leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Post */}
          <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
            {/* Post header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{ background: 'linear-gradient(135deg,#003f87,#0056b3)' }}>LS</div>
                <div>
                  <p className="text-[12px] font-semibold text-black leading-tight">lighthousesanctuary</p>
                  <p className="text-[10px] text-gray-500 leading-tight">Cebu City, Philippines</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-[11px] font-bold text-blue-500">Following</button>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </div>
            </div>
            {/* Image */}
            {media ? (
              <img src={media} alt="Post" className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,rgba(0,63,135,0.07),rgba(0,106,106,0.07))' }}>
                <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p className="text-[10px] text-gray-400">Upload media to preview</p>
              </div>
            )}
            {/* Actions */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </div>
            {/* Likes */}
            <p className="px-3 text-[12px] font-semibold text-black">1,247 likes</p>
            {/* Caption */}
            <div className="px-3 py-1">
              <p className="text-[12px] leading-relaxed text-black">
                <span className="font-semibold">lighthousesanctuary </span>
                {text
                  ? text.length > 120
                    ? <>{text.slice(0, 120)}<span className="text-gray-400"> ...more</span></>
                    : text
                  : <span className="text-gray-300 italic">Your caption will appear here...</span>
                }
              </p>
            </div>
            <p className="px-3 text-[11px] text-gray-400 pb-1">View all 48 comments</p>
            {/* Add comment bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
              <p className="text-[11px] text-gray-400">Add a comment…</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({ caption, hashtags, media }: { caption: string; hashtags: string[]; media: string | null }) {
  const text = adaptCaption(caption, hashtags, 'Facebook');
  return (
    <div className="max-w-[500px] mx-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden font-sans">
      {/* Post header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg,#003f87,#0056b3)' }}>LS</div>
          <div>
            <p className="text-[14px] font-semibold text-black leading-tight hover:underline cursor-pointer">Lighthouse Sanctuary</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[12px] text-gray-500">2h ·</p>
              <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
          <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>
      {/* Caption */}
      <div className="px-4 pb-2">
        <p className="text-[14px] text-black leading-relaxed whitespace-pre-wrap">
          {text || <span className="text-gray-400 italic">Your caption will appear here...</span>}
        </p>
      </div>
      {/* Media */}
      {media ? (
        <img src={media} alt="Post" className="w-full object-cover" style={{ maxHeight: 400 }} />
      ) : (
        <div className="w-full h-52 flex flex-col items-center justify-center gap-2" style={{ background: '#e4e6eb' }}>
          <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          <p className="text-[12px] text-gray-500">Upload media to preview</p>
        </div>
      )}
      {/* Reactions row */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-0.5">
            {['#1877F2', '#F02849', '#F5C518'].map((c, i) => (
              <div key={i} className="w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center text-[9px]" style={{ background: c }}>
                {i === 0 ? '👍' : i === 1 ? '❤️' : '😮'}
              </div>
            ))}
          </div>
          <p className="text-[13px] text-gray-600">1.2K</p>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-gray-500">
          <span className="hover:underline cursor-pointer">142 comments</span>
          <span className="hover:underline cursor-pointer">38 shares</span>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex items-center divide-x divide-gray-100 px-2 py-1">
        {[
          { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>, label: 'Like', color: 'text-gray-600 hover:text-[#1877F2]' },
          { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: 'Comment', color: 'text-gray-600 hover:text-gray-900' },
          { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, label: 'Share', color: 'text-gray-600 hover:text-gray-900' },
        ].map(({ icon, label, color }) => (
          <button key={label} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${color}`}>
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LinkedInPreview({ caption, hashtags, media }: { caption: string; hashtags: string[]; media: string | null }) {
  const text = adaptCaption(caption, hashtags, 'LinkedIn');
  const [expanded, setExpanded] = useState(false);
  const fold = 200;
  return (
    <div className="max-w-[500px] mx-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" style={{ fontFamily: '-apple-system,system-ui,sans-serif' }}>
      {/* Post header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-black" style={{ background: 'linear-gradient(135deg,#003f87,#0056b3)' }}>LS</div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-black leading-tight hover:text-[#0a66c2] cursor-pointer">Lighthouse Sanctuary</p>
          <p className="text-[12px] text-gray-500 leading-tight mt-0.5">Non-profit Organization · 2,841 followers</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[12px] text-gray-500">2h ·</p>
            <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-[#0a66c2] text-[14px] font-semibold border border-[#0a66c2] rounded-full px-4 py-1.5 hover:bg-blue-50 transition-colors flex-shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
          Follow
        </button>
      </div>
      {/* Caption */}
      <div className="px-4 pb-3">
        <p className="text-[14px] text-black leading-relaxed whitespace-pre-wrap">
          {text
            ? (text.length > fold && !expanded)
              ? <>{text.slice(0, fold)}<button className="text-gray-500 font-semibold" onClick={() => setExpanded(true)}>…see more</button></>
              : text
            : <span className="text-gray-400 italic">Your caption will appear here...</span>
          }
        </p>
      </div>
      {/* Media */}
      {media ? (
        <img src={media} alt="Post" className="w-full object-cover" style={{ maxHeight: 350 }} />
      ) : (
        <div className="w-full h-44 flex flex-col items-center justify-center gap-2" style={{ background: '#f3f2ef' }}>
          <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          <p className="text-[12px] text-gray-500">Upload media to preview</p>
        </div>
      )}
      {/* Reactions */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-0.5">
            {[{ bg: '#378fe9', emoji: '👍' }, { bg: '#c0392b', emoji: '❤️' }, { bg: '#f39c12', emoji: '💡' }].map((r, i) => (
              <div key={i} className="w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center text-[9px]" style={{ background: r.bg }}>{r.emoji}</div>
            ))}
          </div>
          <p className="text-[12px] text-gray-500 hover:text-[#0a66c2] hover:underline cursor-pointer">842 · 94 comments</p>
        </div>
        <p className="text-[12px] text-gray-500 hover:text-[#0a66c2] hover:underline cursor-pointer">27 reposts</p>
      </div>
      {/* Actions */}
      <div className="flex items-center px-2 py-1">
        {[
          { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>, label: 'Like' },
          { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: 'Comment' },
          { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>, label: 'Repost' },
          { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>, label: 'Send' },
        ].map(({ icon, label }) => (
          <button key={label} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded text-[12px] font-medium text-gray-600 hover:bg-gray-100 hover:text-black transition-colors">
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TwitterPreview({ caption, hashtags, media }: { caption: string; hashtags: string[]; media: string | null }) {
  const text = adaptCaption(caption, hashtags, 'Twitter');
  return (
    <div className="max-w-[500px] mx-auto rounded-2xl overflow-hidden border border-gray-800" style={{ background: '#000', fontFamily: '-apple-system,system-ui,sans-serif' }}>
      {/* X Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button className="text-gray-500">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        <button className="text-white text-[14px] font-bold bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-full">Subscribe</button>
      </div>
      {/* Post */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-black" style={{ background: 'linear-gradient(135deg,#003f87,#0056b3)' }}>LS</div>
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[15px] font-bold text-white">Lighthouse Sanctuary</span>
                <svg className="w-4 h-4 text-[#1d9bf0] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.52-1.26-3.91-.8C14.67 2.88 13.43 2 12 2c-1.43 0-2.67.88-3.34 2.19-1.39-.46-2.9-.2-3.91.81-1 1.01-1.26 2.52-.8 3.91C2.88 9.33 2 10.57 2 12c0 1.43.88 2.67 2.19 3.34-.46 1.39-.2 2.9.81 3.91 1.01 1 2.52 1.26 3.91.8C9.33 21.12 10.57 22 12 22c1.43 0 2.67-.88 3.34-2.19 1.39.46 2.9.2 3.91-.81 1-1.01 1.26-2.52.8-3.91 1.31-.67 2.19-1.91 2.19-3.34z"/></svg>
                <span className="text-[15px] text-gray-500">@LighthousePH · 2h</span>
              </div>
              <button className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </button>
            </div>
            <p className="text-[15px] text-white leading-relaxed mt-1 whitespace-pre-wrap">
              {text || <span className="text-gray-600 italic">Your caption will appear here...</span>}
            </p>
            {/* Char meter */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#1d9bf0] rounded-full transition-all" style={{ width: `${Math.min(text.length / 280, 1) * 100}%`, background: text.length > 280 ? '#f4212e' : '#1d9bf0' }} />
              </div>
              <span className={`text-[12px] font-medium ${text.length > 280 ? 'text-[#f4212e]' : 'text-gray-500'}`}>{280 - text.length}</span>
            </div>
            {/* Media */}
            {media ? (
              <img src={media} alt="Post" className="mt-3 w-full rounded-2xl object-cover" style={{ maxHeight: 300 }} />
            ) : (
              <div className="mt-3 w-full h-36 rounded-2xl flex flex-col items-center justify-center gap-2 border border-gray-800">
                <svg className="w-8 h-8 text-gray-700" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                <p className="text-[11px] text-gray-600">Upload media to preview</p>
              </div>
            )}
            {/* Action row */}
            <div className="flex items-center justify-between mt-3 text-gray-500">
              {[
                { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, count: '84' },
                { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>, count: '231' },
                { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, count: '1.2K' },
                { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, count: '42K' },
                { icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>, count: '' },
              ].map(({ icon, count }, i) => (
                <button key={i} className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors group">
                  <span className="group-hover:bg-[#1d9bf0]/10 rounded-full p-1.5 transition-colors">{icon}</span>
                  {count && <span className="text-[13px]">{count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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

const PLATFORMS: Platform[] = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter'];
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

const tierColors = { High: 'bg-secondary/10 text-secondary', Medium: 'bg-tertiary-fixed text-on-tertiary-fixed', Low: 'bg-error-container text-error' };
const suggestionIcon = { good: 'check_circle', warning: 'warning', tip: 'lightbulb' };
const suggestionColor = { good: 'text-secondary', warning: 'text-error', tip: 'text-primary' };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialMediaComposer() {
  const [draft, setDraft] = useState<DraftPost>({
    postType: 'ImpactStory', platforms: ['Instagram'], mediaType: 'Reel',
    sentimentTone: 'Emotional', hasCallToAction: true, callToActionType: 'DonateNow',
    featuresResidentStory: false, caption: '', hashtags: [], postHour: 13,
    dayOfWeek: 'Saturday', scheduleLater: false, scheduledAt: '',
  });
  const [activeTab, setActiveTab] = useState<Platform>('Instagram');
  const [hashtagInput, setHashtagInput] = useState('');
  const [media, setMedia] = useState<string | null>(null);
  const [copied, setCopied] = useState<Platform | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
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

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setMedia(URL.createObjectURL(f));
  };

  const copyCaption = (p: Platform) => {
    navigator.clipboard.writeText(adaptCaption(draft.caption, draft.hashtags, p)).then(() => {
      setCopied(p);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

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
              <p className="text-on-surface-variant text-sm mt-0.5">Compose once, preview and publish across Instagram, Facebook, LinkedIn, and Twitter.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => showToast('Draft saved')} className="bg-surface-container-low text-on-surface px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">
                Save Draft
              </button>
              <button
                onClick={() => { if (!draft.caption.trim()) { showToast('Add a caption first'); return; } showToast('Connect platform API tokens to publish live'); }}
                className="aurora-gradient text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                {draft.scheduleLater ? 'Schedule' : 'Post Now'}
              </button>
            </div>
          </div>
        </div>

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

              {/* Media type */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Media Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Reel','Video','Photo','Carousel','Text'] as MediaType[]).map(m => (
                    <button key={m} onClick={() => update('mediaType', m)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${draft.mediaType === m ? 'aurora-gradient text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>
                      {m}
                    </button>
                  ))}
                </div>
                {insights && (
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Best: <span className="font-bold text-secondary">{insights.bestMediaType}</span> at {fmtPct(insights.bestMediaTypeRate)}
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
              </div>

              {/* Media upload */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Media</label>
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-outline-variant rounded-xl py-3 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  {media
                    ? <img src={media} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                    : <span className="material-symbols-outlined text-[28px] text-on-surface-variant/50">upload</span>
                  }
                  <p className="text-xs font-semibold text-on-surface-variant">{media ? 'Change media' : 'Upload image or video'}</p>
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMedia} />
              </div>

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
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Post To</label>
                <div className="space-y-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-sm font-semibold ${draft.platforms.includes(p) ? 'border-primary/30 bg-primary/5 text-primary' : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${PLATFORM_META[p].gradient} flex items-center justify-center flex-shrink-0`}>
                        {PLATFORM_META[p].icon}
                      </div>
                      <span>{p}</span>
                      {insights && (
                        <span className="ml-auto text-[10px] text-on-surface-variant font-normal">
                          {fmtPct(insights.platformRates[p] ?? 0)}
                        </span>
                      )}
                      {draft.platforms.includes(p) && (
                        <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-on-surface-variant mt-1.5">% = donation conversion rate from your post history</p>
              </div>

              {/* Timing */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Posting Time</label>
                {insights && (
                  <p className="text-[10px] text-on-surface-variant mb-2">
                    Best: <span className="font-bold text-secondary">{insights.bestDay} {fmtHour(insights.bestHour)}</span>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-1">Hour (0–23)</p>
                    <input type="number" min={0} max={23} value={draft.postHour} onChange={e => update('postHour', parseInt(e.target.value) || 0)}
                      className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-1">Day</p>
                    <select value={draft.dayOfWeek} onChange={e => update('dayOfWeek', e.target.value as DayOfWeek)}
                      className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20">
                      {DAYS.map(d => <option key={d} value={d}>{d.slice(0,3)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(['Post Now', 'Schedule'] as const).map(opt => (
                    <button key={opt} onClick={() => update('scheduleLater', opt === 'Schedule')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${(opt === 'Schedule') === draft.scheduleLater ? 'aurora-gradient text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                {draft.scheduleLater && (
                  <input type="datetime-local" value={draft.scheduledAt} onChange={e => update('scheduledAt', e.target.value)}
                    className="w-full mt-2 bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20" />
                )}
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
              {activeTab === 'Instagram' && <InstagramPreview caption={draft.caption} hashtags={draft.hashtags} media={media} />}
              {activeTab === 'Facebook' && <FacebookPreview caption={draft.caption} hashtags={draft.hashtags} media={media} />}
              {activeTab === 'LinkedIn' && <LinkedInPreview caption={draft.caption} hashtags={draft.hashtags} media={media} />}
              {activeTab === 'Twitter' && <TwitterPreview caption={draft.caption} hashtags={draft.hashtags} media={media} />}

              {/* Copy button */}
              <div className="flex justify-center mt-5">
                <button onClick={() => copyCaption(activeTab)}
                  className="flex items-center gap-2 bg-surface-container-lowest text-on-surface px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-surface-container-low transition-colors border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[16px]">{copied === activeTab ? 'check' : 'content_copy'}</span>
                  {copied === activeTab ? 'Copied!' : `Copy ${activeTab} Caption`}
                </button>
              </div>

              {/* Char limit bars */}
              <div className="mt-4 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 max-w-[500px] mx-auto">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Character Limits</p>
                <div className="space-y-2">
                  {([['Instagram',2200],['Facebook',63206],['LinkedIn',3000],['Twitter',280]] as [Platform,number][]).map(([p,lim]) => {
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
