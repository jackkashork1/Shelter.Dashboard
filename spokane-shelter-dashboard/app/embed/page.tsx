'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { shelters } from '@/lib/shelters';
import type { FilterType } from '@/lib/filters';
import { FILTER_PILLS, matchesFilter } from '@/lib/filters';
import HelpButton from '@/components/HelpButton';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

// Teal colour logo for white / neutral backgrounds
const SBA_LOGO =
  'https://growthzonecmsprodeastus.azureedge.net/sites/2593/2022/04/Spokane-Business-Association-300x161.png';

// ── Validate a URL param as a filter type ──────────────────────────────────
function parseFilterParam(raw: string | null): FilterType {
  const valid = FILTER_PILLS.map((p) => p.value);
  return (valid.includes(raw as FilterType) ? raw : 'all') as FilterType;
}

function EmbedContent() {
  const params = useSearchParams();
  const initialFilter = parseFilterParam(params.get('filter'));

  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);

  const filteredShelters = useMemo(
    () =>
      activeFilter === 'all'
        ? shelters
        : shelters.filter((s) => matchesFilter(s, activeFilter)),
    [activeFilter],
  );

  const HEADER_H = 44;

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
      {/* Slim 44px header — teal background */}
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
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SBA_LOGO}
          alt="Spokane Business Association"
          style={{ height: 30, width: 'auto', flexShrink: 0 }}
        />

        {/* Filter pills */}
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

        {/* Help button */}
        <HelpButton />
      </div>

      {/* Map fills remaining height */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapView
          shelters={filteredShelters}
          selectedId={null}
          onSelect={() => {}}
          activeFilter={activeFilter}
        />
      </div>
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
