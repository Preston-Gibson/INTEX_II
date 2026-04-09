import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'

export default function CTASection() {
  const navigate = useNavigate()
  return (
    <section className="bg-surface py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="aurora-gradient rounded-[3rem] py-20 px-8 text-center relative overflow-hidden shadow-[0_24px_64px_rgba(0,63,135,0.3)]">
          {/* dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <h2 className="relative font-manrope text-[clamp(2.2rem,5vw,3.75rem)] font-extrabold text-white tracking-tight mb-6">
            Every Child Deserves a Safe Place.
          </h2>
          <p className="relative text-[1.1rem] leading-[1.75] text-primary-fixed max-w-[560px] mx-auto mb-12">
            Your generosity funds the shelter, education, and care that help vulnerable
            children in Central America heal and build a future.
          </p>
          <div className="relative flex justify-center">
            <button
              onClick={() => navigate(isAuthenticated() ? '/donor-dashboard' : '/login')}
              className="inline-flex items-center gap-3 px-10 py-4 bg-white text-primary font-manrope font-extrabold text-base rounded-[1rem] shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:scale-105 active:scale-[0.97] transition-transform"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
              Donate
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
