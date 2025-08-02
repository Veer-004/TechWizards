"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface Report {
  id: string;
  description: string;
  status: "Pending" | "In Progress" | "Resolved";
  location: {
    coordinates: [number, number];
  };
  created_at: string;
  image_url?: string;
}

interface MapViewProps {
  reports?: Report[];  // ✅ Optional
  selectedReport: Report | null;
  setSelectedReport: (r: Report | null) => void;
}

const statusColors: Record<string, string> = {
  Pending: "bg-red-500",
  "In Progress": "bg-yellow-500",
  Resolved: "bg-green-500",
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Pending":
      return "destructive";
    case "In Progress":
      return "default";
    case "Resolved":
      return "secondary";
    default:
      return "default";
  }
};

const createIcon = (color: string) =>
  L.divIcon({
    html: `<div class="w-4 h-4 ${color} rounded-full border-2 border-white shadow-md"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

export default function MapView({
  reports,
  selectedReport,
  setSelectedReport,
}: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number]>([23.0225, 72.5714]); // Ahmedabad default

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
        }
      );
    }
  }, []);

  if (!reports) {
    return <div className="p-4">Loading map and reports...</div>;
  }

  return (
    <>
      {/* Map */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={userLocation}
          zoom={14}
          scrollWheelZoom
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {/* Report Markers */}
          {(reports || []).map((report) =>
            report.id ? (
              <Marker
                key={`marker-${report.id}`}
                position={[
                  report.location.coordinates[1],
                  report.location.coordinates[0],
                ]}
                icon={createIcon(statusColors[report.status])}
                eventHandlers={{
                  click: () => setSelectedReport(report),
                }}
              />
            ) : null
          )}

          {/* User Location */}
          <Marker
            key="marker-user"
            position={userLocation}
            icon={createIcon("bg-blue-600")}
          >
            <Popup>You are here</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white border-l overflow-y-auto z-10">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            Reports ({reports?.length || 0})
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {(reports || []).map((report) =>
            report.id ? (
              <Card
                key={`card-${report.id}`}
                onClick={() => setSelectedReport(report)}
                className={`cursor-pointer ${
                  selectedReport?.id === report.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm">#{report.id}</CardTitle>
                    <Badge variant={getStatusBadge(report.status) as any}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {report.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {report.location.coordinates[1].toFixed(4)},{" "}
                    {report.location.coordinates[0].toFixed(4)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      </div>
    </>
  );
}
