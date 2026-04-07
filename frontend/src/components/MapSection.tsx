import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon, DivIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const createColoredPin = (color: string) =>
  new DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>`,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
  })

// One color per region
const REGION_COLORS: Record<string, string> = {
  'Pacific Coast':      '#0077b6', // deep ocean blue
  'North Central':      '#e07b39', // warm amber
  'Western Highlands':  '#7b2d8b', // highland purple
  'East Caribbean':     '#00b4d8', // caribbean cyan
  'Northern Region':    '#e63946', // coral red
  'Central Pacific':    '#2a9d8f', // teal
  'Central Valley':     '#f4a261', // earthy orange
}

const locations = [
  {
    name: 'Santa Rosa de Copán',
    country: 'Honduras',
    region: 'Western Highlands',
    position: [14.7726, -88.7793] as [number, number],
    description: 'Primary sanctuary — Lucera headquarters',
    primary: true,
  },
  {
    name: 'Quetzaltenango',
    country: 'Guatemala',
    region: 'Pacific Coast',
    position: [14.8333, -91.5167] as [number, number],
    description: 'Pacific Coast region safehouse',
    primary: false,
  },
  {
    name: 'El Progreso',
    country: 'Honduras',
    region: 'North Central',
    position: [15.4000, -87.8000] as [number, number],
    description: 'North Central region safehouse',
    primary: false,
  },
  {
    name: 'Santa Ana',
    country: 'El Salvador',
    region: 'Western Highlands',
    position: [13.9942, -89.5597] as [number, number],
    description: 'Western Highlands region safehouse',
    primary: false,
  },
  {
    name: 'Bluefields',
    country: 'Nicaragua',
    region: 'East Caribbean',
    position: [12.0136, -83.7636] as [number, number],
    description: 'East Caribbean region safehouse',
    primary: false,
  },
  {
    name: 'Heredia',
    country: 'Costa Rica',
    region: 'Northern Region',
    position: [9.9981, -84.1168] as [number, number],
    description: 'Northern Region safehouse',
    primary: false,
  },
  {
    name: 'San Miguelito',
    country: 'Panama',
    region: 'Central Pacific',
    position: [9.0300, -79.4700] as [number, number],
    description: 'Central Pacific region safehouse',
    primary: false,
  },
  {
    name: 'Siguatepeque',
    country: 'Honduras',
    region: 'North Central',
    position: [14.5983, -87.8336] as [number, number],
    description: 'North Central region safehouse',
    primary: false,
  },
  {
    name: 'Ilopango',
    country: 'El Salvador',
    region: 'Central Valley',
    position: [13.7000, -89.1167] as [number, number],
    description: 'Central Valley region safehouse',
    primary: false,
  },
]

export default function MapSection() {
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
            offices, and partner networks to reach the most vulnerable children.
          </p>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-10 items-stretch">
          <div className="h-full rounded-[2rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
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
              {locations.map((loc) => (
                <Marker
                  key={loc.name}
                  position={loc.position}
                  icon={loc.primary ? blueIcon : createColoredPin(REGION_COLORS[loc.region])}
                >
                  <Popup>
                    <strong>{loc.name}</strong>, {loc.country}
                    <br />
                    {loc.region}
                    <br />
                    {loc.description}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div>
            <h3 className="font-manrope text-[1.1rem] font-bold text-on-surface mb-5">
              Regions
            </h3>

            <div className="flex flex-col gap-5">
              {Object.entries(REGION_COLORS).map(([region, color]) => {
                const regionLocations = locations.filter((l) => l.region === region)
                if (regionLocations.length === 0) return null
                return (
                  <div key={region}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      <span className="text-[0.85rem] font-extrabold text-on-surface uppercase tracking-wide">
                        {region}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pl-5">
                      {regionLocations.map((loc) => (
                        <div key={loc.name} className="flex items-center gap-2">
                          {loc.primary && (
                            <span className="text-[0.7rem] font-bold text-primary uppercase tracking-wide">HQ</span>
                          )}
                          <span className="text-[0.85rem] text-on-surface-variant">
                            {loc.name} · {loc.country}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
