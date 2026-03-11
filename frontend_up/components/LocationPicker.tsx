"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { Map as LeafletMap, LatLngLiteral } from "leaflet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"



interface LocationPickerProps {
  initialAddress?: string
  initialLatitude?: number
  initialLongitude?: number
  onLocationChange: (location: { address: string; latitude: number; longitude: number }) => void
  disabled?: boolean
}

const DEFAULT_LATITUDE = 20.5937 // Center of India
const DEFAULT_LONGITUDE = 78.9629 // Center of India

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialAddress = "",
  initialLatitude,
  initialLongitude,
  onLocationChange,
  disabled,
}) => {
  const [address, setAddress] = useState(initialAddress)
  const [position, setPosition] = useState<LatLngLiteral | null>(
    initialLatitude && initialLongitude ? { lat: initialLatitude, lng: initialLongitude } : null
  )
  const [searchQuery, setSearchQuery] = useState(initialAddress)
  const mapRef = useRef<LeafletMap | null>(null)

  // Update internal state when initial props change
  useEffect(() => {
    // Fix for default Leaflet icons
    // This code only runs on the client side after the component has mounted
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    })

    setAddress(initialAddress)
    setPosition(initialLatitude && initialLongitude ? { lat: initialLatitude, lng: initialLongitude } : null)
    setSearchQuery(initialAddress)
  }, [initialAddress, initialLatitude, initialLongitude])

  const handleMapClick = useCallback(
    async (e: L.LeafletMouseEvent) => {
      if (disabled) return
      const { lat, lng } = e.latlng
      setPosition({ lat, lng })
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        )
        const data = await response.json()
        const newAddress = data.display_name || `${lat}, ${lng}`
        setAddress(newAddress)
        onLocationChange({ address: newAddress, latitude: lat, longitude: lng })
      } catch (error) {
        console.error("Error during reverse geocoding:", error)
        const newAddress = `${lat}, ${lng}`
        setAddress(newAddress)
        onLocationChange({ address: newAddress, latitude: lat, longitude: lng })
      }
    },
    [onLocationChange, disabled]
  )

  const handleMarkerDragEnd = useCallback(
    async (e: L.LeafletEvent) => {
      if (disabled) return
      const { lat, lng } = e.target.getLatLng()
      setPosition({ lat, lng })
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        )
        const data = await response.json()
        const newAddress = data.display_name || `${lat}, ${lng}`
        setAddress(newAddress)
        onLocationChange({ address: newAddress, latitude: lat, longitude: lng })
      } catch (error) {
        console.error("Error during reverse geocoding:", error)
        const newAddress = `${lat}, ${lng}`
        setAddress(newAddress)
        onLocationChange({ address: newAddress, latitude: lat, longitude: lng })
      }
    },
    [onLocationChange, disabled]
  )

  const handleSearch = useCallback(async () => {
    if (disabled || !searchQuery.trim()) return
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        const newLat = parseFloat(lat)
        const newLng = parseFloat(lon)
        setPosition({ lat: newLat, lng: newLng })
        setAddress(display_name)
        onLocationChange({ address: display_name, latitude: newLat, longitude: newLng })
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 13) // Zoom to the new location
        }
      } else {
        alert("Location not found.")
      }
    } catch (error) {
      console.error("Error during geocoding:", error)
      alert("Failed to search for location.")
    }
  }, [searchQuery, onLocationChange, disabled])

  function MapEvents() {
    useMapEvents({
      click: handleMapClick,
    })
    return null
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="space-y-2">
        <Label htmlFor="location-search" className="text-sm font-bold text-foreground uppercase tracking-wider">
          Search Location
        </Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="location-search"
            placeholder="Enter address or landmark"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-2xl h-12 px-4"
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={disabled}
            className="h-12 px-6 rounded-2xl shrink-0"
          >
            <Search className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="selected-address" className="text-sm font-bold text-foreground uppercase tracking-wider">
          Selected Address
        </Label>
        <Input
          id="selected-address"
          value={address}
          readOnly
          className="bg-input/50 border-border text-foreground rounded-2xl h-12 px-4 disabled:opacity-50"
          disabled={disabled}
        />
      </div>

      <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-border/50 shadow-inner">
        <MapContainer
          center={[position?.lat || DEFAULT_LATITUDE, position?.lng || DEFAULT_LONGITUDE]}
          zoom={position ? 13 : 5}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          ref={(map: LeafletMap | null) => {
            if (map) {
              mapRef.current = map;
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <Marker
              position={[position.lat, position.lng]}
              draggable={!disabled}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            ></Marker>
          )}
          <MapEvents />
        </MapContainer>
      </div>
    </div>
  )
}

export default LocationPicker
