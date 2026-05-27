'use client';

import type { FilterType } from '@/lib/filters';
import { FILTER_PILLS } from '@/lib/filters';
import HelpButton from './HelpButton';
import ClientTimestamp from './ClientTimestamp';

type HeaderBarProps = {
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  lastUpdated: string;
};

// Colour logo (works on white background)
const SBA_LOGO =
  'https://growthzonecmsprodeastus.azureedge.net/sites/2593/2022/04/Spokane-Business-Association-300x161.png';

export default function HeaderBar({
  activeFilter,
  onFilterChange,
  lastUpdated,
}: HeaderBarProps) {
  return (
    <header style={{ flexShrink: 0, position: 'relative', zIndex: 100 }}>

      {/* ── Utility bar — 28px teal ───────────────────────────────────────── */}
      <div
        style={{
          height: 28,
          background: '#00B4C8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 16px',
          gap: 18,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          &#128222;&nbsp;509.590.0600
        </span>
        <a
          href="mailto:info@spokanebusinessassociation.com"
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.9)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Email SBA
        </a>
        <a
          href="https://spokanebusinessassociation.com/login"
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.9)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Login
        </a>
      </div>

      {/* ── Main bar — 64px white ─────────────────────────────────────────── */}
      <div
        style={{
          height: 64,
          background: 'white',
          borderBottom: '3px solid #00B4C8',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
          overflow: 'hidden',
        }}
      >
        {/* LEFT: SBA colour logo */}
        <div style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SBA_LOGO}
            alt="Spokane Business Association"
            style={{ height: 48, width: 'auto', display: 'block' }}
          />
        </div>

        {/* CENTER: Filter pills — horizontally scrollable */}
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
                onClick={() => onFilterChange(pill.value)}
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

        {/* RIGHT: live data link + last-updated (desktop) + Help button */}
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
              Updated: <ClientTimestamp isoString={lastUpdated} fallback="—" />
            </div>
          </div>
          <HelpButton />
        </div>
      </div>
    </header>
  );
}
