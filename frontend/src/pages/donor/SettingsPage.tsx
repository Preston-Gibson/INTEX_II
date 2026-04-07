import { useState } from 'react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    impactReports: true,
    taxDocuments: true,
    emergencyAppeals: false,
  });

  const toggle = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

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

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Personal Info + Payment Methods */}
        <div className="col-span-2 space-y-4">
          {/* Personal Information */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                <p className="font-manrope font-bold text-on-surface">Personal Information</p>
              </div>
              <button className="text-xs text-primary font-bold hover:underline">Edit All</button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-6">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-sm font-semibold text-on-surface">Alex Rivera</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-sm font-semibold text-on-surface">alex.rivera@guardian.org</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Phone Number</p>
                <p className="text-sm font-semibold text-on-surface">+1 (555) 234-8901</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-semibold text-on-surface">Austin, Texas</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Profile Photo</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-outline-variant/20">
                  <span className="material-symbols-outlined text-outline-variant text-[32px]">person</span>
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

          {/* Payment Methods */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">credit_card</span>
                <p className="font-manrope font-bold text-on-surface">Payment Methods</p>
              </div>
              <button className="flex items-center gap-1 aurora-gradient text-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[14px]">add</span>
                Add Card
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'VISA', name: 'Visa ending in 4421', sub: 'Expires 09/26 • Primary Method', primary: true },
                { label: 'MC', name: 'Mastercard ending in 8802', sub: 'Expires 02/25', primary: false },
              ].map(({ label, name, sub, primary }) => (
                <div key={name} className={`flex items-center gap-3 p-4 rounded-xl ${primary ? 'bg-surface-container' : 'bg-surface-container-low'}`}>
                  <div className="w-10 h-7 rounded bg-surface-container-high flex items-center justify-center text-[10px] font-extrabold text-on-surface-variant">
                    {label}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{name}</p>
                    <p className="text-xs text-on-surface-variant">{sub}</p>
                  </div>
                  <button>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">more_vert</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Notifications */}
          <div className="aurora-gradient rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[20px]">mail</span>
              <p className="font-manrope font-bold">Notifications</p>
            </div>
            <div className="space-y-4 mb-5">
              {[
                { key: 'impactReports' as const, label: 'Impact Reports', desc: 'Monthly updates on the children\'s progress.' },
                { key: 'taxDocuments' as const, label: 'Tax Documents', desc: 'Annual summaries for your records.' },
                { key: 'emergencyAppeals' as const, label: 'Emergency Appeals', desc: 'Urgent needs for disaster relief.' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-white/60 text-[11px]">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                      notifications[key] ? 'bg-secondary-fixed' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifications[key] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></span>
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full bg-white text-primary font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
              Update Preferences
            </button>
          </div>

          {/* Quote card */}
          <div className="relative rounded-xl overflow-hidden bg-on-surface h-44">
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 to-on-surface/40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/10 text-[80px]">groups</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-secondary-fixed text-lg font-bold mb-1">"</p>
              <p className="text-white text-[11px] italic leading-relaxed mb-2">
                "Knowing Alex is standing with us gives our community the strength to build a better future for every child here."
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
    </div>
  );
}
