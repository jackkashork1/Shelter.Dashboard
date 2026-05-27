'use client';

import { useState, useMemo } from 'react';
import type { ShelterEntry } from '@/lib/shelters';
import { getStatusAccentColor, sortShelters } from '@/lib/filters';
import WhatToDoPanel from './WhatToDoPanel';
import WeatherBanner from './WeatherBanner';

// ── Haversine distance (miles) ────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Population pill colours ───────────────────────────────────────────────

const PILL: Record<string, { bg: string; text: string }> = {
  'Adult men':                   { bg: '#dbeafe', text: '#1e40af' },
  'Adult women':                 { bg: '#fce7f3', text: '#9d174d' },
  'Women with children':         { bg: '#fce7f3', text: '#9d174d' },
  Youth:                         { bg: '#ede9fe', text: '#5b21b6' },
  Families:                      { bg: '#d1fae5', text: '#065f46' },
  'Pregnant individuals':        { bg: '#d1fae5', text: '#065f46' },
  'LGBTQIA+':                    { bg: '#fef9c3', text: '#78350f' },
  'Domestic violence survivors': { bg: '#fee2e2', text: '#991b1b' },
};

// ── Data-age config (used by StatsBar live dot) ───────────────────────────

const AGE_CFG = {
  live:    { color: '#16a34a', label: 'Live' },
  stale:   { color: '#d97706', label: 'Stale' },
  offline: { color: '#6b7280', label: 'Offline' },
};

// ── System-capacity constants ─────────────────────────────────────────────
const FUNDED_BEDS = 867;
const EST_UNHOUSED = 1806;
const CAPACITY_PCT = Math.round((FUNDED_BEDS / EST_UNHOUSED) * 100); // ≈ 48

// ── Stats bar ─────────────────────────────────────────────────────────────

