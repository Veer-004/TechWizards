"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Lazy-load MapView to fix SSR issues with Leaflet
const MapView = dynamic(() => import("./MapView"), { ssr: false });

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

export default function Page() {
  const [reports, setReports] = useState<Report[] | undefined>(undefined);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/reports/");
        const result = await res.json();

        const data: Report[] = (result.reports || []).map((r: any) => ({
          ...r,
          id: r.id || r._id,
        }));

        setReports(data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="flex h-screen">
      <MapView
        reports={reports}
        selectedReport={selectedReport}
        setSelectedReport={setSelectedReport}
      />
    </div>
  );
}
