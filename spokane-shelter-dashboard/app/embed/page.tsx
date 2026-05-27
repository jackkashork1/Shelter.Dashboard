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
import ClientTimestamp from '@/components/ClientTimestamp';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const SBA_LOGO =
  'https://growthzonecmsprodeastus.azureedge.net/sites/2593/2022/04/Spokane-Business-Association-300x161.png';

const LAST_UPDATED = shelters[0]?.lastUpdated ?? new Date().toISOString();

// No utility bar — single 48px main bar
const HEADER_H = 48;
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
      }}
    >
      {/* ── Header — 48px, no utility bar ── */}
      <header style={{ flexShrink: 0, position: 'relative', zIndex: 100 }}>
        <div
          style={{
            height: HEADER_H,
            background: 'white',
            borderBottom: '3px solid #00B4C8',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 16,
            overflow: 'hidden',
          }}
        >
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SBA_LOGO}
              alt="Spokane Business Association"
              style={{ height: 34, width: 'auto', display: 'block' }}
            />
          </div>

          {/* Filter pills */}
          <div
            className="no-scrollbar"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              overflowX: 'auto',
              minWidth: 0,
            }}
          >
            {FILTER_PILLS.map((pill) => {
              const active = activeFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => setActiveFilter(pill.value)}
                  style={{
                    flexShrink: 0,
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: active ? 'none' : '1px solid #e2e8f0',
                    background: active ? '#00B4C8' : 'white',
                    color: active ? 'white' : '#374151',
                    transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = '#E6F9FB';
                      e.currentTarget.style.borderColor = '#00B4C8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Last-updated (desktop) + Help button */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              className="hidden md:block"
              style={{
                fontSize: 11,
                color: '#9ca3af',
                whiteSpace: 'nowrap',
                lineHeight: 1.5,
                textAlign: 'right',
              }}
            >
              <div>
                <a
                  href="https://ShelterMeSpokane.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#00B4C8', textDecoration: 'none', fontWeight: 600 }}
                >
                  Live availability: ShelterMeSpokane.org
                </a>
              </div>
              <div>
                Updated: <ClientTimestamp isoString={LAST_UPDATED} fallback="—" />
              </div>
            </div>
            <HelpButton />
          </div>
        </div>
      </header>

      {/* ── Desktop: sidebar + map ── */}
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

      {/* ── Mobile: "Need Help?" FAB ── */}
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

      {/* ── Mobile: persistent sheet handle ── */}
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

      {/* ── Mobile: sheet backdrop ── */}
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

      {/* ── Mobile: slide-up bottom sheet ── */}
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
