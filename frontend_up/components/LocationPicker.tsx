"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { Map as LeafletMap, LatLngLiteral } from "leaflet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Loader2, X } from "lucide-react"

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
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; subtitle: string; lat: number; lon: number }>>([])
  const [searching, setSearching] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  // Update internal state when initial props change
  useEffect(() => {
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

  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const cleaned = val.trim();
    if (!cleaned || cleaned.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        let viewboxParam = "";
        if (position?.lat && position?.lng) {
          const delta = 0.8;
          viewboxParam = `&viewbox=${(position.lng - delta).toFixed(4)},${(position.lat + delta).toFixed(4)},${(position.lng + delta).toFixed(4)},${(position.lat - delta).toFixed(4)}&bounded=0`;
        }

        const isPin = /^[1-9][0-9]{5}$/.test(cleaned);
        const searchUrl = isPin
          ? `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleaned}&countrycodes=in&limit=15&addressdetails=1${viewboxParam}`
          : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleaned)}&countrycodes=in&limit=15&addressdetails=1${viewboxParam}`;

        let response = await fetch(searchUrl, {
          headers: { "Accept-Language": "en" }
        });
        let data = await response.json();

        // Fallback if viewbox yielded 0 results
        if ((!data || data.length === 0) && viewboxParam) {
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleaned)}&countrycodes=in&limit=15&addressdetails=1`;
          response = await fetch(fallbackUrl, {
            headers: { "Accept-Language": "en" }
          });
          data = await response.json();
        }

        if (Array.isArray(data)) {
          const seen = new Set<string>();
          const mapped = data
            .map((item) => {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              const addr = item.address || {};
              const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || "";
              const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.road || "";
              const state = addr.state || "";
              const postcode = addr.postcode || "";

              const title = item.name || suburb || city || item.display_name.split(",")[0].trim();
              const subParts = [];
              if (suburb && suburb !== title) subParts.push(suburb);
              if (city && city !== title) subParts.push(city);
              if (state) subParts.push(state);
              if (postcode) subParts.push(postcode);

              const subtitle = subParts.length > 0 ? subParts.join(", ") : item.display_name;

              let distanceKm: number | null = null;
              let distanceText = "";
              if (position?.lat && position?.lng) {
                distanceKm = calculateDistanceKm(position.lat, position.lng, lat, lon);
                distanceText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`;
              }

              return {
                id: item.place_id ? String(item.place_id) : `${lat}_${lon}`,
                title,
                subtitle,
                lat,
                lon,
                distanceKm,
                distanceText,
              };
            })
            .filter((item) => {
              const key = `${item.title.toLowerCase()}_${item.lat.toFixed(2)}_${item.lon.toFixed(2)}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

          if (position?.lat && position?.lng) {
            mapped.sort((a, b) => {
              if (a.distanceKm != null && b.distanceKm != null) {
                return a.distanceKm - b.distanceKm;
              }
              return 0;
            });
          }

          setSuggestions(mapped);
        }
      } catch (err) {
        console.error("Geocoding suggestions error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (item: { title: string; subtitle: string; lat: number; lon: number }) => {
    setSearchQuery(item.subtitle);
    setSuggestions([]);
    setPosition({ lat: item.lat, lng: item.lon });
    setAddress(item.subtitle);
    onLocationChange({ address: item.subtitle, latitude: item.lat, longitude: item.lon });
    if (mapRef.current) {
      mapRef.current.setView([item.lat, item.lon], 15);
    }
  };

  const handleSearch = useCallback(async () => {
    if (disabled || !searchQuery.trim()) return
    try {
      setSearching(true)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=1`
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        const newLat = parseFloat(lat)
        const newLng = parseFloat(lon)
        setPosition({ lat: newLat, lng: newLng })
        setAddress(display_name)
        setSuggestions([])
        onLocationChange({ address: display_name, latitude: newLat, longitude: newLng })
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 14)
        }
      } else {
        alert("Location not found.")
      }
    } catch (error) {
      console.error("Error during geocoding:", error)
      alert("Failed to search for location.")
    } finally {
      setSearching(false)
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
        <div className="relative flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              id="location-search"
              placeholder="Enter city, landmark or address"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-2xl h-12 px-4 pr-10"
              disabled={disabled}
            />
            {searching && (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin absolute right-3 top-4" />
            )}
            {!searching && searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Dropdown Suggestions Card */}
            {suggestions.length > 0 && (
              <div className="absolute top-14 left-0 right-0 z-[2000] bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                <div className="px-3.5 py-2 bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>{suggestions.some(i => (i as any).distanceText) ? `Nearby Locations (${suggestions.length})` : `Matching Locations (${suggestions.length})`}</span>
                  <button
                    type="button"
                    onClick={() => setSuggestions([])}
                    className="hover:text-foreground text-muted-foreground p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-accent flex items-start gap-3 transition-colors border-b border-border/50 last:border-b-0"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <div className="truncate flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{item.title}</span>
                        {(item as any).distanceText ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                            {(item as any).distanceText}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSearch}
            disabled={disabled || searching}
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
          zoom={position ? 14 : 5}
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
