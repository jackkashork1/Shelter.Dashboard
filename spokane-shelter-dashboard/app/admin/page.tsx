'use client';

import { useState, useEffect } from 'react';
import { shelters } from '@/lib/shelters';
import { verifyPassword, saveAvailability } from './actions';
import type { AvailabilityRow } from './actions';

const SESSION_KEY = 'shelter_admin_auth';

type RowState = {
  status: AvailabilityRow['status'];
  bedsAvailable: string; // string so the input can be empty (= null on save)
};

/** Build initial row state from the static shelter list. */
function initRows(): Record<string, RowState> {
  return Object.fromEntries(
    shelters.map((s) => [
      s.id,
      {
        status:
          s.barrierLevel === 'inclement-only'
            ? 'inclement-only'
            : s.status === 'open'
            ? 'open'
            : 'unknown',
        bedsAvailable: '',
      },
    ]),
  );
}

// ── Styled primitives (inline, no extra deps) ─────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 4,
  padding: '5px 8px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#111827',
  background: 'white',
  width: '100%',
  boxSizing: 'border-box',
};

export default function AdminPage() {
  // ── Auth state ───────────────────────────────────────────────────────────
  const [authed, setAuthed]         = useState(false);
  const [password, setPassword]     = useState('');
  const [authError, setAuthError]   = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────────
  const [rows, setRows]                   = useState<Record<string, RowState>>(initRows);
  const [saving, setSaving]               = useState(false);
  const [saveMsg, setSaveMsg]             = useState<{ ok: boolean; text: string } | null>(null);
  const [dataLastUpdated, setDataLastUpdated] = useState<string | null>(null);

  // ── Check sessionStorage on mount ────────────────────────────────────────
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') setAuthed(true);
    } catch {
      // sessionStorage unavailable (unlikely in a normal browser)
    }
  }, []);

  // ── Pre-populate form from existing availability.json ────────────────────
  useEffect(() => {
    if (!authed) return;
    fetch('/availability.json')
      .then((r) => r.json())
      .then((data: { lastUpdated?: string; shelters?: Record<string, AvailabilityRow> }) => {
        if (data.lastUpdated) setDataLastUpdated(data.lastUpdated);
        if (data.shelters) {
          setRows((prev) => {
            const next = { ...prev };
            for (const [id, val] of Object.entries(data.shelters!)) {
              if (next[id]) {
                next[id] = {
                  status: val.status ?? 'unknown',
                  bedsAvailable: val.bedsAvailable != null ? String(val.bedsAvailable) : '',
                };
              }
            }
            return next;
          });
        }
      })
      .catch(() => {});
  }, [authed]);

  // ── Password submit ───────────────────────────────────────────────────────
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const ok = await verifyPassword(password);
    setAuthLoading(false);
    if (ok) {
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* ignore */ }
      setAuthed(true);
    } else {
      setAuthError('Incorrect password.');
      setPassword('');
    }
  }

  function handleLogout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setAuthed(false);
    setPassword('');
  }

  // ── Row update helpers ───────────────────────────────────────────────────
  function setStatus(id: string, status: AvailabilityRow['status']) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
  }
  function setBeds(id: string, value: string) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], bedsAvailable: value } }));
  }

  // ── Save all ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    const now = new Date().toISOString();
    const shelterData: Record<string, AvailabilityRow> = {};
    for (const [id, row] of Object.entries(rows)) {
      const beds = row.bedsAvailable.trim();
      shelterData[id] = {
        status: row.status,
        bedsAvailable: beds !== '' && !isNaN(Number(beds)) ? parseInt(beds, 10) : null,
      };
    }
    const result = await saveAvailability({ lastUpdated: now, shelters: shelterData });
    setSaving(false);
    if (result.ok) {
      setDataLastUpdated(now);
      setSaveMsg({ ok: true, text: '✓ Saved successfully!' });
    } else {
      setSaveMsg({ ok: false, text: `✗ Error: ${result.error ?? 'Unknown error'}` });
    }
    setTimeout(() => setSaveMsg(null), 5000);
  }

  // ── Password gate ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif",
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            padding: '36px 40px',
            width: '100%',
            maxWidth: 380,
          }}
        >
          {/* Logo / title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://growthzonecmsprodeastus.azureedge.net/sites/2593/2022/04/Spokane-Business-Association-300x161.png"
              alt="SBA"
              style={{ height: 48, marginBottom: 12 }}
            />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Shelter Dashboard Admin
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              Staff access only
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              style={{
                ...INPUT_BASE,
                marginBottom: 12,
                fontSize: 14,
                padding: '8px 12px',
              }}
              placeholder="Enter admin password"
            />
            {authError && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={authLoading || !password}
              style={{
                width: '100%',
                background: '#00B4C8',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '10px 0',
                fontSize: 14,
                fontWeight: 600,
                cursor: authLoading || !password ? 'not-allowed' : 'pointer',
                opacity: authLoading || !password ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {authLoading ? 'Checking…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin form ────────────────────────────────────────────────────────────
  const regularShelters   = shelters.filter((s) => s.barrierLevel !== 'inclement-only');
  const inclementShelters = shelters.filter((s) => s.barrierLevel === 'inclement-only');

  const lastUpdatedDisplay = dataLastUpdated
    ? new Date(dataLastUpdated).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
    : 'Never';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif",
      }}
    >
      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'white',
          borderBottom: '3px solid #00B4C8',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
            Shelter Availability Admin
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
            Last saved: {lastUpdatedDisplay}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveMsg && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: saveMsg.ok ? '#15803d' : '#dc2626',
                whiteSpace: 'nowrap',
              }}
            >
              {saveMsg.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#00B4C8',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {saving ? 'Saving…' : 'Save all'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '7px 14px',
              fontSize: 12,
              color: '#6b7280',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* ── Instructions banner ──────────────────────────────────────── */}
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            padding: '14px 18px',
            marginBottom: 24,
            fontSize: 13,
            color: '#1e40af',
            lineHeight: 1.6,
          }}
        >
          <strong>📋 Daily update instructions:</strong> Update these figures from{' '}
          <a
            href="https://ShelterMeSpokane.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1d4ed8', fontWeight: 600 }}
          >
            ShelterMeSpokane.org
          </a>
          {' '}— takes about 5 minutes. Data resets to unknown if not updated within 24 hours.
          Click <strong>Save all</strong> when done.
        </div>

        {/* ── Regular shelters ─────────────────────────────────────────── */}
        <ShelterTable
          title="Regular Shelters"
          items={regularShelters}
          rows={rows}
          onStatus={setStatus}
          onBeds={setBeds}
        />

        {/* ── Inclement weather shelters ───────────────────────────────── */}
        <ShelterTable
          title="Inclement Weather Shelters"
          items={inclementShelters}
          rows={rows}
          onStatus={setStatus}
          onBeds={setBeds}
          isInclement
        />

        {/* ── Bottom Save button ────────────────────────────────────────── */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
          {saveMsg && (
            <span style={{ fontSize: 13, fontWeight: 600, color: saveMsg.ok ? '#15803d' : '#dc2626' }}>
              {saveMsg.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#00B4C8',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '10px 28px',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ShelterTable sub-component ────────────────────────────────────────────

import type { ShelterEntry } from '@/lib/shelters';

function ShelterTable({
  title,
  items,
  rows,
  onStatus,
  onBeds,
  isInclement = false,
}: {
  title: string;
  items: ShelterEntry[];
  rows: Record<string, RowState>;
  onStatus: (id: string, s: AvailabilityRow['status']) => void;
  onBeds: (id: string, v: string) => void;
  isInclement?: boolean;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: isInclement ? '#1d4ed8' : '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: 8,
          paddingLeft: 2,
        }}
      >
        {isInclement ? '🌧 ' : ''}{title}
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 100px',
            gap: 12,
            padding: '8px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <span>Shelter</span>
          <span>Status</span>
          <span>Beds available</span>
        </div>

        {/* Rows */}
        {items.map((s, idx) => {
          const row = rows[s.id] ?? { status: 'unknown', bedsAvailable: '' };
          return (
            <div
              key={s.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 100px',
                gap: 12,
                padding: '10px 16px',
                borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                alignItems: 'center',
              }}
            >
              {/* Shelter name */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  {s.operator}
                </div>
              </div>

              {/* Status dropdown */}
              <select
                value={row.status}
                onChange={(e) => onStatus(s.id, e.target.value as AvailabilityRow['status'])}
                style={{ ...INPUT_BASE }}
              >
                <option value="unknown">Unknown</option>
                <option value="open">Open</option>
                <option value="full">Full</option>
                <option value="inclement-only">Inclement only</option>
              </select>

              {/* Beds available */}
              <input
                type="number"
                min={0}
                value={row.bedsAvailable}
                onChange={(e) => onBeds(s.id, e.target.value)}
                placeholder="—"
                style={{
                  ...INPUT_BASE,
                  color: row.bedsAvailable === '' ? '#9ca3af' : '#111827',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
