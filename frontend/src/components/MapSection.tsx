import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import { Icon, LatLngBounds, LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCoords } from '../utils/cityCoords'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = new LatLngBounds(points.map(p => new LatLng(p[0], p[1])))
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 7 })
  }, [points.length])
  return null
}

const blueIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})


interface SafehouseLocation {
  safehouseId: number
  name: string
  city: string
  province: string
  country: string
  region: string
  status: string
  currentOccupancy: number
  capacityGirls: number
}

interface ResidentOrigin {
  city: string
  count: number
}

export default function MapSection() {
  const [safehouses, setSafehouses] = useState<SafehouseLocation[]>([])
  const [origins, setOrigins] = useState<ResidentOrigin[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/safehouse-locations`)
      .then(r => r.json())
      .then(setSafehouses)
      .catch(() => {})

    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/impact/resident-origins`)
      .then(r => r.json())
      .then(setOrigins)
      .catch(() => {})
  }, [])

  const uniqueCountries = Array.from(new Set(safehouses.map(sh => sh.country)))

  const maxOriginCount = origins.length ? Math.max(...origins.map(o => o.count)) : 1

  return (
    <section className="bg-surface-container-low py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-stretch">
          <div className="flex flex-col gap-6 min-h-0">
            <div className="flex-shrink-0">
              <span className="inline-block text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-secondary mb-3">
                Our Reach
              </span>
              <h2 className="font-manrope text-[clamp(1.9rem,3vw,2.5rem)] font-extrabold text-primary mb-3">
                Where We Serve
              </h2>
              <p className="text-[1.02rem] leading-[1.75] text-on-surface-variant max-w-[560px]">
                Operating across Central America, Lucera maintains safe houses, legal
                offices, and partner networks to serve those most in need.
              </p>
            </div>
            <div className="flex-1 relative rounded-[2rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]" style={{ minHeight: 300 }}>
            <MapContainer
              center={[11.5, -85.5]}
              zoom={5}
              scrollWheelZoom={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '2rem' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds
                points={[
                  ...safehouses.map(sh => getCoords(sh.city)).filter(Boolean) as [number,number][],
                  ...origins.map(o => getCoords(o.city)).filter(Boolean) as [number,number][],
                ]}
              />

              {/* Resident origin pins (orange circles, sized by count) */}
              {origins.map(({ city, count }) => {
                const coords = getCoords(city)
                if (!coords) return null
                const radius = Math.max(6, Math.round((count / maxOriginCount) * 18))
                return (
                  <CircleMarker
                    key={`origin-${city}`}
                    center={coords}
                    radius={radius}
                    pathOptions={{ color: '#e07b39', fillColor: '#e07b39', fillOpacity: 0.5, weight: 1.5 }}
                  >
                    <Popup>
                      <strong>{city}</strong>
                      <br />
                      {count} resident{count !== 1 ? 's' : ''} from this area
                    </Popup>
                  </CircleMarker>
                )
              })}

              {/* Safehouse location pins (blue markers) */}
              {safehouses.map((sh) => {
                const coords = getCoords(sh.city)
                if (!coords) return null
                return (
                  <Marker
                    key={sh.safehouseId}
                    position={coords}
                    icon={blueIcon}
                  >
                    <Popup>
                      <strong>{sh.name}</strong>
                      <br />
                      {sh.city}, {sh.country}
                      {sh.region ? <><br />{sh.region}</> : null}
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Legend */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <img src={markerIcon} style={{ width: 14, height: 22 }} alt="safehouse pin" />
                <span className="text-[0.85rem] font-bold text-on-surface">Safehouse Location</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: '#e07b39', opacity: 0.7 }} />
                <span className="text-[0.85rem] font-bold text-on-surface">Resident Origin City</span>
              </div>
              <p className="text-[0.78rem] text-on-surface-variant leading-relaxed">
                Circle size reflects the number of residents from that area.
              </p>
            </div>

            {/* Safehouse list — full height, no scroll */}
            <div className="flex flex-col">
              <h3 className="font-manrope text-[1.1rem] font-bold text-on-surface mb-3">
                Active Safehouses
              </h3>
              <div className="flex flex-col gap-2">
                {uniqueCountries.length > 0 ? uniqueCountries.map(country => (
                  <div key={country} className="bg-surface-container-lowest rounded-xl px-4 py-3">
                    <p className="text-[0.88rem] font-bold text-on-surface">{country}</p>
                  </div>
                )) : (
                  <p className="text-[0.85rem] text-on-surface-variant">Loading safehouses...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
