import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { getCoords } from '../utils/cityCoords'

const pinIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
})

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
  Honduras: 'bg-primary',
  Guatemala: 'bg-secondary',
  'El Salvador': 'bg-tertiary-fixed-dim',
  Nicaragua: 'bg-outline-variant',
  'Costa Rica': 'bg-error',
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
                <Marker key={sh.safehouseId} position={coords} icon={pinIcon}>
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
              <span className={`w-3 h-3 rounded-full ${DOT_COLORS[country] ?? (i === 0 ? 'bg-primary' : i === 1 ? 'bg-secondary' : 'bg-tertiary-fixed-dim')}`} />
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
