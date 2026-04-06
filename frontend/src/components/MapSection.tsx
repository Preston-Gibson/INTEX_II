import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon broken by Vite's asset pipeline
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
    <section className="map-section">
      <div className="container">
        <div className="map-header">
          <span className="section-eyebrow">Our Reach</span>
          <h2>Where We Serve</h2>
          <p>
            Operating across Central America, Lucera maintains safe houses, legal
            offices, and partner networks to reach the most vulnerable children.
          </p>
        </div>

        <div className="map-layout">
          <div className="map-wrap">
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

          <div className="map-legend">
            <h3>Presence by Country</h3>

            <div className="map-stat-cards">
              <div className="map-stat-card map-stat-card--primary">
                <span className="map-stat-number">65%</span>
                <span className="map-stat-label">Honduras</span>
              </div>
              <div className="map-stat-card map-stat-card--secondary">
                <span className="map-stat-number">20%</span>
                <span className="map-stat-label">Guatemala</span>
              </div>
              <div className="map-stat-card map-stat-card--muted">
                <span className="map-stat-number">15%</span>
                <span className="map-stat-label">El Salvador &amp; Others</span>
              </div>
            </div>

            <div className="map-location-list">
              {locations.map((loc) => (
                <div key={loc.name} className="map-location-item">
                  <span
                    className="map-location-dot"
                    style={{ background: loc.color }}
                  />
                  <div>
                    <strong>{loc.name}</strong>
                    <span>{loc.description}</span>
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
