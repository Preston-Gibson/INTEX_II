import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const locations = [
  {
    name: 'Santa Rosa de Copán',
    country: 'Honduras',
    position: [14.7726, -88.7793] as [number, number],
    description: 'Primary sanctuary — Lucera headquarters',
    color: '#003f87',
    primary: true,
  },
  {
    name: 'Tegucigalpa',
    country: 'Honduras',
    position: [14.0723, -87.2062] as [number, number],
    description: 'Regional support office',
    color: '#003f87',
    primary: false,
  },
  {
    name: 'Guatemala City',
    country: 'Guatemala',
    position: [14.6349, -90.5069] as [number, number],
    description: 'Partner network',
    color: '#006a6a',
    primary: false,
  },
  {
    name: 'San Salvador',
    country: 'El Salvador',
    position: [13.6929, -89.2182] as [number, number],
    description: 'Outreach program',
    color: '#006a6a',
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

        <div className="grid grid-cols-[1fr_320px] gap-10 items-start">
          <div className="h-[480px] rounded-[2rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <MapContainer
              center={[14.5, -87.5]}
              zoom={6}
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%', borderRadius: '2rem' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {locations.map((loc) =>
                loc.primary ? (
                  <Marker key={loc.name} position={loc.position} icon={defaultIcon}>
                    <Popup>
                      <strong>{loc.name}</strong>
                      <br />
                      {loc.description}
                    </Popup>
                  </Marker>
                ) : (
                  <CircleMarker
                    key={loc.name}
                    center={loc.position}
                    radius={8}
                    pathOptions={{ color: loc.color, fillColor: loc.color, fillOpacity: 0.75, weight: 2 }}
                  >
                    <Popup>
                      <strong>{loc.name}</strong>, {loc.country}
                      <br />
                      {loc.description}
                    </Popup>
                  </CircleMarker>
                )
              )}
            </MapContainer>
          </div>

          <div>
            <h3 className="font-manrope text-[1.1rem] font-bold text-on-surface mb-5">
              Presence by Country
            </h3>

            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-4 px-5 py-4 rounded-[2rem] bg-surface-container-lowest shadow-sm">
                <span className="font-manrope text-[1.6rem] font-extrabold tracking-tight leading-none text-primary min-w-[3.5rem]">
                  65%
                </span>
                <span className="text-[0.88rem] font-semibold text-on-surface-variant">Honduras</span>
              </div>
              <div className="flex items-center gap-4 px-5 py-4 rounded-[2rem] bg-surface-container-lowest shadow-sm">
                <span className="font-manrope text-[1.6rem] font-extrabold tracking-tight leading-none text-secondary min-w-[3.5rem]">
                  20%
                </span>
                <span className="text-[0.88rem] font-semibold text-on-surface-variant">Guatemala</span>
              </div>
              <div className="flex items-center gap-4 px-5 py-4 rounded-[2rem] bg-surface-container-lowest shadow-sm">
                <span className="font-manrope text-[1.6rem] font-extrabold tracking-tight leading-none text-outline min-w-[3.5rem]">
                  15%
                </span>
                <span className="text-[0.88rem] font-semibold text-on-surface-variant">
                  El Salvador &amp; Others
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {locations.map((loc) => (
                <div key={loc.name} className="flex items-start gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-[0.35rem]"
                    style={{ background: loc.color }}
                  />
                  <div>
                    <strong className="block text-[0.9rem] font-bold text-on-surface">{loc.name}</strong>
                    <span className="text-[0.8rem] text-on-surface-variant">{loc.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
