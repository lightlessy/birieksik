"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";

type RequestPin = {
  id: string;
  title: string;
  activity_type: string;
  campus: string;
  location_text?: string | null;
  time_text?: string | null;
  needed_count: number;
  latitude: number;
  longitude: number;
};

const pinIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 9999px;
      background: rgba(255,255,255,.95);
      color: black;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 12px 40px rgba(0,0,0,.55);
      border: 1px solid rgba(255,255,255,.65);
      backdrop-filter: blur(8px);
    ">
      +1
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export default function RequestsMap({ requests }: { requests: RequestPin[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="font-semibold text-white">Kampüs haritası</p>
        <p className="mt-1 text-sm text-neutral-400">
          Haritada kişiler değil, sadece konum paylaşılmış aktif istekler görünür.
        </p>
      </div>

      <div className="h-[320px] w-full">
        <MapContainer
          center={[41.047, 29.0]}
          zoom={12}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />

          {requests.map((request) => (
            <Marker
              key={request.id}
              position={[request.latitude, request.longitude]}
              icon={pinIcon}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{request.title}</p>
                  <p style={{ margin: "6px 0 0" }}>
                    {request.activity_type} · {request.campus}
                  </p>
                  {request.location_text && (
                    <p style={{ margin: "6px 0 0" }}>{request.location_text}</p>
                  )}
                  {request.time_text && (
                    <p style={{ margin: "6px 0 0" }}>{request.time_text}</p>
                  )}
                  <Link href={`/requests/${request.id}`}>İsteğe git</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}