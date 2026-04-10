import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface Stats {
  residentsServed: number
  successfulReintegrations: number
  educationHours: number
}

export default function ImpactStatsGrid() {
  const [stats, setStats] = useState<Stats | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const residentsServed = stats?.residentsServed.toLocaleString() ?? '—'
  const reintegrations = stats?.successfulReintegrations.toLocaleString() ?? '—'
  const educationHours = stats ? `${stats.educationHours.toLocaleString()}+` : '—'

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
      <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex flex-col justify-between">
        <div>
          <span className="material-symbols-outlined text-secondary text-3xl mb-4">home_pin</span>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
            {t('stats.residents')}
          </h3>
          <p className="text-5xl font-extrabold text-primary">{residentsServed}</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-secondary font-medium">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span>{t('stats.residents.sub')}</span>
        </div>
      </div>

      <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex flex-col justify-between">
        <div>
          <span className="material-symbols-outlined text-secondary text-3xl mb-4">volunteer_activism</span>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
            {t('stats.reintegrations')}
          </h3>
          <p className="text-5xl font-extrabold text-primary">{reintegrations}</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-secondary font-medium">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{t('stats.reintegrations.sub')}</span>
        </div>
      </div>

      <div className="p-8 aurora-gradient rounded-xl flex flex-col justify-between text-white">
        <div>
          <span className="material-symbols-outlined text-white/80 text-3xl mb-4">history_edu</span>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-2">
            {t('stats.education')}
          </h3>
          <p className="text-5xl font-extrabold">{educationHours}</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-white/90 font-medium">
          <span className="material-symbols-outlined text-sm">school</span>
          <span>{t('stats.education.sub')}</span>
        </div>
      </div>
    </section>
  )
}
