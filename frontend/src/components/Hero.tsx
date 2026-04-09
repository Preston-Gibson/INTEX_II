import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'

export default function Hero() {
  const navigate = useNavigate()

  const handleDonateNow = () => {
    navigate(isAuthenticated() ? '/donor-dashboard' : '/login')
  }

  return (
    <section className="relative overflow-hidden min-h-[calc(100svh-7.25rem)] flex items-center">
      {/* Background image layer */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-[0.12] grayscale"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPSAsRstaZ7KJ9G7tVw0POtLWKAFVFTSvfddrEfSYd2AodDL5nAoK75AAsqlBnOuhnsrUwnXB8vXGWyQ3cS-EuCCvb9PoXQQFpuWiTxeQMFzFTLdoNeXLuVlQcss7f3lH_btzuM1n3AVMJlXElaAn7Y-hrimXKWutLpWcSakN7atW2o-rbXkM_mr515PwMER2XxopZPTV6UbmPa7Y-3Qy_iAV9tyvmJEaL8lnXK0S87w3iys8mCGIneduFvu_7mi9US7azR7RkTg"
          alt=""
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top right, #f8f9fa 0%, rgba(248,249,250,0.92) 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center py-12">
        {/* Left — text */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed font-manrope text-[0.7rem] font-extrabold tracking-[0.1em] uppercase rounded-[9999px] mb-7">
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
              location_on
            </span>
            Santa Rosa de Copán, Honduras
          </span>

          <h1 className="font-manrope text-[clamp(2.8rem,5vw,3.75rem)] font-extrabold text-primary tracking-tight mb-6">
            A Radiant Shield for the <span className="text-secondary">Vulnerable.</span>
          </h1>

          <p className="text-[1.15rem] leading-[1.75] text-on-surface-variant max-w-[520px] mb-10">
            Lucera is a dedicated sanctuary providing recovery, advocacy, and a hopeful
            future for children surviving exploitation in Central America.
          </p>

          <div className="flex gap-4 flex-wrap">
            <button onClick={handleDonateNow} className="aurora-gradient inline-flex items-center gap-2 px-8 py-3.5 text-white font-manrope font-bold text-base rounded-[0.75rem] shadow-[0_4px_16px_rgba(0,63,135,0.35)] hover:opacity-90 active:scale-[0.97] transition-all">
              Donate Now
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                volunteer_activism
              </span>
            </button>
            <button onClick={() => navigate('/impact')} className="inline-flex items-center gap-2 px-8 py-3.5 bg-surface-container-lowest text-on-surface font-manrope font-bold text-base rounded-[0.75rem] border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
              Our Impact
            </button>
          </div>
        </div>

        {/* Right — image + floating quote */}
        <div className="relative hidden lg:flex justify-end">
          <div className="relative w-[90%]">
            <img
              className="w-full aspect-[4/5] object-cover rounded-[2rem] rotate-2 shadow-[0_16px_48px_rgba(0,0,0,0.14)] block"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYSH4d4VqJ7YpBlJVHzWI8BZiEBpDmL6JMrqtyyVSgNpZehmlCe7GYC2-hwK-MFlQPhOao5p-rbg6mT49dI-6fuiH4mT9OiHoRsG3U2HlXG5djeoYmYq0msISJRD9RrhDjAa5R_391Szh_RgeiEhPvPnrORU8-1UrOXdk5AGkXpA1mKTvv3l6pcgvJoOkL4SlogHHCmDmGM3uqhVJqNw8OsUhY-KJBZxBkCgq7wyO4maytk5oqCMZp4OZshMyWRsmoNIsbH2LniA"
              alt="Compassionate caregiver with child in sanctuary"
            />
            <div className="absolute -bottom-6 -left-12 bg-surface-container-lowest px-7 py-6 rounded-[1.25rem] max-w-[260px] shadow-[0_16px_48px_rgba(0,0,0,0.14)] -rotate-2 z-10">
              <p className="font-manrope text-[1.1rem] font-bold italic text-secondary leading-[1.45]">
                "Hope is the first step toward healing."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
