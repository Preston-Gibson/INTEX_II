export default function SettingsPage() {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Personal Info + Payment Methods */}
        <div className="md:col-span-2 space-y-4">
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

        </div>

        {/* Right column */}
        <div className="space-y-4">

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-surface-container-low rounded-xl">
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
