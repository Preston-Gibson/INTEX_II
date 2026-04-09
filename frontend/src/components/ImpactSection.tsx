import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function ImpactSection() {
  const [livesRestored, setLivesRestored] = useState<number | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/stats`)
      .then(r => r.json())
      .then((data) => setLivesRestored(data.residentsServed))
      .catch(() => {})
  }, [])

  return (
    <section className="bg-surface-container-low py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-14">
          <h2 className="font-manrope text-[clamp(1.9rem,3vw,2.5rem)] font-extrabold text-primary mb-4">
            {t('impact.heading')}
          </h2>
          <p className="text-[1.05rem] leading-[1.75] text-on-surface-variant max-w-[640px]">
            {t('impact.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Holistic Recovery — spans 2 cols */}
          <div className="sm:col-span-2 bg-surface-container-lowest rounded-[2rem] p-9 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-[3px] transition-all duration-300">
            <div>
              <span className="material-symbols-outlined text-[2.25rem] text-secondary mb-2 block">
                health_and_safety
              </span>
              <h3 className="font-manrope text-[1.3rem] font-bold text-on-surface">{t('impact.holistic.title')}</h3>
              <p className="mt-3 text-[0.92rem] leading-[1.65] text-on-surface-variant">
                {t('impact.holistic.desc')}
              </p>
            </div>
            <div className="mt-auto pt-6 border-t border-outline-variant/15">
              <span className="font-manrope text-[3.25rem] font-extrabold text-primary tracking-tight leading-none block">
                {livesRestored !== null ? `${livesRestored.toLocaleString()}+` : '—'}
              </span>
              <span className="text-[0.7rem] font-bold tracking-[0.12em] uppercase text-on-surface-variant mt-1 block">
                {t('impact.holistic.stat')}
              </span>
            </div>
          </div>

          {/* Legal Advocacy — primary blue */}
          <div className="bg-primary rounded-[2rem] p-9 shadow-sm flex flex-col items-center justify-center gap-3 text-center hover:shadow-md hover:-translate-y-[3px] transition-all duration-300">
            <span className="material-symbols-outlined text-[3rem] text-white">gavel</span>
            <h3 className="font-manrope text-[1.1rem] font-bold text-white">{t('impact.legal.title')}</h3>
            <p className="text-[0.92rem] leading-[1.65] text-white/80">
              {t('impact.legal.desc')}
            </p>
          </div>

          {/* Education — amber */}
          <div className="bg-tertiary-fixed rounded-[2rem] p-9 shadow-sm flex flex-col items-center justify-center gap-3 text-center hover:shadow-md hover:-translate-y-[3px] transition-all duration-300">
            <span className="material-symbols-outlined text-[3rem] text-on-tertiary-fixed">school</span>
            <h3 className="font-manrope text-[1.1rem] font-bold text-on-tertiary-fixed">{t('impact.education.title')}</h3>
            <p className="text-[0.92rem] leading-[1.65] text-on-tertiary-fixed-variant">
              {t('impact.education.desc')}
            </p>
          </div>

          {/* Safe Haven Housing — full width, horizontal */}
          <div className="sm:col-span-2 lg:col-span-4 bg-surface-container-lowest rounded-[2rem] shadow-sm flex flex-col md:flex-row items-stretch overflow-hidden hover:shadow-md hover:-translate-y-[3px] transition-all duration-300">
            <div className="p-9 md:p-12 flex-1 flex flex-col justify-center gap-4">
              <span className="material-symbols-outlined text-[2.25rem] text-secondary">home_pin</span>
              <h3 className="font-manrope text-[1.3rem] font-bold text-on-surface">{t('impact.housing.title')}</h3>
              <p className="text-[0.92rem] leading-[1.65] text-on-surface-variant">
                {t('impact.housing.desc')}
              </p>
            </div>
            <img
              className="w-full md:w-[45%] max-h-64 md:max-h-none flex-shrink-0 object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfE69d4d8O2ZuXYj4kishQKYX7UoXk_1JPXpqO373kVEbsM4F5S3a2twa7LhszUIe6iDUVQdBCmKYDzVgJPtJicoS2sDZfB_oQXMRM5rylfkoRhThT4jhL1GxkSvjPRkpZb_RH6weGslqNGVBtqDjbgD6X6qGmKAikVOuOu_ydNk7kvy5ME8y7f1Co26hcwVSwP6Hs8qN9pSFEkZ2NjI1q-OKmUK9DlxksUg8QhdlbBEaQz9BR8nuD8CGmICP41sYgfnebbdQngw"
              alt="Safe haven interior"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
