"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from "@react-google-maps/api";
import { Search, Loader2, AlertCircle } from "lucide-react";

// Define libraries outside to prevent re-renders
const LIBRARIES: "places"[] = ["places"];
const UK_CENTER = { lat: 54.5, lng: -2.0 };

interface AddressMapPickerProps {
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  initialCity?: string;
  initialPostcode?: string;
  onAddressSelect: (data: any) => void;
}

export function AddressMapPicker({
  initialAddress,
  initialLatitude,
  initialLongitude,
  onAddressSelect,
}: AddressMapPickerProps) {
  // 1. Singleton Loader: Prevents "Error loading Google Maps" if script exists
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // Ensure this is set
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchValue, setSearchValue] = useState(initialAddress || "");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initial Marker Position
  const [markerPos, setMarkerPos] = useState({
    lat: initialLatitude || UK_CENTER.lat,
    lng: initialLongitude || UK_CENTER.lng,
  });

  // 2. Sync State with Props (Important for your form)
  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      const newPos = { lat: initialLatitude, lng: initialLongitude };
      setMarkerPos(newPos);
      if (map) map.panTo(newPos);
    }
    if (initialAddress) setSearchValue(initialAddress);
  }, [initialLatitude, initialLongitude, initialAddress, map]);

  // 3. Handle Place Selection from Search
  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formattedAddress = place.formatted_address || "";

    const newPos = { lat, lng };
    setMarkerPos(newPos);
    setSearchValue(formattedAddress);
    map?.panTo(newPos);
    map?.setZoom(17);

    // Extracting City and Postcode
    const city =
      place.address_components?.find((c) => c.types.includes("postal_town"))?.long_name || "";
    const postcode =
      place.address_components?.find((c) => c.types.includes("postal_code"))?.long_name || "";

    onAddressSelect({ address: formattedAddress, city, postcode, latitude: lat, longitude: lng });
  };

  // 4. Handle Map Click (Manual Pinning)
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newPos = { lat, lng };

      setMarkerPos(newPos);

      // Reverse Geocode to fill the form
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newPos }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const res = results[0];
          setSearchValue(res.formatted_address);

          const city =
            res.address_components?.find((c) => c.types.includes("postal_town"))?.long_name || "";
          const postcode =
            res.address_components?.find((c) => c.types.includes("postal_code"))?.long_name || "";

          onAddressSelect({
            address: res.formatted_address,
            city,
            postcode,
            latitude: lat,
            longitude: lng,
          });
        }
      });
    },
    [onAddressSelect],
  );

  if (loadError)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-500">
        <AlertCircle size={18} />
        <span className="text-sm font-medium">
          Google Maps API Error: Check Console for details
        </span>
      </div>
    );

  if (!isLoaded)
    return (
      <div className="flex h-[400px] w-full animate-pulse items-center justify-center rounded-[12px] bg-[#1C1611] text-[#5A4232]">
        <Loader2 className="mr-2 animate-spin" /> Loading Map...
      </div>
    );

  return (
    <div className="w-full space-y-4">
      {/* Search Input Section */}
      <Autocomplete
        onLoad={(ac) => (autocompleteRef.current = ac)}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: "GB" } }}
      >
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" size={18} />
          <input
            type="text"
            className="h-11 w-full rounded-[10px] border border-[#2E231A] bg-[#0F0A06] pl-10 pr-4 text-[#F5F1E8] outline-none transition-all placeholder:text-[#5A4232] focus:border-[#C8924A]/50"
            placeholder="Start typing a UK address..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </Autocomplete>

      {/* Map Section */}
      <div className="overflow-hidden rounded-[12px] border border-[#2E231A] shadow-xl">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "400px" }}
          center={markerPos}
          zoom={initialLatitude ? 17 : 6}
          onLoad={setMap}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            clickableIcons: false,
            styles: darkMapStyles,
          }}
        >
          <Marker position={markerPos} animation={google.maps.Animation.DROP} />
        </GoogleMap>
      </div>
    </div>
  );
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];
