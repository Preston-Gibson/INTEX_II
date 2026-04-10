import { useState, useEffect } from 'react'
import StoryCard from './StoryCard'

const stories = [
  {
    imageSrc: '/elena-story-cover.png',
    imageAlt: 'Illustration for Elena\'s story',
    imageBorderColor: 'border-primary-fixed',
    tagBg: 'bg-primary-fixed text-on-primary-fixed',
    tagText: 'Case Highlight: Reintegration',
    title: "Elena's Journey to Independence",
    quote: 'After three years in our transition program, Elena graduated from her nursing vocational course and has been safely reunited with her extended family.',
    programValue: 'Vocational Path',
    metaLabel: 'Duration',
    metaValue: '3.5 Years',
    fullStory: `Elena arrived at Lucera at fourteen years old, rescued from a trafficking network operating across two countries. She was quiet in those first weeks — sitting apart at meals, startling at doors — carrying a weight that words couldn't yet reach.

Her caseworker, Marta, began meeting with her twice a week. Slowly, Elena started to talk. About the cousins she missed. About wanting, someday, to be a nurse.

That someday became a plan. Lucera enrolled her in an accelerated literacy program, then in a certified nursing assistant course at a partnered vocational institute in the city. Elena studied in the evenings after house chores, borrowing textbooks she dog-eared with careful notes in the margins.

In her second year, she sat with younger girls who were just arriving — not as a counselor, but as someone who understood. "I was you," she would say. "It gets quieter."

After three and a half years, Elena passed her certification exam on the first attempt. Her aunt — vetted and approved through Lucera's family reintegration process — was waiting outside. They drove north together.

She sends a message to the house on holidays. Last December, she wrote that she had gotten her first hospital placement. She signed it: grateful.`,
  },
  {
    imageSrc: '/sofia-story-cover.png',
    imageAlt: 'Illustration for Sofia\'s story',
    imageBorderColor: 'border-tertiary-fixed',
    tagBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    tagText: 'Case Highlight: Safe Return',
    title: "Sofia's Road Home",
    quote: 'When Sofia arrived at Lucera, she hadn\'t spoken in weeks. Two years later, she walked back to her grandmother\'s village — on her own terms, ready.',
    programValue: 'Family Reintegration',
    metaLabel: 'Duration',
    metaValue: '2 Years',
    fullStory: `Sofia was twelve when the authorities brought her to Lucera. She arrived with a plastic bag, a borrowed jacket two sizes too large, and nothing else.

For the first month she communicated almost entirely through nods. Her caseworker, Rosa, did not push. She sat with her during meals, walked beside her in the garden, and let the silence be. "She needed to learn the house was safe," Rosa said later. "That takes time. There's no shortcut."

The breakthrough came quietly. One afternoon in the craft room, Sofia picked up a needle and thread from the supply table and began to embroider a small bird onto a scrap of fabric — precise, deliberate stitches. A staff member noticed and sat beside her without comment. Within an hour, three other girls had joined them at the table.

Needlework became Sofia's language when words still felt unreliable. She made small things — flowers, birds, a tiny house with a red door. When she finally started speaking in sessions, her words came out the same way: careful and exact.

By her second year she was attending the community education program and helping younger girls settle into the safehouse routine. She had identified an aunt in her home region — a woman the Lucera family tracing team spent four months verifying, visiting twice before any contact was made.

The reintegration visit happened on a Tuesday morning. Sofia carried a small embroidered pouch she had made for her aunt. They sat across from each other at a table in the community center, a social worker nearby. After twenty minutes, Sofia reached across and took her aunt's hand.

Six months later, she is enrolled in school. She sends a photograph once a month — never of her face, always of something she has made. Last month it was a tablecloth with a pattern of birds in flight along the border.`,
  },
]

export default function StoriesSection() {
  const [activeStory, setActiveStory] = useState<typeof stories[0] | null>(null)

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
            The Lives Behind the Data
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            Names and locations have been changed to protect the privacy and safety of our residents.
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
                <p className="font-bold text-primary uppercase tracking-widest">Program</p>
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
