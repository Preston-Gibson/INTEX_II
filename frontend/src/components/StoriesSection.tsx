import { useState, useEffect } from 'react'
import StoryCard from './StoryCard'
import { useLanguage } from '../context/LanguageContext'

export default function StoriesSection() {
  const { t } = useLanguage()
  const [activeStory, setActiveStory] = useState<{
    imageSrc: string
    imageAlt: string
    imageBorderColor: string
    tagBg: string
    tagText: string
    title: string
    quote: string
    programValue: string
    metaLabel: string
    metaValue: string
    fullStory: string
  } | null>(null)

  const stories = [
    {
      imageSrc: '/elena-story-cover.png',
      imageAlt: "Illustration for Elena's story",
      imageBorderColor: 'border-primary-fixed',
      tagBg: 'bg-primary-fixed text-on-primary-fixed',
      tagText: t('stories.elena.tag'),
      title: t('stories.elena.title'),
      quote: t('stories.elena.quote'),
      programValue: t('stories.elena.program'),
      metaLabel: t('stories.elena.meta'),
      metaValue: t('stories.elena.meta_val'),
      fullStory: t('stories.elena.full'),
    },
    {
      imageSrc: '/sofia-story-cover.png',
      imageAlt: "Illustration for Sofia's story",
      imageBorderColor: 'border-tertiary-fixed',
      tagBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
      tagText: t('stories.sofia.tag'),
      title: t('stories.sofia.title'),
      quote: t('stories.sofia.quote'),
      programValue: t('stories.sofia.program'),
      metaLabel: t('stories.sofia.meta'),
      metaValue: t('stories.sofia.meta_val'),
      fullStory: t('stories.sofia.full'),
    },
  ]

  useEffect(() => {
    if (activeStory) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [activeStory])

  return (
    <section>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
            {t('stories.heading')}
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            {t('stories.privacy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {stories.map((story) => (
          <StoryCard key={story.title} {...story} onClick={() => setActiveStory(story)} />
        ))}
      </div>

      {/* Story modal */}
      {activeStory && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-5 px-7 pt-7 pb-5 border-b border-outline-variant/20">
              <div className={`w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-4 ${activeStory.imageBorderColor}`}>
                <img src={activeStory.imageSrc} alt={activeStory.imageAlt} className="w-full h-full object-cover grayscale" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`inline-block px-3 py-1 ${activeStory.tagBg} text-[10px] font-bold uppercase rounded-full mb-2 tracking-widest`}>
                  {activeStory.tagText}
                </span>
                <h3 className="text-lg font-manrope font-bold text-primary">{activeStory.title}</h3>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-7 py-6">
              {activeStory.fullStory.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm text-on-surface leading-relaxed mb-4 last:mb-0">
                  {para}
                </p>
              ))}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-outline-variant/20 flex gap-6 text-xs">
              <div>
                <p className="font-bold text-primary uppercase tracking-widest">{t('stories.modal.program')}</p>
                <p className="text-on-surface-variant">{activeStory.programValue}</p>
              </div>
              <div className="w-px bg-outline-variant/30" />
              <div>
                <p className="font-bold text-primary uppercase tracking-widest">{activeStory.metaLabel}</p>
                <p className="text-on-surface-variant">{activeStory.metaValue}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
