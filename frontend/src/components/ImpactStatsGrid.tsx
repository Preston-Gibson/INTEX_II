export default function ImpactStatsGrid() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
      <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex flex-col justify-between">
        <div>
          <span className="material-symbols-outlined text-secondary text-3xl mb-4">home_pin</span>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
            Residents Served
          </h3>
          <p className="text-5xl font-extrabold text-primary">482</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-secondary font-medium">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span>12% increase from 2023</span>
        </div>
      </div>

      <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex flex-col justify-between">
        <div>
          <span className="material-symbols-outlined text-secondary text-3xl mb-4">volunteer_activism</span>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
            Successful Reintegrations
          </h3>
          <p className="text-5xl font-extrabold text-primary">156</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-secondary font-medium">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Stable home environments secured</span>
        </div>
      </div>

      <div className="p-8 aurora-gradient rounded-xl flex flex-col justify-between text-white">
        <div>
          <span className="material-symbols-outlined text-white/80 text-3xl mb-4">history_edu</span>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-2">
            Education Hours Provided
          </h3>
          <p className="text-5xl font-extrabold">24,500+</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-white/90 font-medium">
          <span className="material-symbols-outlined text-sm">school</span>
          <span>Accredited curriculum programs</span>
        </div>
      </div>
    </section>
  )
}
