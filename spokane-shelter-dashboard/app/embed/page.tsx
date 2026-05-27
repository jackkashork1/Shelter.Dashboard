'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { shelters } from '@/lib/shelters';
import type { ShelterEntry } from '@/lib/shelters';
import type { FilterType } from '@/lib/filters';
import { FILTER_PILLS, matchesFilter } from '@/lib/filters';
import Sidebar from '@/components/Sidebar';
import HelpButton from '@/components/HelpButton';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const SBA_LOGO =
  'https://growthzonecmsprodeastus.azureedge.net/sites/2593/2022/04/Spokane-Business-Association-300x161.png';

const HEADER_H = 44;
const HANDLE_H = 48;

type AvailMap = Record<string, { status: string; bedsAvailable: number | null }>;

function parseFilterParam(raw: string | null): FilterType {
  const valid = FILTER_PILLS.map((p) => p.value);
  return (valid.includes(raw as FilterType) ? raw : 'all') as FilterType;
}

function EmbedContent() {
  const params = useSearchParams();
  const initialFilter = parseFilterParam(params.get('filter'));

  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [mobileSheetOpen, setSheet]     = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [availability, setAvailability]         = useState<AvailMap>({});
  const [availLastUpdated, setAvailLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch('/availability.json')
      .then((r) => r.json())
      .then((data: { lastUpdated?: string; shelters?: AvailMap }) => {
        if (data.shelters)    setAvailability(data.shelters);
        if (data.lastUpdated) setAvailLastUpdated(data.lastUpdated);
      })
      .catch(() => {});
  }, []);

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
        minWidth: 320,
      }}
    >
      {/* Slim 44px teal header */}
      <div
        style={{
          height: HEADER_H,
          flexShrink: 0,
          background: '#00B4C8',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 10,
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SBA_LOGO}
          alt="Spokane Business Association"
          style={{ height: 30, width: 'auto', flexShrink: 0 }}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            overflowX: 'auto',
            scrollbarWidth: 'none' as const,
            minWidth: 0,
          }}
          className="no-scrollbar"
        >
          {FILTER_PILLS.map((pill) => {
            const active = activeFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => setActiveFilter(pill.value)}
                style={{
                  flexShrink: 0,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  background: active ? 'white' : 'rgba(255,255,255,0.15)',
                  color: active ? '#00B4C8' : 'rgba(255,255,255,0.9)',
                  fontFamily: 'inherit',
                  transition: 'background 120ms ease',
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <HelpButton />
      </div>

      {/* Desktop: sidebar + map */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: `calc(100vh - ${HEADER_H}px)`,
          overflow: 'hidden',
        }}
      >
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

      {/* Mobile: "Need Help?" FAB */}
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

      {/* Mobile: persistent sheet handle */}
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

      {/* Mobile: sheet backdrop */}
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

      {/* Mobile: slide-up bottom sheet */}
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

export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#f4f6f9',
            fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif",
            fontSize: 14,
            color: '#6b7280',
          }}
        >
          Loading map&hellip;
        </div>
      }
    >
      <EmbedContent />
    </Suspense>
  );
}
