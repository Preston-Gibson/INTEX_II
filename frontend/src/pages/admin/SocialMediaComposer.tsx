import { useState, useCallback, useRef } from 'react';
import AdminSidebar from '../../components/AdminSidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'Instagram' | 'LinkedIn' | 'Twitter';
type PostType = 'ImpactStory' | 'Campaign' | 'FundraisingAppeal' | 'ThankYou' | 'Educational' | 'EventPromotion';
type MediaType = 'Photo' | 'Video' | 'Reel' | 'Carousel' | 'Text';
type SentimentTone = 'Emotional' | 'Celebratory' | 'Grateful' | 'Hopeful' | 'Urgent' | 'Informative';
type CTAType = 'DonateNow' | 'LearnMore' | 'SignUp' | 'ShareStory' | 'None';
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

interface Suggestion {
  text: string;
  type: 'warning' | 'tip' | 'good';
}

interface ScoreResult {
  probability: number;
  engagementTier: 'Low' | 'Medium' | 'High';
  suggestions: Suggestion[];
}

// ─── ML Scoring (derived from pipeline model findings, 812-post dataset) ──────

function scoreDraft(post: DraftPost): ScoreResult {
  let prob = 0.40;

  const typeScores: Record<PostType, number> = {
    ImpactStory: 0.32,
    Campaign: 0.16,
    FundraisingAppeal: 0.14,
    Educational: 0.04,
    EventPromotion: 0.06,
    ThankYou: -0.08,
  };
  prob += typeScores[post.postType] ?? 0;

  if (post.featuresResidentStory) prob += 0.22;

  const platformScores: Record<Platform, number> = {
    Instagram: 0.08,
    Twitter: 0.02,
    LinkedIn: -0.02,
  };
  if (post.platforms.length > 0) prob += platformScores[post.platforms[0]] ?? 0;

  const mediaScores: Record<MediaType, number> = {
    Reel: 0.12,
    Video: 0.10,
    Carousel: 0.04,
    Photo: 0.02,
    Text: -0.06,
  };
  prob += mediaScores[post.mediaType] ?? 0;

  const n = post.hashtags.length;
  if (n === 5) prob += 0.05;
  else if (n >= 3 && n <= 7) prob += 0.02;
  else if (n === 0) prob -= 0.06;
  else if (n > 10) prob -= 0.03;

  if (post.hasCallToAction) prob += 0.07;
  if (post.callToActionType === 'DonateNow') prob += 0.04;
  else if (post.callToActionType === 'SignUp') prob += 0.02;

  if (post.postHour === 13) prob += 0.08;
  else if (post.postHour >= 17 && post.postHour <= 20) prob += 0.05;
  else if (post.postHour >= 7 && post.postHour <= 12) prob += 0.01;
  else if (post.postHour < 6 || post.postHour > 21) prob -= 0.07;

  if (['Saturday', 'Monday', 'Sunday'].includes(post.dayOfWeek)) prob += 0.04;
  if (post.dayOfWeek === 'Thursday') prob -= 0.05;

  if (['Emotional', 'Celebratory'].includes(post.sentimentTone)) prob += 0.07;
  else if (post.sentimentTone === 'Hopeful') prob += 0.04;
  else if (post.sentimentTone === 'Urgent') prob += 0.03;

  prob = Math.max(0.04, Math.min(0.97, prob));

  let engagementTier: 'Low' | 'Medium' | 'High' = 'Low';
  if (prob > 0.70) engagementTier = 'High';
  else if (prob > 0.48) engagementTier = 'Medium';

  const suggestions: Suggestion[] = [];

  if (post.featuresResidentStory) {
    suggestions.push({ text: 'Resident story included — the #1 donation driver', type: 'good' });
  } else {
    suggestions.push({ text: 'Add a resident story — increases donation probability by ~40%', type: 'warning' });
  }

  if (post.hasCallToAction && post.callToActionType === 'DonateNow') {
    suggestions.push({ text: 'DonateNow is the highest-converting CTA', type: 'good' });
  } else if (!post.hasCallToAction) {
    suggestions.push({ text: 'Posts with a CTA are 8% more likely to drive donations', type: 'warning' });
  }

  if (n === 5) {
    suggestions.push({ text: '5 hashtags — optimal for engagement', type: 'good' });
  } else if (n === 0) {
    suggestions.push({ text: 'Add 5 hashtags for best engagement rate', type: 'warning' });
  } else {
    suggestions.push({ text: `Aim for exactly 5 hashtags (currently ${n})`, type: 'tip' });
  }

  if (post.postType === 'ImpactStory') {
    suggestions.push({ text: 'ImpactStory posts convert at 92.7% — highest type', type: 'good' });
  } else if (post.postType === 'ThankYou') {
    suggestions.push({ text: 'ThankYou posts have 43.9% donation probability — try ImpactStory', type: 'warning' });
  }

  if (['Reel', 'Video'].includes(post.mediaType)) {
    suggestions.push({ text: 'Reel/Video drives 75% donation probability vs 59% for text', type: 'good' });
  } else if (post.mediaType === 'Text') {
    suggestions.push({ text: 'Switch to Reel or Video — 16% more donations on average', type: 'tip' });
  }

  if (post.postHour === 13 || (post.postHour >= 17 && post.postHour <= 20)) {
    suggestions.push({ text: 'Optimal posting window selected', type: 'good' });
  } else {
    suggestions.push({ text: 'Best times: 1pm (peak) or 5–8pm window', type: 'tip' });
  }

  if (post.dayOfWeek === 'Thursday') {
    suggestions.push({ text: 'Thursday is the weakest day — try Saturday or Monday', type: 'tip' });
  }

  return { probability: prob, engagementTier, suggestions };
}

