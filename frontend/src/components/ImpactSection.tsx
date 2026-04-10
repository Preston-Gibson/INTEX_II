import { useState } from 'react'

const services = [
  {
    title: 'Physiological Needs',
    image: '/images/xray.jpg',
    icon: 'house',
    backBg: 'bg-primary',
    backText: 'text-white',
    desc: 'Every girl receives nutritious meals, daily vitamins, a comfortable bed for restful sleep, and age-appropriate exercise to support their growing bodies and overall health.',
  },
  {
    title: 'Biological Needs',
    image: '/images/Hands_Circle-2048x1536.jpg',
    icon: 'medical_services',
    backBg: 'bg-secondary',
    backText: 'text-white',
    desc: 'Our safe house is secured by a perimeter wall, cameras, and reinforced construction. Every staff member is trained to comfort and care for each child — so they are not only safe, but feel safe.',
  },
  {
    title: 'Spiritual Needs',
    image: '/images/meditating.jpg',
    icon: 'self_improvement',
    backBg: 'bg-tertiary',
    backText: 'text-white',
    desc: 'Each day, the girls are invited to join in songs of praise, group prayer, and scripture reading. Weekly church services and spiritual activities help nurture faith, purpose, and a sense of something greater than themselves.',
  },
  {
    title: 'Psychological Needs',
    image: '/images/friends-jumping.jpg',
    icon: 'psychology',
    backBg: 'bg-primary',
    backText: 'text-white',
    desc: 'Each week, the girls learn principles of emotional resilience and are coached in applying them when challenges arise. They practice conflict resolution, healthy coping strategies, and positive thinking patterns that will serve them for life.',
  },
  {
    title: 'Social Needs',
    image: '/images/PinkShirtPinkFlower-2048x1881.jpg',
    icon: 'groups',
    backBg: 'bg-secondary',
    backText: 'text-white',
    desc: 'Though most of the girls are teenagers, there are no cliques, popularity contests, or social hierarchies here. Every girl is valued equally, and genuine friendships are built on mutual respect.',
  },
  {
    title: 'Love & Belonging',
    image: '/images/GreenGrassFingerStar-e1741389539890.jpg',
    icon: 'favorite',
    backBg: 'bg-tertiary',
    backText: 'text-white',
    desc: 'Friendship, inclusion, respect, and deep connection — in friendships and in family — are essential to a full and happy life. We cultivate an environment where every girl is truly known, truly valued, and truly loved.',
  },
]

export default function ImpactSection() {
  const [flipped, setFlipped] = useState<number | null>(null)

  return (
    <section className="bg-surface-container-low py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-14">
          <span className="inline-block text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-secondary mb-3">
            How We Help
          </span>
          <h2 className="font-manrope text-[clamp(1.9rem,3vw,2.5rem)] font-extrabold text-primary mb-4">
            Our Services
          </h2>
          <p className="text-[1.05rem] leading-[1.75] text-on-surface-variant max-w-[640px]">
            Through direct intervention and long-term care, we address every dimension of a survivor's wellbeing — body, mind, and spirit.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
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
                    src={service.image}
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
                      Learn more
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>arrow_forward</span>
                    </span>
                  </div>
                </div>

                {/* Back */}
                <div
                  className={`absolute inset-0 ${service.backBg} rounded-[2rem] flex flex-col justify-center gap-4 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)]`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className={`material-symbols-outlined ${service.backText} opacity-70`} style={{ fontSize: '2rem' }}>
                    {service.icon}
                  </span>
                  <h3 className={`font-manrope text-[1.05rem] font-bold ${service.backText}`}>
                    {service.title}
                  </h3>
                  <p className={`text-[0.9rem] leading-[1.7] ${service.backText} opacity-90`}>
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
