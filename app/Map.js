"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Fix broken marker icon in Next.js
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
});

export default function Map({ progress }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // 🌍 Realistic journey route
  const route = [
    [52.6369, -1.1337], // Leicester
    [53.4084, -2.9916], // Liverpool
    [53.3498, -6.2603], // Dublin
    [53.2707, -9.0568], // Galway
    [50, -30],          // Mid Atlantic
    [47.5615, -52.7126], // Newfoundland
    [46.8139, -71.2080], // Quebec
    [43.6510, -79.3470], // Toronto
    [40.7128, -74.0060], // New York
    [40.8135, -74.0745]  // MetLife Stadium
  ];

  // 🔥 Interpolate between points for smooth movement
  const interpolate = (start, end, t) => {
    return [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t
    ];
  };

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map").setView([52, -1], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    // 🟦 Draw route
    L.polyline(route, {
      color: "blue",
      weight: 4
    }).addTo(map);

    // 📍 Marker
    markerRef.current = L.marker(route[0]).addTo(map);

    mapRef.current = map;
  }, []);

  // 🚀 Movement + camera follow
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;

    const totalSegments = route.length - 1;
    const scaledProgress = (progress / 100) * totalSegments;

    const segmentIndex = Math.floor(scaledProgress);
    const segmentProgress = scaledProgress - segmentIndex;

    const start = route[segmentIndex];
    const end = route[segmentIndex + 1] || route[segmentIndex];

    const position = interpolate(start, end, segmentProgress);

    // move marker
    markerRef.current.setLatLng(position);

    // 🔥 make map follow marker
    mapRef.current.panTo(position, {
      animate: true,
      duration: 1
    });

    // 🔥 dynamic zoom
    if (progress > 80) {
      mapRef.current.setZoom(5);
    } else if (progress > 40) {
      mapRef.current.setZoom(4);
    } else {
      mapRef.current.setZoom(3);
    }

  }, [progress]);

  return (
    <div
      id="map"
      style={{ height: "450px", width: "100%", borderRadius: "10px" }}
    />
  );
}