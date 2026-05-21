"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { CAMPUS_COORDINATES } from "@/lib/campus-coordinates";
import { CAMPUS_LOCATIONS, type CampusLocation } from "@/lib/campus-locations";

type SelectedCoords = { lat: number; lng: number };

type LocationPickerMapProps = {
  campus: string;
  selectedCoords: SelectedCoords | null;
  selectedLocationLabel: string;
  onSelect: (coords: SelectedCoords, label: string) => void;
};

const defaultIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: white;
      border: 2px solid rgba(0,0,0,0.2);
      box-shadow: 0 6px 16px rgba(0,0,0,.35);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const activeIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 9999px;
      background: #10b981;
      border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 8px 20px rgba(16,185,129,.45);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapClickHandler({
  onSelectCustom,
}: {
  onSelectCustom: (coords: SelectedCoords) => void;
}) {
  useMapEvents({
    click(event) {
      onSelectCustom({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function GeolocateControl({
  onSelect,
}: {
  onSelect: (coords: SelectedCoords) => void;
}) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  const controlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!controlRef.current) return;

    L.DomEvent.disableClickPropagation(controlRef.current);
    L.DomEvent.disableScrollPropagation(controlRef.current);
  }, []);

  const handleLocate = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!navigator.geolocation) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        map.setView([coords.lat, coords.lng], 16);
        onSelect(coords);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div
      ref={controlRef}
      className="absolute bottom-3 right-3 z-[1000] pointer-events-auto"
    >
      <button
        type="button"
        onClick={handleLocate}
        disabled={isLocating}
        className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
      >
        {isLocating ? "Konum aranıyor..." : "Konumumu bul"}
      </button>
    </div>
  );
}

export default function LocationPickerMap({
  campus,
  selectedCoords,
  selectedLocationLabel,
  onSelect,
}: LocationPickerMapProps) {
  const locations: CampusLocation[] = Object.values(CAMPUS_LOCATIONS).flat();
  const center = CAMPUS_COORDINATES[campus] || CAMPUS_COORDINATES["Diğer"];
  const isCustom =
    !!selectedCoords &&
    !locations.some((location) => location.label === selectedLocationLabel);

  return (
    <MapContainer
      key={campus}
      center={[center.lat, center.lng]}
      zoom={15}
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
      className="relative h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />

      {locations.map((location) => {
        const isSelected =
          !isCustom && selectedLocationLabel === location.label;

        return (
          <Marker
            key={location.label}
            position={[location.lat, location.lng]}
            icon={isSelected ? activeIcon : defaultIcon}
            eventHandlers={{
              click() {
                onSelect({ lat: location.lat, lng: location.lng }, location.label);
              },
            }}
          />
        );
      })}

      {selectedCoords && isCustom && (
        <Marker
          position={[selectedCoords.lat, selectedCoords.lng]}
          icon={activeIcon}
        />
      )}

      <GeolocateControl onSelect={(coords) => onSelect(coords, "Konumum")} />

      <MapClickHandler
        onSelectCustom={(coords) => onSelect(coords, "Haritadan seçildi")}
      />
    </MapContainer>
  );
}
