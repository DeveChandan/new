"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet' // Import Polyline
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';

const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapProps {
  locations: {
    lat: number;
    lng: number;
    popupText: string;
    workerId?: string; // Add workerId for identification
  }[];
  routes?: { // New routes prop
    [workerId: string]: {
      latitude: number;
      longitude: number;
      timestamp: string; // Assuming timestamp is string from backend
    }[];
  };
  center: [number, number];
  zoom?: number;
}

const Map: React.FC<MapProps> = ({ locations, routes, center, zoom = 13 }) => { // Add routes to props
  if (typeof window === 'undefined') {
    return null;
  }

  const polylineOptions = { color: 'blue', weight: 4 }; // Customize polyline appearance

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map((location, idx) => (
        <Marker key={idx} position={[location.lat, location.lng]} icon={DefaultIcon}>
          <Popup>{location.popupText}</Popup>
        </Marker>
      ))}

      {routes && Object.keys(routes).map(workerId => {
        const workerRoute = routes[workerId];
        if (workerRoute && workerRoute.length > 1) { // Only draw if there are at least two points
          const positions = workerRoute.map(point => [point.latitude, point.longitude]);
          return <Polyline key={workerId} positions={positions as L.LatLngExpression[]} pathOptions={polylineOptions} />;
        }
        return null;
      })}
    </MapContainer>
  )
}

export default Map