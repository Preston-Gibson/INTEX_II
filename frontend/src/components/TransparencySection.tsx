import { useState, useEffect } from 'react'

interface Allocation {
  programArea: string
  percentage: number
}

const AREA_COLORS: Record<string, string> = {
  'Direct Care': 'bg-primary',
  'Education': 'bg-[#2196F3]',
  'Medical': 'bg-[#9C27B0]',
  'Operations': 'bg-[#FF9800]',
  'Nutrition': 'bg-[#4CAF50]',
  'Mental Health': 'bg-[#E91E63]',
  'Vocational': 'bg-[#00BCD4]',
  'Administration': 'bg-[#795548]',
  'Wellbeing': 'bg-[#2196F3]',
  'Transport': 'bg-[#9C27B0]',
  'Maintenance': 'bg-[#E91E63]',
  'Outreach': 'bg-[#4CAF50]',
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

    </div>
  )
}
