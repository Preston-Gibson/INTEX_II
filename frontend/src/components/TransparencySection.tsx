const allocations = [
  { label: 'Direct Care & Nutrition', percent: 55, colorClass: 'bg-primary' },
  { label: 'Education & Vocational Training', percent: 22, colorClass: 'bg-secondary' },
  { label: 'Medical & Mental Health Support', percent: 15, colorClass: 'bg-tertiary-fixed-dim' },
  { label: 'Operations & Administration', percent: 8, colorClass: 'bg-outline-variant' },
]

export default function TransparencySection() {
  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
      <h3 className="text-2xl font-bold text-primary mb-2">Where Your Money Goes</h3>
      <p className="text-on-surface-variant mb-8 leading-relaxed">
        For every $1 donated, 92 cents goes directly to program costs and essential care
        for our residents.
      </p>

      <div className="space-y-10">
        {allocations.map(({ label, percent, colorClass }) => (
          <div key={label}>
            <div className="flex justify-between mb-3 text-sm font-bold">
              <span>{label}</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
              <div className={`${colorClass} h-full`} style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-slate-50 rounded-xl flex items-center gap-4">
        <span className="material-symbols-outlined text-tertiary-container text-4xl">verified_user</span>
        <div>
          <p className="font-bold text-primary text-sm">Platinum Transparency Rating</p>
          <p className="text-xs text-on-surface-variant">Independently audited by GuideStar 2024</p>
        </div>
      </div>
    </div>
  )
}
