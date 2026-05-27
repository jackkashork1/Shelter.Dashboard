'use client';

import { useEffect, useRef, useState } from 'react';
import type { ShelterEntry } from '@/lib/shelters';

interface Props {
  shelters: ShelterEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeFilter: string;
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapView({
  shelters,
  selectedId,
  onSelect,
  activeFilter,
  userLocation,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef  = useRef(false);
  const [loading, setLoading] = useState(true);

  // ── Listen for messages from the map iframe ──────────────────────────────
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'MAP_READY') {
        // Backup path: parent received MAP_READY ping from iframe
        readyRef.current = true;
        setLoading(false);
        sendToMap({ type: 'INIT_MAP', shelters, selectedId, filter: activeFilter });
      }
      if (event.data?.type === 'SHELTER_SELECTED') {
        onSelect(event.data.id);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Push shelter / filter changes ────────────────────────────────────────
  useEffect(() => {
    if (readyRef.current) {
      sendToMap({ type: 'UPDATE_SHELTERS', shelters, selectedId, filter: activeFilter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelters, activeFilter]);

  // ── Fly to selected shelter ───────────────────────────────────────────────
  useEffect(() => {
    if (readyRef.current && selectedId) {
      sendToMap({ type: 'FLY_TO', id: selectedId, selectedId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── Show user location circle ─────────────────────────────────────────────
  useEffect(() => {
    if (readyRef.current && userLocation) {
      sendToMap({ type: 'SHOW_USER_LOCATION', lat: userLocation.lat, lng: userLocation.lng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  function sendToMap(data: object) {
    iframeRef.current?.contentWindow?.postMessage(data, '*');
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#f5f7f8' }}>
      {/* Loading placeholder */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f7f8',
            zIndex: 10,
            gap: 12,
          }}
        >
          {/* Spinning ring */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '3px solid #e2e8f0',
              borderTopColor: '#00B4C8',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: 13, color: '#6b7280' }}>Loading map…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src="/map.html"
        onLoad={() => {
          // Primary path: iframe DOM has loaded — push data after 600ms
          // so Leaflet has time to initialise inside the iframe.
          setTimeout(() => {
            readyRef.current = true;
            setLoading(false);
            sendToMap({ type: 'INIT_MAP', shelters, selectedId, filter: activeFilter });
          }, 600);
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="Spokane Shelter Map"
      />
    </div>
  );
}