function StatsBar({
  shelters,
  availabilityLastUpdated,
}: {
  shelters: ShelterEntry[];
  availabilityLastUpdated?: string | null;
}) {
  const [tip, setTip] = useState(false);

  const regular  = shelters.filter((s) => s.status !== 'inclement-only' && s.barrierLevel !== 'inclement-only');
  const incCount = shelters.filter((s) => s.status === 'inclement-only' || s.barrierLevel === 'inclement-only').length;

  const totalBeds     = regular.reduce((n, s) => n + (s.bedsAvailable ?? 0), 0);
  const openCount     = regular.filter((s) => (s.bedsAvailable ?? 0) > 0 || s.status === 'open').length;
  const fullOrUnknown = regular.filter(
    (s) => s.status === 'full' || s.bedsAvailable === 0 || (s.bedsAvailable === null && s.status !== 'open'),
  ).length;

  // ── Data-freshness check against availability.json timestamp ─────────────
  const availAgeHours = availabilityLastUpdated
    ? (Date.now() - new Date(availabilityLastUpdated).getTime()) / 3_600_000
    : Infinity;
  const isDataStale = availAgeHours > 24;

  // Label for the stale banner (e.g. "6 hours ago" or "3 days ago")
  const staleLabel = !isFinite(availAgeHours)
    ? 'never'
    : availAgeHours < 48
    ? `${Math.round(availAgeHours)} hour${Math.round(availAgeHours) === 1 ? '' : 's'} ago`
    : `${Math.floor(availAgeHours / 24)} day${Math.floor(availAgeHours / 24) === 1 ? '' : 's'} ago`;

  // For the live dot when data IS fresh
  const dotStatus: 'live' | 'stale' | 'offline' =
    availAgeHours < 2 ? 'live' : availAgeHours < 12 ? 'stale' : 'offline';
  const ageCfg = AGE_CFG[dotStatus];

  return (
    <div
      style={{
        background: '#00B4C8',
        padding: '12px 16px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      {/* Headline: beds */}
      {totalBeds > 0 ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'white', lineHeight: 1 }}>
            {totalBeds}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>
            beds available
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.4 }}>
            Live availability unavailable — call shelters directly
          </div>
          <div style={{ fontSize: 11, marginTop: 3 }}>
            <a
              href="https://ShelterMeSpokane.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
            >
              Check real-time beds at ShelterMeSpokane.org ↗
            </a>
          </div>
        </div>
      )}

      {/* Sub-stats */}
      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
        <span><span style={{ color: 'white', fontWeight: 500 }}>{openCount}</span> open</span>
        <span>·</span>
        <span><span style={{ color: 'white', fontWeight: 500 }}>{fullOrUnknown}</span> full/unknown</span>
        <span>·</span>
        <span><span style={{ color: 'white', fontWeight: 500 }}>{incCount}</span> inclement</span>
      </div>

      {/* Data-freshness indicator — amber warning when stale, live dot when fresh */}
      {isDataStale ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
            background: 'rgba(251,191,36,0.20)',
            borderRadius: 5,
            padding: '5px 9px',
          }}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚠</span>
          <span style={{ fontSize: 11, color: '#fef9c3', fontWeight: 600, lineHeight: 1.4 }}>
            Data may be outdated — last updated {staleLabel}.{' '}
            <a href="/admin" style={{ color: '#fde68a', textDecoration: 'underline' }}>
              Update now
            </a>
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
          <div
            className={dotStatus === 'live' ? 'pulse-live' : undefined}
            style={{ width: 7, height: 7, borderRadius: '50%', background: ageCfg.color, flexShrink: 0 }}
          />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            {ageCfg.label}{dotStatus !== 'live' && ' — data may be outdated'}
          </span>
        </div>
      )}

      {/* ── Capacity gauge ──────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            System capacity vs. estimated nightly need
          </span>
          {/* ⓘ tooltip trigger */}
          <span
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            title={
              'January 2025 Point-in-Time Count found 1,806 people experiencing homelessness in Spokane County. ' +
              'The system has approximately 867 year-round funded shelter beds, meaning on any given night, ' +
              'roughly half of those experiencing homelessness have no shelter bed available.'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.4)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              cursor: 'help',
              flexShrink: 0,
            }}
          >
            i
          </span>
        </div>

        {/* Tooltip card (shown on hover) */}
        {tip && (
          <div
            style={{
              background: 'rgba(0,0,0,0.75)',
              color: 'white',
              fontSize: 11,
              lineHeight: 1.55,
              padding: '8px 10px',
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            Jan 2025 Point-in-Time Count: 1,806 unhoused in Spokane County.
            ~867 year-round funded beds — on any given night, roughly half have no shelter available.
          </div>
        )}

        {/* Bar */}
        <div
          style={{
            width: '100%',
            height: 10,
            borderRadius: 5,
            background: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${CAPACITY_PCT}%`,
              height: '100%',
              background: 'white',
              borderRadius: 5,
              transition: 'width 600ms ease',
            }}
          />
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
            {FUNDED_BEDS.toLocaleString()} funded beds
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            ~{EST_UNHOUSED.toLocaleString()} est. unhoused
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Availability badge ────────────────────────────────────────────────────

function AvailBadge({ shelter }: { shelter: ShelterEntry }) {
  if (shelter.status === 'inclement-only') {
    return <span style={{ fontSize: 11, color: '#2563eb', fontStyle: 'italic' }}>Weather only</span>;
  }
  if (shelter.status === 'full' || shelter.bedsAvailable === 0) {
    return (
      <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 9999, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
        Full
      </span>
    );
  }
  if (shelter.bedsAvailable !== null && shelter.bedsAvailable > 0) {
    return (
      <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 9999, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
        {shelter.bedsAvailable} beds
      </span>
    );
  }
  return (
    <span
      style={{
        background: '#f3f4f6',
        color: '#6b7280',
        fontSize: 11,
        padding: '2px 7px',
        borderRadius: 9999,
        whiteSpace: 'nowrap',
      }}
    >
      📞 Call ahead
    </span>
  );
}

// ── Copy-text builder ─────────────────────────────────────────────────────

function buildCopyText(s: ShelterEntry): string {
  const lines: string[] = [
    s.name,
    s.operator,
    `📍 ${s.address}`,
    `📞 ${s.phone}`,
    `Hours: ${s.hoursOpen}`,
    `Check-in: ${s.checkInWindow}`,
  ];
  if (s.requiresNavigationCenterReferral) {
    lines.push('⚠ Go to Navigation Center first (527 S Cannon St, 509-755-2489)');
  }
  if (s.requiresSober) lines.push('⚠ Clean & sober required');
  lines.push('Data from Spokane Business Association Shelter Map');
  return lines.join('\n');
}

// ── Shelter row ───────────────────────────────────────────────────────────

function ShelterRow({
  shelter,
  isSelected,
  onClick,
  distanceMi,
}: {
  shelter: ShelterEntry;
  isSelected: boolean;
  onClick: () => void;
  distanceMi?: number | null;
}) {
  const accentColor  = getStatusAccentColor(shelter);
  const isConfidential = shelter.lat == null;
  const isInclement  = shelter.status === 'inclement-only' || shelter.barrierLevel === 'inclement-only';

  return (
    <button
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="shelter-row"
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 76,
        background: isSelected ? '#E6F9FB' : 'white',
        border: 'none',
        borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer',
        padding: 0,
        opacity: isInclement ? 0.82 : 1,
        transition: 'background 120ms ease',
        fontFamily: 'inherit',
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: 4,
          flexShrink: 0,
          background: isSelected ? '#00B4C8' : accentColor,
          borderRadius: '0 2px 2px 0',
          opacity: isSelected ? 1 : 0.5,
          transition: 'background 120ms ease, opacity 120ms ease',
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '9px 10px',
          minWidth: 0,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            flexShrink: 0,
            background: isInclement ? 'white' : accentColor,
            border: isInclement ? `2px dashed ${accentColor}` : '1.5px solid rgba(0,0,0,0.1)',
            marginTop: 2,
          }}
        />

        {/* Name + meta + pills */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: isSelected ? 700 : 600,
              color: '#111827',
              lineHeight: 1.35,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontStyle: isInclement ? 'italic' : 'normal',
            }}
          >
            {shelter.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#6b7280',
              marginTop: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shelter.operator}
            {distanceMi != null && (
              <span style={{ marginLeft: 5, color: '#9ca3af' }}>
                · {distanceMi < 0.1 ? '< 0.1' : distanceMi.toFixed(1)} mi
              </span>
            )}
          </div>
          {shelter.populationServed.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
              {shelter.populationServed.slice(0, 3).map((p) => {
                const c = PILL[p] ?? { bg: '#f3f4f6', text: '#374151' };
                return (
                  <span
                    key={p}
                    style={{
                      background: c.bg, color: c.text,
                      borderRadius: 3, padding: '1px 5px',
                      fontSize: 10, fontWeight: 500, lineHeight: 1.4,
                    }}
                  >
                    {p}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: badge / lock */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {isConfidential ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: 'block', marginBottom: 2 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' }}>Confidential</span>
            </>
          ) : (
            <AvailBadge shelter={shelter} />
          )}
        </div>
      </div>
    </button>
  );
}

// ── Confidential detail panel ─────────────────────────────────────────────

function DetailPanel({ shelter, onBack }: { shelter: ShelterEntry; onBack: () => void }) {
  const [copied, setCopied] = useState(false);

  const barrierColor =
    shelter.barrierLevel === 'high'
      ? { bg: '#fffbeb', text: '#92400e', border: '#d97706', label: 'High barrier — clean & sober required' }
      : shelter.barrierLevel === 'inclement-only'
      ? { bg: '#eff6ff', text: '#1d4ed8', border: '#3b82f6', label: 'Inclement weather only' }
      : { bg: '#f0fdf4', text: '#14532d', border: '#16a34a', label: 'Low barrier' };

  function handleCopy() {
    navigator.clipboard
      .writeText(buildCopyText(shelter))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Back bar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 18, color: '#00B4C8', lineHeight: 1 }}
        >
          &#8592;
        </button>
        <span
          style={{
            fontSize: 13, fontWeight: 600, color: '#1a1a1a', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {shelter.name}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: '1px solid #00B4C8',
            color: copied ? '#15803d' : '#00B4C8',
            fontSize: 11,
            padding: '3px 9px',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            transition: 'color 150ms',
          }}
        >
          {copied ? '✓ Copied!' : '🔗 Copy info'}
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#1e40af', fontWeight: 500 }}>
          Location is confidential — call for address
        </div>

        <div style={{ marginBottom: 14 }}>
          <span style={{ display: 'inline-block', borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 500, border: `1px solid ${barrierColor.border}`, background: barrierColor.bg, color: barrierColor.text }}>
            {barrierColor.label}
          </span>
        </div>

        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>{shelter.operator}</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Population Served</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {shelter.populationServed.map((p) => {
              const c = PILL[p] ?? { bg: '#f3f4f6', text: '#374151' };
              return <span key={p} style={{ background: c.bg, color: c.text, borderRadius: 9999, padding: '3px 8px', fontSize: 12, fontWeight: 500 }}>{p}</span>;
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Age Range</div>
          <div style={{ fontSize: 13, color: '#374151' }}>{shelter.ageRange}</div>
        </div>

        {shelter.hoursOpen && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Hours</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{shelter.hoursOpen}</div>
            {shelter.checkInWindow && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{shelter.checkInWindow}</div>}
          </div>
        )}

        {shelter.phone && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Phone</div>
            <a href={`tel:${shelter.phone}`} style={{ fontSize: 16, fontWeight: 600, color: '#00B4C8', textDecoration: 'none' }}>{shelter.phone}</a>
          </div>
        )}

        {shelter.email && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Email</div>
            <a href={`mailto:${shelter.email}`} style={{ fontSize: 13, color: '#00B4C8', textDecoration: 'none', wordBreak: 'break-all' }}>{shelter.email}</a>
          </div>
        )}

        {shelter.website && (
          <div style={{ marginBottom: 14 }}>
            <a href={shelter.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#00B4C8', textDecoration: 'none', fontWeight: 500 }}>Website ↗</a>
          </div>
        )}

        {shelter.totalBeds && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Capacity</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{shelter.totalBeds} beds</div>
          </div>
        )}

        {shelter.services.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Services</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
              {shelter.services.map((svc) => <li key={svc} style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}>{svc}</li>)}
            </ul>
          </div>
        )}

        {shelter.notes && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', lineHeight: 1.5 }}>{shelter.notes}</div>
          </div>
        )}

        {shelter.petsAllowed === true && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#15803d', fontWeight: 500 }}>✓ Pets welcome</div>
        )}
      </div>
    </div>
  );
}

// ── SBA advocacy footer ───────────────────────────────────────────────────

function SbaFooter() {
  return (
    <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px 14px', flexShrink: 0, background: 'white' }}>
      <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, margin: '0 0 8px' }}>
        This resource is provided by the{' '}
        <a href="https://spokanebusinessassociation.com" target="_blank" rel="noopener noreferrer"
          style={{ color: '#00B4C8', fontWeight: 500 }}>
          Spokane Business Association
        </a>{' '}
        as part of our commitment to making Spokane the City of Choice — safe, clean, and supportive for all.
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <a href="https://spokanebusinessassociation.com/current-issues/" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: '#00B4C8', textDecoration: 'none' }}>
          → SBA&rsquo;s Homelessness Policy Positions
        </a>
        <a href="https://business.spokanebusinessassociation.com/join" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: '#00B4C8', textDecoration: 'none' }}>
          → Join SBA
        </a>
      </div>
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────

export type SidebarProps = {
  shelters: ShelterEntry[];
  selectedShelterId: string | null;
  onSelect: (id: string) => void;
  onUserLocation?: (lat: number, lng: number) => void;
  availabilityLastUpdated?: string | null;
  compact?: boolean;
};

export default function Sidebar({
  shelters,
  selectedShelterId,
  onSelect,
  onUserLocation,
  availabilityLastUpdated,
  compact,
}: SidebarProps) {
  const [detailShelter, setDetailShelter]       = useState<ShelterEntry | null>(null);
  const [inclementExpanded, setInclementExpanded] = useState(false);

  // Sort-by-distance state
  const [userLoc, setUserLoc]           = useState<{ lat: number; lng: number } | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [locLoading, setLocLoading]     = useState(false);
  const [locErrMsg, setLocErrMsg]       = useState<string | null>(null);

  function handleSortByDistance() {
    if (userLoc) {
      setUserLoc(null);
      setLocationCity(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      showError('Geolocation is not supported by this browser.');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setUserLoc({ lat, lng });
        setLocLoading(false);
        onUserLocation?.(lat, lng);
        // Reverse-geocode to get city name (best-effort)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((r) => r.json())
          .then((d) => {
            const city = d?.address?.city || d?.address?.town || d?.address?.village || '';
            const st   = d?.address?.state_code || '';
            if (city) setLocationCity(`${city}${st ? ', ' + st : ''}`);
          })
          .catch(() => {});
      },
      () => {
        setLocLoading(false);
        showError('Location access denied — shelters shown in default order.');
      },
      { timeout: 8000 },
    );
  }

  function showError(msg: string) {
    setLocErrMsg(msg);
    setTimeout(() => setLocErrMsg(null), 3000);
  }

  // Sorted shelter list
  const regularList = useMemo(() => {
    const base = sortShelters(
      shelters.filter((s) => s.status !== 'inclement-only' && s.barrierLevel !== 'inclement-only'),
    );
    if (!userLoc) return base;
    return [...base].sort((a, b) => {
      if (a.lat == null || a.lng == null) return 1;
      if (b.lat == null || b.lng == null) return -1;
      return (
        haversine(userLoc.lat, userLoc.lng, a.lat, a.lng) -
        haversine(userLoc.lat, userLoc.lng, b.lat, b.lng)
      );
    });
  }, [shelters, userLoc]);

  const inclementList = shelters.filter(
    (s) => s.status === 'inclement-only' || s.barrierLevel === 'inclement-only',
  );

  function handleRowClick(shelter: ShelterEntry) {
    if (shelter.lat == null) {
      setDetailShelter(shelter);
    } else {
      onSelect(shelter.id);
    }
  }

  const outerStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
    background: 'white',
    borderRight: compact ? 'none' : '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'inherit',
  };

  if (detailShelter) {
    return (
      <div style={outerStyle}>
        <DetailPanel shelter={detailShelter} onBack={() => setDetailShelter(null)} />
      </div>
    );
  }

  return (
    <div style={outerStyle}>
      {/* Stats bar with capacity gauge (desktop non-compact only) */}
      {!compact && (
        <StatsBar
          shelters={shelters}
          availabilityLastUpdated={availabilityLastUpdated}
        />
      )}

      {/* Weather banner */}
      <WeatherBanner onShowInclement={() => setInclementExpanded(true)} />

      {/* "What to do" quick-reference */}
      <WhatToDoPanel />

      {/* Sort-by-distance toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '7px 12px',
          borderBottom: '1px solid #f1f5f9',
          background: 'white',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleSortByDistance}
          disabled={locLoading}
          style={{
            background: userLoc ? '#E6F9FB' : 'white',
            border: `1px solid ${userLoc ? '#00B4C8' : '#e2e8f0'}`,
            color: userLoc ? '#00B4C8' : '#374151',
            fontSize: 11,
            fontWeight: userLoc ? 600 : 400,
            padding: '4px 12px',
            borderRadius: 20,
            cursor: locLoading ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            transition: 'all 150ms ease',
          }}
        >
          {locLoading
            ? '📍 Finding location…'
            : userLoc
            ? `📍 Sorted by distance${locationCity ? ' · ' + locationCity : ''} ✕`
            : '📍 Sort by distance'}
        </button>
      </div>

      {/* Location-denied toast */}
      {locErrMsg && (
        <div
          className="location-toast"
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            color: 'white',
            fontSize: 12,
            padding: '8px 16px',
            borderRadius: 6,
            zIndex: 1000,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          {locErrMsg}
        </div>
      )}

      {/* Shelter list */}
      <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {regularList.map((s) => {
            const distMi =
              userLoc && s.lat != null && s.lng != null
                ? haversine(userLoc.lat, userLoc.lng, s.lat, s.lng)
                : null;
            return (
              <ShelterRow
                key={s.id}
                shelter={s}
                isSelected={selectedShelterId === s.id}
                onClick={() => handleRowClick(s)}
                distanceMi={distMi}
              />
            );
          })}

          {regularList.length === 0 && inclementList.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              No shelters match this filter.
            </div>
          )}

          {/* Inclement weather section — collapsible */}
          {inclementList.length > 0 && (
            <div>
              <button
                onClick={() => setInclementExpanded((v) => !v)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#f8fafc',
                  border: 'none',
                  borderTop: '1px solid #e2e8f0',
                  borderBottom: inclementExpanded ? '1px solid #e2e8f0' : 'none',
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px dashed #2563eb', background: 'white', flexShrink: 0 }} />
                Inclement Weather Shelters ({inclementList.length})
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 400 }}>
                  {inclementExpanded ? '▲' : '▼'}
                </span>
              </button>
              {inclementExpanded &&
                inclementList.map((s) => (
                  <ShelterRow
                    key={s.id}
                    shelter={s}
                    isSelected={selectedShelterId === s.id}
                    onClick={() => handleRowClick(s)}
                  />
                ))}
            </div>
          )}
        </div>

        {/* SBA advocacy footer — always visible at bottom of list */}
        <SbaFooter />
      </div>
    </div>
  );
}
