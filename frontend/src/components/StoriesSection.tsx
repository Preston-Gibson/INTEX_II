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
  },
]

export default function StoriesSection() {
  return (
    <section className="mb-20">
      <div className="flex justify-between items-end mb-12">
        <div className="max-w-xl">
          <h2 className="text-4xl font-extrabold text-primary mb-4 tracking-tight">
            The Lives Behind the Data
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            Names and locations have been changed to protect the privacy and safety of our residents.
          </p>
        </div>
        <button className="text-primary font-bold flex items-center gap-2 hover:underline">
          View More Stories
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {stories.map((story) => (
          <StoryCard key={story.title} {...story} />
        ))}
      </div>
    </section>
  )
}
