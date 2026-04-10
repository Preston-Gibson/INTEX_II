import { useState, useEffect, useRef } from 'react'

interface Allocation {
  programArea: string
  percentage: number
}

const AREA_META: Record<string, { color: string}> = {
  'Direct Care':     { color: '#1a7f64'},
  'Education':       { color: '#2563eb'},
  'Medical':         { color: '#9333ea'},
  'Operations':      { color: '#ea580c'},
  'Nutrition':       { color: '#16a34a'},
  'Mental Health':   { color: '#db2777'},
  'Vocational':      { color: '#0891b2'},
  'Administration':  { color: '#92400e'},
  'Wellbeing':       { color: '#0d9488'},
  'Transport':       { color: '#7c3aed'},
  'Maintenance':     { color: '#c2410c'},
  'Outreach':        { color: '#15803d'},
}

const PALETTE = [
  '#1a7f64', '#2563eb', '#9333ea', '#ea580c',
  '#16a34a', '#db2777', '#0891b2', '#0d9488',
]

function metaForArea(area: string, index: number): { color: string } {
  const key = Object.keys(AREA_META).find(k => area.toLowerCase().includes(k.toLowerCase()))
  if (key) return AREA_META[key]
  return { color: PALETTE[index % PALETTE.length] }
}

const FALLBACK: Allocation[] = [
  { programArea: 'Direct Care & Nutrition', percentage: 55 },
  { programArea: 'Education & Vocational Training', percentage: 22 },
  { programArea: 'Medical & Mental Health Support', percentage: 15 },
  { programArea: 'Operations & Administration', percentage: 8 },
]

export default function TransparencySection() {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [animated, setAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/donation-allocation`)
      .then(r => r.json())
      .then((data: Allocation[]) => setAllocations(data.length > 0 ? data : FALLBACK))
      .catch(() => setAllocations(FALLBACK))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const display = allocations.length > 0 ? allocations : FALLBACK

  return (
    <div ref={ref} className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
      <h3 className="text-2xl font-bold text-primary mb-1">Where Your Money Goes</h3>
      <p className="text-on-surface-variant text-sm mb-8">
        For every $1 donated, 92 cents goes directly to program costs.
      </p>

      <div className="space-y-5">
        {display.map(({ programArea, percentage }, i) => {
          const { color } = metaForArea(programArea, i)
          return (
            <div key={programArea} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-on-surface">{programArea}</span>
                </div>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color }}
                >
                  {percentage}%
                </span>
              </div>

              <div className="relative w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animated ? `${percentage}%` : '0%',
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