// ─── Caption Adapters ─────────────────────────────────────────────────────────

function adaptCaption(caption: string, hashtags: string[], platform: Platform): string {
  const tagged = hashtags.map(h => (h.startsWith('#') ? h : `#${h}`));
  if (platform === 'Instagram') {
    return caption + (tagged.length ? `\n\n${tagged.join(' ')}` : '');
  }
  if (platform === 'Twitter') {
    const topTags = tagged.slice(0, 2).join(' ');
    const maxBody = 280 - topTags.length - (topTags ? 2 : 0);
    const body = caption.length > maxBody ? caption.slice(0, maxBody - 1) + '…' : caption;
    return body + (topTags ? ` ${topTags}` : '');
  }
  if (platform === 'LinkedIn') {
    const topTags = tagged.slice(0, 3).join(' ');
    return caption + (topTags ? `\n\n${topTags}` : '');
  }
  return caption;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DonationGauge({ probability }: { probability: number }) {
  const arcLength = 157;
  const filled = probability * arcLength;
  const color = probability > 0.75 ? '#006a6a' : probability > 0.50 ? '#d97706' : '#ba1a1a';
  const label = probability > 0.75 ? 'High Likelihood' : probability > 0.50 ? 'Moderate' : 'Low Likelihood';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-36">
        <svg viewBox="0 0 120 70" className="w-full">
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#e7e8e9"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${arcLength}`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="font-manrope font-extrabold text-2xl leading-none" style={{ color }}>
            {Math.round(probability * 100)}%
          </p>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
    </div>
  );
}

