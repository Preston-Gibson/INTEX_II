import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCoords } from '../utils/cityCoords'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

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

  // Derive unique regions from safehouses for the legend
  const regionMap: Record<string, SafehouseLocation[]> = {}
  safehouses.forEach(sh => {
    if (!regionMap[sh.region]) regionMap[sh.region] = []
    regionMap[sh.region].push(sh)
  })

  const maxOriginCount = origins.length ? Math.max(...origins.map(o => o.count)) : 1

  return (
    <section className="bg-surface-container-low py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-stretch">
          <div className="rounded-[2rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]" style={{ height: 420 }}>
            <MapContainer
              center={[11.5, -85.5]}
              zoom={5}
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%', borderRadius: '2rem' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

          <div className="flex flex-col gap-6">
            {/* Legend */}
            <div className="flex flex-col gap-3">
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

            {/* Safehouse list */}
            <div>
              <h3 className="font-manrope text-[1.1rem] font-bold text-on-surface mb-4">
                Active Safehouses
              </h3>
              <div className="flex flex-col gap-3">
                {safehouses.length > 0 ? safehouses.map(sh => (
                  <div key={sh.safehouseId} className="bg-surface-container-lowest rounded-xl px-4 py-3">
                    <p className="text-[0.88rem] font-bold text-on-surface">{sh.city}</p>
                    <p className="text-[0.78rem] text-on-surface-variant">{sh.country}</p>
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
