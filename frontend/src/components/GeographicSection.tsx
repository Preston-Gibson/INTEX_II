import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCoords } from '../utils/cityCoords'

const PIN_COLORS: Record<string, string> = {
  Honduras:      '#1565C0',
  'El Salvador': '#E53935',
  Guatemala:     '#2E7D32',
  Panama:        '#F9A825',
  Nicaragua:     '#9E9E9E',
  'Costa Rica':  '#C62828',
}

function makePinIcon(color: string): Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`.trim()
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return new Icon({
    iconUrl: url,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  })
}


interface CountryReach {
  country: string
  count: number
  percentage: number
}

interface YearImpact {
  year: number
  count: number
}

interface SafehouseLocation {
  safehouseId: number
  name: string
  city: string
  country: string
  currentOccupancy: number
  capacityGirls: number
}

const DOT_COLORS: Record<string, string> = {
  Honduras:      'bg-[#1565C0]',
  'El Salvador': 'bg-[#E53935]',
  Guatemala:     'bg-[#2E7D32]',
  Panama:        'bg-[#F9A825]',
  Nicaragua:     'bg-[#9E9E9E]',
  'Costa Rica':  'bg-[#C62828]',
}

export default function GeographicSection() {
  const [geoReach, setGeoReach] = useState<CountryReach[]>([])
  const [yearlyImpact, setYearlyImpact] = useState<YearImpact[]>([])
  const [safehouses, setSafehouses] = useState<SafehouseLocation[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/geographic-reach`)
      .then(r => r.json()).then(setGeoReach).catch(() => {})

    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/yearly-impact`)
      .then(r => r.json()).then(setYearlyImpact).catch(() => {})

    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/safehouse-locations`)
      .then(r => r.json()).then(setSafehouses).catch(() => {})
  }, [])

  const maxCount = yearlyImpact.length ? Math.max(...yearlyImpact.map(y => y.count), 1) : 1
  const recentYears = yearlyImpact.slice(-4)

  const geoDisplay = geoReach.length > 0 ? geoReach : [
    { country: 'Honduras', percentage: 65 },
    { country: 'Guatemala', percentage: 20 },
    { country: 'Others', percentage: 15 },
  ]

  return (
    <div className="space-y-8">
      <div className="p-8 bg-surface-container-low rounded-xl">
        <h3 className="text-2xl font-bold text-primary mb-6">Geographic Reach</h3>
        <div className="aspect-video rounded-lg overflow-hidden">
          <MapContainer
            center={[11.5, -85.5]}
            zoom={5}
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={false}
            doubleClickZoom={false}
            keyboard={false}
            touchZoom={false}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {safehouses.map(sh => {
              const coords = getCoords(sh.city)
              if (!coords) return null
              return (
                <Marker key={sh.safehouseId} position={coords} icon={makePinIcon(PIN_COLORS[sh.country] ?? '#1565C0')}>
                  <Popup>
                    <strong>{sh.name}</strong><br />
                    {sh.city}, {sh.country}
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-on-surface-variant">
          {geoDisplay.map(({ country, percentage }, i) => (
            <div key={country} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${DOT_COLORS[country] ?? ['bg-[#1565C0]','bg-[#E53935]','bg-[#2E7D32]','bg-[#F9A825]','bg-[#9E9E9E]','bg-[#C62828]'][i % 6]}`} />
              {country} ({percentage}%)
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-surface-container-low rounded-xl">
        <h3 className="text-2xl font-bold text-primary mb-6">Year-Over-Year Admissions</h3>
        <div className="space-y-2">
          <div className="flex gap-2 mb-1">
            {(recentYears.length > 0 ? recentYears : [{year:2021,count:0},{year:2022,count:0},{year:2023,count:0},{year:2024,count:0}]).map(({ year, count }) => (
              <div key={year} className="flex-1 text-center text-xs font-bold text-on-surface-variant">{count || ''}</div>
            ))}
          </div>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {recentYears.length > 0 ? recentYears.map(({ year, count }, i) => {
              const isLast = i === recentYears.length - 1
              const barHeight = Math.max(Math.round((count / maxCount) * 152), 4)
              return (
                <div
                  key={year}
                  className={`flex-1 rounded-t-lg transition-all ${isLast ? 'bg-primary' : 'bg-primary/25 hover:bg-primary/40'}`}
                  style={{ height: barHeight }}
                />
              )
            }) : (
              [64, 88, 112, 152].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-lg ${i === 3 ? 'bg-primary' : 'bg-primary/25'}`} style={{ height: h }} />
              ))
            )}
          </div>
          <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase">
            {recentYears.length > 0
              ? recentYears.map(({ year }) => <span key={year}>{year}</span>)
              : ['2021', '2022', '2023', '2024'].map(y => <span key={y}>{y}</span>)
            }
          </div>
        </div>
      </div>
    </div>
  )
}
