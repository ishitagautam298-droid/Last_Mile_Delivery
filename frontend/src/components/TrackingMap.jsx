import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (color, text) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        <span>${text}</span>
      </div>
    `,
    iconSize: [40, 24],
    iconAnchor: [20, 12]
  });
};

const TrackingMap = ({ pickupCoords, dropCoords, liveCoords, pickupAddress, dropAddress, status }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = liveCoords?.lat ? [liveCoords.lat, liveCoords.lng] : [23.2332, 77.4344];
      const map = L.map(mapContainerRef.current).setView(initialCenter, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const boundsPoints = [];

    // Pickup Marker
    if (pickupCoords?.lat && pickupCoords?.lng) {
      const pLat = pickupCoords.lat;
      const pLng = pickupCoords.lng;
      boundsPoints.push([pLat, pLng]);

      const pickupMarker = L.marker([pLat, pLng], {
        icon: createCustomIcon('#2563eb', '📦 Pickup')
      }).bindPopup(`<strong>Pickup Location:</strong><br/>${pickupAddress?.area || 'Origin'}, ${pickupAddress?.city || ''}`);
      layerGroup.addLayer(pickupMarker);
    }

    // Drop Marker
    if (dropCoords?.lat && dropCoords?.lng) {
      const dLat = dropCoords.lat;
      const dLng = dropCoords.lng;
      boundsPoints.push([dLat, dLng]);

      const dropMarker = L.marker([dLat, dLng], {
        icon: createCustomIcon('#16a34a', '🎯 Drop')
      }).bindPopup(`<strong>Delivery Destination:</strong><br/>${dropAddress?.area || 'Destination'}, ${dropAddress?.city || ''}`);
      layerGroup.addLayer(dropMarker);
    }

    // Live Driver Marker
    if (liveCoords?.lat && liveCoords?.lng && status !== 'Delivered') {
      const lLat = liveCoords.lat;
      const lLng = liveCoords.lng;
      boundsPoints.push([lLat, lLng]);

      const liveMarker = L.marker([lLat, lLng], {
        icon: createCustomIcon('#ea580c', '🛵 Driver')
      }).bindPopup(`<strong>Live Location:</strong><br/>Status: ${status}`);
      layerGroup.addLayer(liveMarker);
    }

    // Draw route polyline
    if (boundsPoints.length >= 2) {
      const polyline = L.polyline(boundsPoints, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: status === 'Delivered' ? null : '6, 8'
      });
      layerGroup.addLayer(polyline);

      map.fitBounds(boundsPoints, { padding: [40, 40] });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 13);
    }

  }, [pickupCoords, dropCoords, liveCoords, pickupAddress, dropAddress, status]);

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default TrackingMap;
