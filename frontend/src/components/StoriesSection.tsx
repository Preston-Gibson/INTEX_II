import { useState, useEffect } from 'react'
import StoryCard from './StoryCard'

const stories = [
  {
    imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfjKjAN4tA4fl-SHjbfAQJAE3IiAvVSQyhEKumwszQL2DvfG7QLUkS8Uv0afLVXDPJJN2HHPZ_ZFDlCKLzUaP4SyUpE-Z3H3wMaMsTyTm3O42tVlLCxh_4qqofrPzoC2RMRuJ-w6dakUnaF9-doISnCSDbRfYNY-SO8No-NuySWXvbRXVbCiFhnrx8E8m7e-ilZKD0C9h3CWsHFHn-QsaKsLXJZlAQGgWm0ND-YXle6I12kVdjNt-amee6CzZSmXWj_yKTCqMemA',
    imageAlt: 'Anonymized success story avatar',
    imageBorderColor: 'border-primary-fixed',
    tagBg: 'bg-secondary-container text-on-secondary-container',
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
    imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSXMkLp9xmDpTWkTHKG0dJh5zhA7Eb6fuefBAEG-Y0VlpgO-o6xJ4Jf9Paa_lzmX70sfRPI2pJSCcbZbUV8ZozhRg64plNwMc8vB86obIwTMaLIgrwGKQSAWFRJlHm_lQ27ArTa96kjlZ8tQHO4WwAV17HYG39dLqnKsFfUfEW4S1r69WHSXJc0_47A8zkHyVnTan1BmSwJLjPOd13qY9DmcECoheN0Kcefmsm-5d7_GHaSUReP1L6dHseUXFz6iFKZEGNb3sumA',
    imageAlt: 'Anonymized success story avatar',
    imageBorderColor: 'border-tertiary-fixed',
    tagBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    tagText: 'Case Highlight: Literacy',
    title: "Mateo's First Chapter",
    quote: 'Mateo arrived at Lucera with no formal schooling. In just 18 months, he is reading at grade level and leading our weekly youth council meetings.',
    programValue: 'Accelerated Literacy',
    metaLabel: 'Age',
    metaValue: '9 Years Old',
    fullStory: `Mateo was nine when he came to Lucera. He had never held a pencil to write his own name.

He had spent his earliest years moving — harvesting seasons, border crossings, adults who came and went. School was something that happened to other children. When the intake coordinator asked him to sign his name on the welcome form, he pressed his thumb to the page instead and looked away.

His first educator, a volunteer named Carlos, started with sounds. Just sounds. Letters on cards, spoken aloud over and over in the courtyard while the other boys played. Mateo was stubborn about it — in the best way. He memorized faster than anyone expected and grew frustrated when the next lesson wasn't ready.

Within six months he was sounding out words in the picture books kept in the common room. By month ten he was reading simple chapter books on his own, whispering the words under his breath at the dinner table.

At eighteen months, the house started a youth council — a weekly meeting where residents could raise concerns, suggest activities, and practice speaking in front of a group. Mateo nominated himself to lead it.

He ran it with unexpected seriousness: wrote agendas by hand, kept time with a borrowed watch, reminded louder kids to let others finish. The staff started quietly calling him "the little director."

He is still at Lucera. He is still reading — everything he can get his hands on. His current favorite is a worn paperback atlas. He traces the coastlines with his finger and names the countries out loud.`,
  },
]

export default function StoriesSection() {
  const [activeStory, setActiveStory] = useState<typeof stories[0] | null>(null)

  useEffect(() => {
    document.body.style.overflow = activeStory ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeStory])

  return (
    <section>
      <div className="flex justify-between items-end mb-12">
        <div className="max-w-xl">
          <h2 className="text-4xl font-extrabold text-primary mb-4 tracking-tight">
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
