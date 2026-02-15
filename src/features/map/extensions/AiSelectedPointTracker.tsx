'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAtomValue } from 'jotai';
import { aiSelectedPointAtom } from '@/features/analysis/atoms/analysisAtoms';

export default function AiSelectedPointTracker() {
  const map = useMap();
  const selected = useAtomValue(aiSelectedPointAtom);

  useEffect(() => {
    if (!selected) return;

    const { lat, lng, properties } = selected;
    const targetLat = Number(lat);
    const targetLng = Number(lng);
    if (Number.isNaN(targetLat) || Number.isNaN(targetLng)) return;

    // ensure visible by using a reasonable zoom
    const targetZoom = Math.max(map.getZoom(), 16);
    map.flyTo([targetLat, targetLng], targetZoom, { duration: 0.5 });

    // add a temporary marker / circle
    const circle = L.circleMarker([targetLat, targetLng], {
      radius: 8,
      fillColor: '#ff5722',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
      pane: 'markerPane',
    }).addTo(map);

    if (properties) {
      const content = Object.keys(properties)
        .map((k) => `<strong>${k}</strong>: ${properties[k]}`)
        .join('<br/>');
      circle.bindPopup(content).openPopup();
    }

    return () => {
      try {
        circle.remove();
      } catch (e) {
        // ignore
      }
    };
  }, [map, selected]);

  return null;
}