function InstagramPreview({ caption, hashtags, mediaPreview }: {
  caption: string;
  hashtags: string[];
  mediaPreview: string | null;
}) {
  const adapted = adaptCaption(caption, hashtags, 'Instagram');
  const preview = adapted || '';
  const fold = 125;

  return (
    <div className="flex justify-center">
      <div className="w-[300px] bg-white rounded-[36px] border-[7px] border-gray-900 shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-2.5 pb-1 bg-white">
          <span className="text-[10px] font-bold text-gray-900">9:41</span>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-2.5" viewBox="0 0 16 12" fill="currentColor">
              <rect x="0" y="4" width="3" height="8" rx="0.5"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5"/>
              <rect x="9" y="0.5" width="3" height="11.5" rx="0.5"/>
              <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" opacity="0.3"/>
            </svg>
            <svg className="w-3 h-2.5" viewBox="0 0 16 12" fill="currentColor">
              <path d="M8 2C4.8 2 2 3.3 0 5.5L2 7.5C3.5 5.8 5.6 4.8 8 4.8s4.5 1 6 2.7L16 5.5C14 3.3 11.2 2 8 2Z" opacity="0.3"/>
              <path d="M8 6c-2.2 0-4.1.9-5.5 2.4L4 10c1-1.1 2.4-1.8 4-1.8s3 .7 4 1.8l1.5-1.6C12.1 6.9 10.2 6 8 6Z"/>
              <circle cx="8" cy="12" r="1.5"/>
            </svg>
            <svg className="w-5 h-2.5" viewBox="0 0 22 12" fill="currentColor">
              <rect x="0" y="1" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/>
              <rect x="1" y="2" width="14" height="8" rx="1.2"/>
              <path d="M19.5 4.5v3a1.5 1.5 0 0 0 0-3Z"/>
            </svg>
          </div>
        </div>

        {/* Instagram top bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
          <span className="font-manrope font-extrabold text-base tracking-tight text-gray-900">Instagram</span>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-gray-900">favorite_border</span>
            <span className="material-symbols-outlined text-[20px] text-gray-900">send</span>
          </div>
        </div>

        {/* Stories row */}
        <div className="flex gap-2.5 px-3 py-2 overflow-x-auto scrollbar-none border-b border-gray-100">
          {['Your story', 'hope', 'relief', 'donate'].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${i === 0 ? 'bg-surface-container border-2 border-dashed border-gray-300' : 'p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}>
                {i === 0
                  ? <span className="material-symbols-outlined text-[18px] text-gray-400">add</span>
                  : <div className="w-full h-full rounded-full bg-primary/20 border-2 border-white" />
                }
              </div>
              <p className="text-[8px] text-gray-600 truncate w-10 text-center">{s}</p>
            </div>
          ))}
        </div>

        {/* Post */}
        <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
          {/* Post header */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: 'linear-gradient(135deg,#003f87,#0056b3)' }}>
                LS
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-900 leading-none">lighthousesanctuary</p>
                <p className="text-[9px] text-gray-400">Sponsored</p>
              </div>
            </div>
            <span className="text-gray-500 text-[16px] font-bold leading-none">···</span>
          </div>

          {/* Media */}
          {mediaPreview ? (
            <img src={mediaPreview} alt="Post media" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,rgba(0,63,135,0.08),rgba(0,106,106,0.08))' }}>
              <span className="material-symbols-outlined text-[44px]" style={{ color: 'rgba(0,63,135,0.3)' }}>image</span>
              <p className="text-[9px] font-medium" style={{ color: 'rgba(0,63,135,0.4)' }}>Upload media to preview</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-3.5">
              <span className="material-symbols-outlined text-[22px] text-gray-900">favorite_border</span>
              <span className="material-symbols-outlined text-[22px] text-gray-900">chat_bubble_outline</span>
              <span className="material-symbols-outlined text-[22px] text-gray-900">send</span>
            </div>
            <span className="material-symbols-outlined text-[22px] text-gray-900">bookmark_border</span>
          </div>

          {/* Likes */}
          <p className="px-3 text-[11px] font-bold text-gray-900">1,247 likes</p>

          {/* Caption */}
          <div className="px-3 pb-1 pt-0.5">
            <p className="text-[11px] leading-relaxed text-gray-900">
              <span className="font-bold">lighthousesanctuary </span>
              {preview.length > 0 ? (
                preview.length > fold ? (
                  <>{preview.slice(0, fold)}<span className="text-gray-400 cursor-pointer"> ...more</span></>
                ) : preview
              ) : (
                <span className="text-gray-300 italic">Your caption will appear here...</span>
              )}
            </p>
          </div>

          {/* Comments */}
          <p className="px-3 text-[10px] text-gray-400 pb-0.5">View all 48 comments</p>
          <p className="px-3 text-[9px] text-gray-300 pb-2 uppercase tracking-wide">2 hours ago</p>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ caption, hashtags }: { caption: string; hashtags: string[] }) {
  const adapted = adaptCaption(caption, hashtags, 'LinkedIn');
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-sm mx-auto">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#003f87,#0056b3)' }}>
          LS
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Lighthouse Sanctuary</p>
          <p className="text-[11px] text-gray-500 leading-tight">Non-profit Organization · 2,841 followers</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[11px] text-gray-400">public</span>
            <p className="text-[10px] text-gray-400">Now</p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {adapted || <span className="text-gray-300 italic">Your caption will appear here...</span>}
        </p>
      </div>
      <div className="w-full h-36 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(0,63,135,0.08),rgba(0,106,106,0.08))' }}>
        <span className="material-symbols-outlined text-[40px]" style={{ color: 'rgba(0,63,135,0.3)' }}>image</span>
      </div>
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <div className="flex">
            <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[7px] text-white">👍</span>
            <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[7px] -ml-1">❤️</span>
          </div>
          <span>142 · 18 comments</span>
        </div>
      </div>
      <div className="flex items-center justify-around px-4 py-1.5 border-t border-gray-100">
        {['thumb_up', 'comment', 'repeat', 'send'].map(icon => (
          <button key={icon} className="flex items-center gap-1 text-gray-500 text-[11px] font-semibold hover:bg-gray-100 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            <span className="capitalize">{icon === 'thumb_up' ? 'Like' : icon === 'comment' ? 'Comment' : icon === 'repeat' ? 'Repost' : 'Send'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TwitterPreview({ caption, hashtags }: { caption: string; hashtags: string[] }) {
  const adapted = adaptCaption(caption, hashtags, 'Twitter');
  return (
    <div className="bg-black rounded-xl border border-gray-800 max-w-sm mx-auto p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#003f87,#0056b3)' }}>
          LS
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <p className="text-sm font-bold text-white">Lighthouse Sanctuary</p>
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.52-1.26-3.91-.8C14.67 2.88 13.43 2 12 2c-1.43 0-2.67.88-3.34 2.19-1.39-.46-2.9-.2-3.91.81-1 1.01-1.26 2.52-.8 3.91C2.88 9.33 2 10.57 2 12c0 1.43.88 2.67 2.19 3.34-.46 1.39-.2 2.9.81 3.91 1.01 1 2.52 1.26 3.91.8C9.33 21.12 10.57 22 12 22c1.43 0 2.67-.88 3.34-2.19 1.39.46 2.9.2 3.91-.81 1-1.01 1.26-2.52.8-3.91 1.31-.67 2.19-1.91 2.19-3.34z"/>
            </svg>
            <p className="text-gray-500 text-sm">@LighthousePH · 2h</p>
          </div>
          <p className="text-sm text-white leading-relaxed mt-1 whitespace-pre-wrap">
            {adapted || <span className="text-gray-600 italic">Your caption will appear here...</span>}
          </p>
          {/* Char count */}
          <p className="text-[10px] text-gray-600 mt-1">{adapted.length} / 280</p>
          {/* Media placeholder */}
          <div className="mt-2 w-full h-32 rounded-xl flex items-center justify-center border border-gray-800" style={{ background: 'rgba(0,63,135,0.15)' }}>
            <span className="material-symbols-outlined text-[32px] text-gray-600">image</span>
          </div>
          {/* Actions */}
          <div className="flex items-center justify-between mt-2 text-gray-500">
            {['chat_bubble_outline', 'repeat', 'favorite_border', 'bar_chart', 'ios_share'].map(icon => (
              <button key={icon} className="hover:text-blue-400 transition-colors">
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PLATFORMS: Platform[] = ['Instagram', 'LinkedIn', 'Twitter'];

const PLATFORM_ICONS: Record<Platform, string> = {
  Instagram: 'photo_camera',
  LinkedIn: 'work',
  Twitter: 'tag',
};

const PLATFORM_COLORS: Record<Platform, string> = {
  Instagram: 'from-purple-500 via-pink-500 to-orange-400',
  LinkedIn: 'from-blue-700 to-blue-500',
  Twitter: 'from-gray-900 to-gray-700',
};

export default function SocialMediaComposer() {
  const [draft, setDraft] = useState<DraftPost>({
    postType: 'ImpactStory',
    platforms: ['Instagram'],
    mediaType: 'Reel',
    sentimentTone: 'Emotional',
    hasCallToAction: true,
    callToActionType: 'DonateNow',
    featuresResidentStory: false,
    caption: '',
    hashtags: [],
    postHour: 13,
    dayOfWeek: 'Saturday',
    scheduleLater: false,
    scheduledAt: '',
  });

  const [activeTab, setActiveTab] = useState<Platform>('Instagram');
  const [hashtagInput, setHashtagInput] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const score = scoreDraft(draft);

  const update = useCallback(<K extends keyof DraftPost>(key: K, value: DraftPost[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  const togglePlatform = (p: Platform) => {
    setDraft(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const addHashtag = () => {
    const raw = hashtagInput.trim().replace(/^#+/, '');
    if (!raw || draft.hashtags.includes(raw)) { setHashtagInput(''); return; }
    update('hashtags', [...draft.hashtags, raw]);
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    update('hashtags', draft.hashtags.filter(h => h !== tag));
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addHashtag();
    }
    if (e.key === 'Backspace' && hashtagInput === '' && draft.hashtags.length > 0) {
      update('hashtags', draft.hashtags.slice(0, -1));
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const copyCaption = (platform: Platform) => {
    const text = adaptCaption(draft.caption, draft.hashtags, platform);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveDraft = () => {
    // Ready to wire to POST /api/social-media/draft
    showToast('Draft saved successfully');
  };

  const handlePostNow = () => {
    if (draft.platforms.length === 0) { showToast('Select at least one platform'); return; }
    if (!draft.caption.trim()) { showToast('Add a caption before posting'); return; }
    // Ready to wire to POST /api/social-media/publish
    showToast('Post queued — connect platform API tokens to go live');
  };

  const hashtagCount = draft.hashtags.length;
  const hashtagColor = hashtagCount === 5 ? 'text-secondary' : hashtagCount === 0 ? 'text-error' : 'text-tertiary';

  const tierColors: Record<string, string> = {
    High: 'bg-secondary/10 text-secondary',
    Medium: 'bg-tertiary-fixed text-on-tertiary-fixed',
    Low: 'bg-error-container text-error',
  };

  const suggestionIcon: Record<string, string> = {
    good: 'check_circle',
    warning: 'warning',
    tip: 'lightbulb',
  };

  const suggestionColor: Record<string, string> = {
    good: 'text-secondary',
    warning: 'text-error',
    tip: 'text-primary',
  };

  const activePlatformsForPreview = draft.platforms.length > 0 ? draft.platforms : PLATFORMS;

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/20 bg-surface-container-lowest sticky top-0 z-10">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Admin · Social Media</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-manrope text-2xl font-extrabold text-primary tracking-tight">Post Composer</h1>
              <p className="text-on-surface-variant text-sm mt-0.5">Create and publish across Instagram, LinkedIn, and Twitter from one place.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                className="bg-surface-container-low text-on-surface px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={handlePostNow}
                className="aurora-gradient text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                {draft.scheduleLater ? 'Schedule Post' : 'Post Now'}
              </button>
            </div>
          </div>
        </div>

        {/* ── 3-Column Layout ── */}
        <div className="flex gap-0 h-[calc(100vh-89px)]">

          {/* ── LEFT: Compose ── */}
          <div className="w-72 flex-shrink-0 border-r border-outline-variant/20 overflow-y-auto bg-surface-container-lowest">
            <div className="p-5 space-y-5">

              {/* Post Type */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Post Type</label>
                <select
                  value={draft.postType}
                  onChange={e => update('postType', e.target.value as PostType)}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(['ImpactStory', 'Campaign', 'FundraisingAppeal', 'ThankYou', 'Educational', 'EventPromotion'] as PostType[]).map(t => (
                    <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Sentiment Tone</label>
                <select
                  value={draft.sentimentTone}
                  onChange={e => update('sentimentTone', e.target.value as SentimentTone)}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(['Emotional', 'Celebratory', 'Grateful', 'Hopeful', 'Urgent', 'Informative'] as SentimentTone[]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Media Type */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Media Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Reel', 'Video', 'Photo', 'Carousel', 'Text'] as MediaType[]).map(m => (
                    <button
                      key={m}
                      onClick={() => update('mediaType', m)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${draft.mediaType === m ? 'aurora-gradient text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Caption</label>
                  <span className={`text-[10px] font-bold ${draft.caption.length > 2000 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {draft.caption.length} / 2,200
                  </span>
                </div>
                <textarea
                  value={draft.caption}
                  onChange={e => update('caption', e.target.value)}
                  placeholder="Write your caption here. Start with your most important message..."
                  rows={5}
                  maxLength={2200}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed placeholder:text-on-surface-variant/40"
                />
              </div>

              {/* Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Hashtags</label>
                  <span className={`text-[10px] font-bold ${hashtagColor}`}>
                    {hashtagCount}/5 {hashtagCount === 5 ? '✓' : 'optimal'}
                  </span>
                </div>
                <div className="bg-surface-container-low rounded-xl p-2 min-h-[44px] flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-primary/20">
                  {draft.hashtags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} className="hover:text-error transition-colors leading-none">
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </span>
                  ))}
                  <input
                    value={hashtagInput}
                    onChange={e => setHashtagInput(e.target.value)}
                    onKeyDown={handleHashtagKeyDown}
                    onBlur={addHashtag}
                    placeholder={draft.hashtags.length === 0 ? 'Type a hashtag, press Enter' : ''}
                    className="flex-1 min-w-[80px] bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">Press Enter or Space to add. 5 hashtags = peak engagement.</p>
              </div>

              {/* Media Upload */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Media</label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-outline-variant rounded-xl py-3 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {mediaPreview ? (
                    <img src={mediaPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <span className="material-symbols-outlined text-[28px] text-on-surface-variant/50">upload</span>
                  )}
                  <p className="text-xs font-semibold text-on-surface-variant">{mediaPreview ? 'Change media' : 'Upload image or video'}</p>
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Resident Story</p>
                    <p className="text-[10px] text-on-surface-variant">+40% donation probability</p>
                  </div>
                  <button
                    onClick={() => update('featuresResidentStory', !draft.featuresResidentStory)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${draft.featuresResidentStory ? 'bg-secondary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${draft.featuresResidentStory ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Call to Action</p>
                    <p className="text-[10px] text-on-surface-variant">+8% donation probability</p>
                  </div>
                  <button
                    onClick={() => update('hasCallToAction', !draft.hasCallToAction)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${draft.hasCallToAction ? 'bg-secondary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${draft.hasCallToAction ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {draft.hasCallToAction && (
                  <select
                    value={draft.callToActionType}
                    onChange={e => update('callToActionType', e.target.value as CTAType)}
                    className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {(['DonateNow', 'LearnMore', 'SignUp', 'ShareStory'] as CTAType[]).map(c => (
                      <option key={c} value={c}>{c.replace(/([A-Z])/g, ' $1').trim()}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Platforms */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Post To</label>
                <div className="space-y-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-sm font-semibold ${draft.platforms.includes(p) ? 'border-primary/30 bg-primary/5 text-primary' : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[p]} flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-[14px] text-white">{PLATFORM_ICONS[p]}</span>
                      </div>
                      {p}
                      {draft.platforms.includes(p) && (
                        <span className="ml-auto material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timing */}
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Posting Time</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-1">Hour (0–23)</p>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={draft.postHour}
                      onChange={e => update('postHour', parseInt(e.target.value) || 0)}
                      className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-1">Day</p>
                    <select
                      value={draft.dayOfWeek}
                      onChange={e => update('dayOfWeek', e.target.value as DayOfWeek)}
                      className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d.slice(0, 3)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Schedule toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update('scheduleLater', false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${!draft.scheduleLater ? 'aurora-gradient text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
                  >
                    Post Now
                  </button>
                  <button
                    onClick={() => update('scheduleLater', true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${draft.scheduleLater ? 'aurora-gradient text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
                  >
                    Schedule
                  </button>
                </div>
                {draft.scheduleLater && (
                  <input
                    type="datetime-local"
                    value={draft.scheduledAt}
                    onChange={e => update('scheduledAt', e.target.value)}
                    className="w-full mt-2 bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                )}
              </div>

            </div>
          </div>

          {/* ── MIDDLE: Platform Preview ── */}
          <div className="flex-1 overflow-y-auto bg-surface-container">
            {/* Platform tabs */}
            <div className="flex items-center gap-1 px-6 pt-5 pb-4">
              {activePlatformsForPreview.map(p => (
                <button
                  key={p}
                  onClick={() => setActiveTab(p)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === p ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${PLATFORM_COLORS[p]} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[11px] text-white">{PLATFORM_ICONS[p]}</span>
                  </div>
                  {p}
                </button>
              ))}
            </div>

            {/* Preview area */}
            <div className="px-6 pb-6">
              {activeTab === 'Instagram' && (
                <InstagramPreview caption={draft.caption} hashtags={draft.hashtags} mediaPreview={mediaPreview} />
              )}
              {activeTab === 'LinkedIn' && (
                <LinkedInPreview caption={draft.caption} hashtags={draft.hashtags} />
              )}
              {activeTab === 'Twitter' && (
                <TwitterPreview caption={draft.caption} hashtags={draft.hashtags} />
              )}

              {/* Copy caption */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => copyCaption(activeTab)}
                  className="flex items-center gap-2 bg-surface-container-lowest text-on-surface px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-surface-container-low transition-colors border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedPlatform === activeTab ? 'check' : 'content_copy'}
                  </span>
                  {copiedPlatform === activeTab ? 'Copied!' : `Copy ${activeTab} Caption`}
                </button>
              </div>

              {/* Char limits note */}
              <div className="mt-4 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Platform Limits</p>
                <div className="space-y-1.5">
                  {[
                    { p: 'Instagram' as Platform, limit: 2200, icon: 'photo_camera', gradient: PLATFORM_COLORS.Instagram },
                    { p: 'LinkedIn' as Platform, limit: 3000, icon: 'work', gradient: PLATFORM_COLORS.LinkedIn },
                    { p: 'Twitter' as Platform, limit: 280, icon: 'tag', gradient: PLATFORM_COLORS.Twitter },
                  ].map(({ p, limit, icon, gradient }) => {
                    const len = adaptCaption(draft.caption, draft.hashtags, p).length;
                    const pct = Math.min(len / limit, 1);
                    const over = len > limit;
                    return (
                      <div key={p} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                          <span className="material-symbols-outlined text-[9px] text-white">{icon}</span>
                        </div>
                        <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${over ? 'bg-error' : 'bg-secondary'}`}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold w-16 text-right ${over ? 'text-error' : 'text-on-surface-variant'}`}>
                          {len}/{limit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Insights ── */}
          <div className="w-64 flex-shrink-0 border-l border-outline-variant/20 overflow-y-auto bg-surface-container-lowest">
            <div className="p-5 space-y-5">

              {/* Score gauge */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Donation Score</p>
                <DonationGauge probability={score.probability} />
                <div className="flex justify-center mt-2">
                  <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${tierColors[score.engagementTier]}`}>
                    {score.engagementTier} Engagement
                  </span>
                </div>
              </div>

              <div className="h-px bg-outline-variant/20" />

              {/* Quick stats from pipeline */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">Pipeline Benchmarks</p>
                <div className="space-y-2">
                  {[
                    { label: 'Best platform', value: 'Instagram', sub: '67.5% donation prob' },
                    { label: 'Peak hour', value: '1pm', sub: '83.8% donation prob' },
                    { label: 'Best day', value: 'Sat–Mon', sub: 'Avoid Thursday' },
                    { label: 'Optimal hashtags', value: '5 tags', sub: 'Peak engagement' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-on-surface-variant leading-tight">{label}</p>
                        <p className="text-[10px] text-on-surface-variant/60 leading-tight">{sub}</p>
                      </div>
                      <p className="text-xs font-bold text-on-surface text-right">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-outline-variant/20" />

              {/* Suggestions */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">Suggestions</p>
                <div className="space-y-2.5">
                  {score.suggestions.slice(0, 6).map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span className={`material-symbols-outlined text-[15px] flex-shrink-0 mt-0.5 ${suggestionColor[s.type]}`} style={{ fontVariationSettings: s.type === 'good' ? "'FILL' 1" : "'FILL' 0" }}>
                        {suggestionIcon[s.type]}
                      </span>
                      <p className="text-[11px] text-on-surface leading-snug">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-outline-variant/20" />

              {/* Perfect post formula */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Perfect Post Formula</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 space-y-1.5">
                  {[
                    { label: 'Type', value: 'Impact Story' },
                    { label: 'Media', value: 'Reel / Video' },
                    { label: 'Resident story', value: 'Yes — always' },
                    { label: 'CTA', value: 'Donate Now' },
                    { label: 'Time', value: 'Sat–Mon 1pm' },
                    { label: 'Hashtags', value: '5 tags' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-2">
                      <p className="text-[10px] text-on-surface-variant">{label}</p>
                      <p className="text-[10px] font-bold text-primary text-right">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-on-surface-variant mt-2 text-center">Based on 812 posts · 78.8% model accuracy</p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg z-50 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}
