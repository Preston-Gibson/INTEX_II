import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 aurora-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Dot-grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-manrope font-bold text-white tracking-tight">
            Lucera
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-base">handshake</span>
            Join the mission
          </div>
          <h2 className="font-manrope font-bold text-4xl text-white leading-tight">
            Be part of<br />the change.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            Create your account to access tools that help you serve more families, track impact, and collaborate with your team.
          </p>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '2,400+', label: 'Families served' },
            { value: '98%', label: 'Case resolution' },
            { value: '12', label: 'Partner agencies' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <p className="font-manrope font-bold text-2xl text-white">{value}</p>
              <p className="text-white/70 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="text-2xl font-manrope font-bold text-primary">
              Lucera
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-[1.25rem] shadow-[0_8px_32px_rgba(0,63,135,0.1)] p-10">
            <h1 className="font-manrope font-bold text-3xl text-primary mb-2">
              Create your account
            </h1>
            <p className="text-on-surface-variant mb-8">
              Join Lucera to make a difference
            </p>

            <form className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane"
                    className="w-full px-4 py-3 bg-surface-container-low border border-slate-200 rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-3 bg-surface-container-low border border-slate-200 rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-surface-container-low border border-slate-200 rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-surface-container-low border border-slate-200 rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-surface-container-low border border-slate-200 rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="aurora-gradient text-white w-full py-3.5 rounded-[0.75rem] font-manrope font-bold shadow-[0_4px_16px_rgba(0,63,135,0.35)] hover:opacity-90 active:scale-[0.97] transition-all mt-2"
              >
                Create Account
              </button>
            </form>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:opacity-80 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
