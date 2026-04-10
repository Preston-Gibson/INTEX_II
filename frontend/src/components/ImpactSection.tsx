import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const SERVICE_ICONS = ['house', 'medical_services', 'self_improvement', 'psychology', 'groups', 'favorite']
const SERVICE_BACK_BG = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-primary', 'bg-secondary', 'bg-tertiary']
const SERVICE_BACK_TEXT = ['text-white', 'text-white', 'text-white', 'text-white', 'text-white', 'text-white']
const SERVICE_IMAGES = [
  '/images/xray.jpg',
  '/images/Hands_Circle-2048x1536.jpg',
  '/images/meditating.jpg',
  '/images/friends-jumping.jpg',
  '/images/PinkShirtPinkFlower-2048x1881.jpg',
  '/images/GreenGrassFingerStar-e1741389539890.jpg',
]

export default function ImpactSection() {
  const [flipped, setFlipped] = useState<number | null>(null)
  const { t } = useLanguage()

  const services = [
    { title: t('impact.physiological.title'), desc: t('impact.physiological.desc') },
    { title: t('impact.biological.title'), desc: t('impact.biological.desc') },
    { title: t('impact.spiritual.title'), desc: t('impact.spiritual.desc') },
    { title: t('impact.psychological.title'), desc: t('impact.psychological.desc') },
    { title: t('impact.social.title'), desc: t('impact.social.desc') },
    { title: t('impact.love.title'), desc: t('impact.love.desc') },
  ]

  return (
    <section className="bg-surface-container-low py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-14">
          <span className="inline-block text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-secondary mb-3">
            {t('impact.howwehelp')}
          </span>
          <h2 className="font-manrope text-[clamp(1.9rem,3vw,2.5rem)] font-extrabold text-primary mb-4">
            {t('impact.heading')}
          </h2>
          <p className="text-[1.05rem] leading-[1.75] text-on-surface-variant max-w-[640px]">
            {t('impact.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={i}
              className="cursor-pointer"
              style={{ perspective: '1000px', height: '280px' }}
              onClick={() => setFlipped(flipped === i ? null : i)}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: flipped === i ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <img
                    src={SERVICE_IMAGES[i]}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-7"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)' }}
                  >
                    <h3 className="font-manrope text-[1.15rem] font-bold text-white mb-1">
                      {service.title}
                    </h3>
                    <span className="flex items-center gap-1 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-white/60">
                      {t('impact.learnmore')}
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>arrow_forward</span>
                    </span>
                  </div>
                </div>

                {/* Back */}
                <div
                  className={`absolute inset-0 ${SERVICE_BACK_BG[i]} rounded-[2rem] flex flex-col justify-center gap-4 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)]`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className={`material-symbols-outlined ${SERVICE_BACK_TEXT[i]} opacity-70`} style={{ fontSize: '2rem' }}>
                    {SERVICE_ICONS[i]}
                  </span>
                  <h3 className={`font-manrope text-[1.05rem] font-bold ${SERVICE_BACK_TEXT[i]}`}>
                    {service.title}
                  </h3>
                  <p className={`text-[0.9rem] leading-[1.7] ${SERVICE_BACK_TEXT[i]} opacity-90`}>
                    {service.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
