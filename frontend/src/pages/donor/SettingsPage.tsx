import { useState } from 'react';
import { getUser, authHeaders } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/users`;

const inputCls =
  'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <h2 className="text-base font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  loading,
  confirmLabel,
  danger,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  confirmLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6">
      <button
        onClick={onCancel}
        className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${
          danger ? 'bg-error' : ''
        }`}
        style={!danger ? { backgroundColor: '#00696b' } : undefined}
      >
        {loading ? 'Saving…' : confirmLabel}
      </button>
    </div>
  );
}

type ModalMode = 'edit-profile' | 'change-password' | null;

export default function SettingsPage() {
  const user = getUser();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  });

  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirm: '' });

  const closeModal = () => {
    setModalMode(null);
    setFormError(null);
    setSaving(false);
    setPasswordForm({ newPassword: '', confirm: '' });
  };

  const openEditProfile = () => {
    setProfileForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
    });
    setFormError(null);
    setModalMode('edit-profile');
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/${user.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.[0]?.description ?? err?.title ?? 'Failed to update profile.');
        return;
      }
      setSuccessMsg('Profile updated. Please log out and back in to see changes.');
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id) return;
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/${user.id}/reset-password`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.[0]?.description ?? err?.title ?? 'Failed to change password.');
        return;
      }
      setSuccessMsg('Password changed successfully.');
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Account Control Center</p>
        <h2 className="font-manrope text-3xl font-extrabold text-primary mb-2">Manage your sanctuary presence</h2>
        <p className="text-on-surface-variant text-sm">
          Update your profile, refine your impact reporting preferences, and secure your payment methods to continue supporting our children.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-500 hover:text-green-700">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Personal Info */}
        <div className="col-span-2 space-y-4">
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                <p className="font-manrope font-bold text-on-surface">Personal Information</p>
              </div>
              <button
                onClick={openEditProfile}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-6">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-sm font-semibold text-on-surface">{displayName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-sm font-semibold text-on-surface">{user?.email ?? '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Profile Photo</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-outline-variant/20">
                  <span className="text-on-primary font-bold text-xl">{user?.initials ?? '?'}</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-surface-container rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">
                    Change Photo
                  </button>
                  <button className="px-4 py-2 text-sm font-semibold text-error hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
                <div>
                  <p className="font-manrope font-bold text-on-surface">Password</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Change your account password</p>
                </div>
              </div>
              <button
                onClick={() => { setFormError(null); setModalMode('change-password'); }}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-on-surface h-44">
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 to-on-surface/40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/10 text-[80px]">groups</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-secondary-fixed text-lg font-bold mb-1">"</p>
              <p className="text-white text-[11px] italic leading-relaxed mb-2">
                "Knowing {user?.firstName ?? 'our donors are'} standing with us gives our community the strength to build a better future for every child here."
              </p>
              <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest">— Maria, Program Director</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-xl">
        <div>
          <p className="text-sm font-bold text-on-surface">Privacy &amp; Security</p>
          <p className="text-xs text-on-surface-variant">Your data is encrypted and protected by Guardian Shield Protocols.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">
            Download Data
          </button>
          <button className="px-4 py-2 border-2 border-error/40 rounded-xl text-sm font-semibold text-error hover:bg-error/5 transition-colors">
            Deactivate Account
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {modalMode === 'edit-profile' && (
        <Modal title="Edit Profile" onClose={closeModal}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <input
                  className={inputCls}
                  value={profileForm.firstName}
                  onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                />
              </Field>
              <Field label="Last Name">
                <input
                  className={inputCls}
                  value={profileForm.lastName}
                  onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Email Address">
              <input
                type="email"
                className={inputCls}
                value={profileForm.email}
                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
              />
            </Field>
          </div>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleSaveProfile} loading={saving} confirmLabel="Save Changes" />
        </Modal>
      )}

      {/* Change Password Modal */}
      {modalMode === 'change-password' && (
        <Modal title="Change Password" onClose={closeModal}>
          <div className="space-y-4">
            <Field label="New Password">
              <input
                type="password"
                className={inputCls}
                placeholder="Min. 14 characters"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                className={inputCls}
                placeholder="Repeat new password"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              />
            </Field>
          </div>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleChangePassword} loading={saving} confirmLabel="Change Password" />
        </Modal>
      )}
    </div>
  );
}
