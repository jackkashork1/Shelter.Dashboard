'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from 'react';
import { shelters } from '@/lib/shelters';
import type { ShelterEntry } from '@/lib/shelters';
import type { FilterType } from '@/lib/filters';
import { matchesFilter } from '@/lib/filters';
import HeaderBar from '@/components/HeaderBar';
import Sidebar from '@/components/Sidebar';
import HelpButton from '@/components/HelpButton';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const LAST_UPDATED = shelters[0]?.lastUpdated ?? new Date().toISOString();

// Two-bar header: 28px utility + 64px main = 92px total
const HEADER_H  = 92;
// Mobile persistent bottom handle
const HANDLE_H  = 48;

type AvailMap = Record<string, { status: string; bedsAvailable: number | null }>;

export default function DashboardPage() {
  const [activeFilter, setActiveFilter]   = useState<FilterType>('all');
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [mobileSheetOpen, setSheet]       = useState(false);
  const [userLocation, setUserLocation]   = useState<{ lat: number; lng: number } | null>(null);

  // ── Live availability (fetched from /availability.json) ─────────────────
  const [availability, setAvailability]         = useState<AvailMap>({});
  const [availLastUpdated, setAvailLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch('/availability.json')
      .then((r) => r.json())
      .then((data: { lastUpdated?: string; shelters?: AvailMap }) => {
        if (data.shelters)    setAvailability(data.shelters);
        if (data.lastUpdated) setAvailLastUpdated(data.lastUpdated);
      })
      .catch(() => {}); // silently fail if file doesn't exist
  }, []);

  // ── Merge static shelter records with live availability data ─────────────
  const mergedShelters = useMemo<ShelterEntry[]>(
    () =>
      shelters.map((s) => {
        const avail = availability[s.id];
        if (!avail) return s;
        return {
          ...s,
          status: avail.status as ShelterEntry['status'],
          bedsAvailable: avail.bedsAvailable,
        };
      }),
    [availability],
  );

  const filteredShelters = useMemo(
    () =>
      activeFilter === 'all'
        ? mergedShelters
        : mergedShelters.filter((s) => matchesFilter(s, activeFilter)),
    [activeFilter, mergedShelters],
  );

  function handleUserLocation(lat: number, lng: number) {
    setUserLocation({ lat, lng });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif",
      }}
    >
      {/* ── Header ── */}
      <HeaderBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        lastUpdated={LAST_UPDATED}
      />

      {/* ── Desktop: sidebar + map ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: `calc(100vh - ${HEADER_H}px)`,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar (hidden on mobile) */}
        <div
          className="hidden md:flex"
          style={{
            width: 300,
            flexShrink: 0,
            height: '100%',
            flexDirection: 'column',
          }}
        >
          <Sidebar
            shelters={filteredShelters}
            selectedShelterId={selectedId}
            onSelect={setSelectedId}
            onUserLocation={handleUserLocation}
            availabilityLastUpdated={availLastUpdated}
          />
        </div>

        {/* Map */}
        <div
          style={{
            flex: 1,
            height: `calc(100vh - ${HEADER_H}px)`,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 400,
          }}
        >
          <MapView
            shelters={filteredShelters}
            selectedId={selectedId}
            onSelect={setSelectedId}
            activeFilter={activeFilter}
            userLocation={userLocation}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT (md:hidden)
          ════════════════════════════════════════ */}

      {/* "Need Help?" FAB — fixed above the sheet handle, bottom-right */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: HANDLE_H + 12,
          right: 14,
          zIndex: 450,
        }}
      >
        <HelpButton />
      </div>

      {/* Persistent sheet handle — always visible on mobile */}
      <div
        className="md:hidden"
        onClick={() => setSheet((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: HANDLE_H,
          background: 'white',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          cursor: 'pointer',
          zIndex: 400,
          userSelect: 'none',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2 }} />
        <span style={{ fontSize: 13, color: '#4b5563', lineHeight: 1 }}>
          {filteredShelters.filter(s => s.lat != null).length} shelters · tap to browse
        </span>
      </div>

      {/* Sheet backdrop */}
      {mobileSheetOpen && (
        <div
          className="md:hidden"
          onClick={() => setSheet(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 490,
          }}
        />
      )}

      {/* Slide-up bottom sheet */}
      {mobileSheetOpen && (
        <div
          className="md:hidden bottom-sheet-enter"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '65vh',
            background: 'white',
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Drag handle strip */}
          <div
            onClick={() => setSheet(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: HANDLE_H,
              flexShrink: 0,
              cursor: 'pointer',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2 }} />
          </div>

          {/* Sheet content — full Sidebar with weather + what-to-do + list */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Sidebar
              shelters={filteredShelters}
              selectedShelterId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setSheet(false);
              }}
              onUserLocation={handleUserLocation}
              availabilityLastUpdated={availLastUpdated}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}
