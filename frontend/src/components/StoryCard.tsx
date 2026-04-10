interface StoryCardProps {
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
  onClick?: () => void
}

export default function StoryCard({
  imageSrc,
  imageAlt,
  imageBorderColor,
  tagBg,
  tagText,
  title,
  quote,
  programValue,
  metaLabel,
  metaValue,
  onClick,
}: StoryCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white p-8 rounded-xl overflow-hidden border border-outline-variant/30 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.14)] transition-shadow cursor-pointer"
    >
      <div className="flex gap-6 items-start">
        <div className={`w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 ${imageBorderColor}`}>
          <img src={imageSrc} alt={imageAlt} className="w-full h-full object-cover grayscale" />
        </div>
        <div>
          <span className={`inline-block px-3 py-1 ${tagBg} text-[10px] font-bold uppercase rounded-full mb-3 tracking-widest`}>
            {tagText}
          </span>
          <h4 className="text-xl font-bold text-primary mb-3">{title}</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6 italic">"{quote}"</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs font-bold text-primary uppercase">Program</p>
                <p className="text-xs">{programValue}</p>
              </div>
              <div className="w-px h-8 bg-outline-variant/30"></div>
              <div className="text-center">
                <p className="text-xs font-bold text-primary uppercase">{metaLabel}</p>
                <p className="text-xs">{metaValue}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline">
              Read story
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
