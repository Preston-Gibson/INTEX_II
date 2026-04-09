import { useState, useEffect, useRef } from 'react';
import { authHeaders, clearToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/auth`;

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl: string | null;
}

interface Props {
  onClose: () => void;
  onSaved: (updated: { firstName: string; lastName: string; profilePictureUrl: string | null }) => void;
}

const inputCls =
  'w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20';
const labelCls =
  'text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block';

export default function EditProfilePanel({ onClose, onSaved }: Props) {
  const navigate = useNavigate();
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [picture, setPicture]       = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // password section
  const [showPw, setShowPw]         = useState(false);
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwError, setPwError]       = useState<string | null>(null);
  const [pwSuccess, setPwSuccess]   = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    fetch(`${API}/me`, { headers: authHeaders() })
      .then(r => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPicture(data.profilePictureUrl ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  // Handle image file selection — convert to base64
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicture(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API}/me`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, profilePictureUrl: picture }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setSaveError(err?.[0]?.description ?? 'Failed to save. Please try again.');
        return;
      }
      setSaveSuccess(true);
      onSaved({ firstName, lastName, profilePictureUrl: picture });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwError("New passwords don't match."); return; }
    if (newPw.length < 14)   { setPwError('Password must be at least 14 characters.'); return; }
    setPwSaving(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      const res = await fetch(`${API}/me/change-password`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setPwError(err?.[0]?.description ?? 'Incorrect current password.');
        return;
      }
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } finally {
      setPwSaving(false);
    }
  }

  const initials = [firstName, lastName]
    .filter(Boolean)
    .map(s => s.charAt(0))
    .join('')
    .toUpperCase() || profile?.email?.charAt(0).toUpperCase() || '?';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface-container-lowest shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <h2 className="font-headline font-bold text-on-surface text-base">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {loadingProfile ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 rounded-full bg-primary/30 animate-pulse" />
            </div>
          ) : (
            <>
              {/* ── Profile picture ── */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {picture ? (
                    <img
                      src={picture}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-2xl font-bold text-on-primary">
                      {initials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-white text-[14px]">photo_camera</span>
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {picture && (
                  <button
                    type="button"
                    onClick={() => setPicture(null)}
                    className="text-xs text-error hover:underline"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* ── Profile info form ── */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20 pb-1">
                  Account Info
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input
                      className={inputCls}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input
                      className={inputCls}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    className={`${inputCls} opacity-50 cursor-not-allowed`}
                    value={profile?.email ?? ''}
                    disabled
                    title="Email cannot be changed here"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1">Contact an admin to change your email.</p>
                </div>

                {saveError   && <p className="text-xs text-error">{saveError}</p>}
                {saveSuccess && <p className="text-xs text-secondary font-semibold">✓ Profile saved!</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#00696b' }}
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </form>

              {/* ── Password section ── */}
              <div>
                <button
                  type="button"
                  onClick={() => { setShowPw(v => !v); setPwError(null); setPwSuccess(false); }}
                  className="flex items-center justify-between w-full text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20 pb-1"
                >
                  <span>Change Password</span>
                  <span className="material-symbols-outlined text-[16px]">
                    {showPw ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showPw && (
                  <form onSubmit={handleChangePassword} className="space-y-3 mt-4">
                    <div>
                      <label className={labelCls}>Current Password</label>
                      <input
                        type="password"
                        className={inputCls}
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>New Password</label>
                      <input
                        type="password"
                        className={inputCls}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        required
                        minLength={14}
                      />
                      <p className="text-[10px] text-on-surface-variant mt-1">Minimum 14 characters.</p>
                    </div>
                    <div>
                      <label className={labelCls}>Confirm New Password</label>
                      <input
                        type="password"
                        className={inputCls}
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        required
                      />
                    </div>

                    {pwError   && <p className="text-xs text-error">{pwError}</p>}
                    {pwSuccess && <p className="text-xs text-secondary font-semibold">✓ Password changed!</p>}

                    <button
                      type="submit"
                      disabled={pwSaving}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-error hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {pwSaving ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>

              {/* Sign Out */}
              <div className="pt-2">
                <button
                  onClick={() => { clearToken(); navigate('/login'); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-error border border-error/30 hover:bg-error/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
