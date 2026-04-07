import { useState, useEffect } from 'react'

interface Allocation {
  programArea: string
  percentage: number
}

const AREA_COLORS: Record<string, string> = {
  'Direct Care': 'bg-primary',
  'Education': 'bg-secondary',
  'Medical': 'bg-tertiary-fixed-dim',
  'Operations': 'bg-outline-variant',
  'Nutrition': 'bg-primary',
  'Mental Health': 'bg-tertiary-fixed-dim',
  'Vocational': 'bg-secondary',
  'Administration': 'bg-outline-variant',
}

function colorForArea(area: string): string {
  // Try exact match first, then partial
  if (AREA_COLORS[area]) return AREA_COLORS[area]
  const key = Object.keys(AREA_COLORS).find(k => area.toLowerCase().includes(k.toLowerCase()))
  return key ? AREA_COLORS[key] : 'bg-primary'
}

// Fallback data if DB has no allocations yet
const FALLBACK: Allocation[] = [
  { programArea: 'Direct Care & Nutrition', percentage: 55 },
  { programArea: 'Education & Vocational Training', percentage: 22 },
  { programArea: 'Medical & Mental Health Support', percentage: 15 },
  { programArea: 'Operations & Administration', percentage: 8 },
]

export default function TransparencySection() {
  const [allocations, setAllocations] = useState<Allocation[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/donation-allocation`)
      .then(r => r.json())
      .then((data: Allocation[]) => {
        setAllocations(data.length > 0 ? data : FALLBACK)
      })
      .catch(() => setAllocations(FALLBACK))
  }, [])

  const display = allocations.length > 0 ? allocations : FALLBACK

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
      <h3 className="text-2xl font-bold text-primary mb-2">Where Your Money Goes</h3>
      <p className="text-on-surface-variant mb-8 leading-relaxed">
        For every $1 donated, 92 cents goes directly to program costs and essential care
        for our residents.
      </p>

      <div className="space-y-10">
        {display.map(({ programArea, percentage }) => (
          <div key={programArea}>
            <div className="flex justify-between mb-3 text-sm font-bold">
              <span>{programArea}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
              <div
                className={`${colorForArea(programArea)} h-full`}
                style={{ width: `${percentage}%` }}
              />
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
