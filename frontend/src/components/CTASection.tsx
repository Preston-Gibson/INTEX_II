export default function CTASection() {
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
            Join the Movement of Light.
          </h2>
          <p className="relative text-[1.1rem] leading-[1.75] text-primary-fixed max-w-[560px] mx-auto mb-12">
            Whether as a monthly donor or a strategic partner, your contribution serves
            as a radiant guardian for those who need it most.
          </p>
          <div className="relative flex gap-5 justify-center flex-wrap">
            <button className="px-10 py-4 bg-tertiary-fixed text-on-tertiary-fixed font-manrope font-extrabold text-base rounded-[1rem] shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:scale-105 active:scale-[0.97] transition-transform">
              Become a Partner
            </button>
            <button className="px-10 py-4 bg-white text-primary font-manrope font-extrabold text-base rounded-[1rem] shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:scale-105 active:scale-[0.97] transition-transform">
              One-Time Gift
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
