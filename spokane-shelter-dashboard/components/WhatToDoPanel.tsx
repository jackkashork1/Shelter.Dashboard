'use client';

import { useState } from 'react';

const CARD: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderLeft: '3px solid #00B4C8',
  borderRadius: 6,
  padding: '10px 12px',
  marginBottom: 8,
};
const TITLE: React.CSSProperties = {
  fontSize: 13,
  color: '#1a1a1a',
  fontWeight: 600,
  marginBottom: 5,
  lineHeight: 1.3,
};
const BODY: React.CSSProperties = {
  fontSize: 12,
  color: '#4b5563',
  lineHeight: 1.6,
};
const LINK: React.CSSProperties = {
  color: '#00B4C8',
  fontWeight: 600,
  textDecoration: 'none',
};

function handlePrint() {
  window.print();
}

export default function WhatToDoPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*
        #print-guide — always in DOM but visually off-screen.
        @media print in globals.css makes ONLY this visible.
      */}
      <div id="print-guide">
        <div style={{ borderBottom: '3px solid #00B4C8', paddingBottom: 12, marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 4px', color: '#00B4C8' }}>
            When Someone Asks for Help
          </h2>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            Spokane Business Association Quick Reference ·{' '}
            spokanebusinessassociation.com
          </p>
        </div>

        {[
          {
            icon: '🏠',
            title: 'They need a bed tonight',
            body: 'Call 2-1-1 (Mon–Fri 8am–5pm) or go directly to the Navigation Center at 527 S Cannon St.\nThen use this map to find an open shelter and call ahead to confirm — availability changes hourly.',
          },
          {
            icon: '🧠',
            title: 'Mental health or substance crisis',
            body: 'Spokane Crisis Line: 877-266-1818 (24/7)\nMobile Crisis Team: call 911 and request a mental health response\nDo NOT leave someone alone if they appear to be in danger.',
          },
          {
            icon: '🆘',
            title: 'Fleeing domestic violence',
            body: 'YWCA 24-hr line: 509-326-2255\nText: 509-220-3725\nLocation is confidential — they will coordinate safe placement.',
          },
        ].map((c) => (
          <div
            key={c.title}
            style={{
              borderLeft: '3px solid #00B4C8',
              paddingLeft: 14,
              marginBottom: 18,
            }}
          >
            <strong style={{ fontSize: 14, display: 'block', marginBottom: 5 }}>
              {c.icon} {c.title}
            </strong>
            <p
              style={{
                fontSize: 13,
                color: '#374151',
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {c.body}
            </p>
          </div>
        ))}

        <p
          style={{
            fontSize: 11,
            color: '#9ca3af',
            marginTop: 28,
            borderTop: '1px solid #e2e8f0',
            paddingTop: 12,
          }}
        >
          Provided by the Spokane Business Association ·
          spokanebusinessassociation.com · Data: shelterme.spokane.org
        </p>
      </div>

      {/* ── Toggle header ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: open ? '#0099AA' : '#00B4C8',
          border: 'none',
          padding: '8px 14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 120ms ease',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>
          👋 When someone asks for help…
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* ── Expanded cards ────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            background: '#f5f7f8',
            padding: '10px 12px 8px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {/* Card 1 */}
          <div style={CARD}>
            <div style={TITLE}>🏠 They need a bed tonight</div>
            <div style={BODY}>
              <strong>Say:</strong> &ldquo;Call{' '}
              <a href="tel:211" style={LINK}>2-1-1</a> (Mon–Fri 8am–5pm) or go to the{' '}
              <strong>Navigation Center at 527 S Cannon St.</strong>&rdquo;
              <br />
              <strong>Then:</strong> Find an open shelter on this map and call ahead to confirm
              — availability changes hourly.
            </div>
          </div>

          {/* Card 2 */}
          <div style={CARD}>
            <div style={TITLE}>🧠 Mental health or substance crisis</div>
            <div style={BODY}>
              <strong>Call:</strong>{' '}
              <a href="tel:877-266-1818" style={LINK}>877-266-1818</a>{' '}
              — Spokane Crisis Line (24/7)
              <br />
              <strong>Or:</strong> Call 911 and request a{' '}
              <em>mental health response</em>
              <br />
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>Do not</span>{' '}
              leave someone alone if they appear to be in danger.
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ ...CARD, marginBottom: 4 }}>
            <div style={TITLE}>🆘 Fleeing domestic violence</div>
            <div style={BODY}>
              <strong>Call:</strong>{' '}
              <a href="tel:509-326-2255" style={LINK}>509-326-2255</a>{' '}
              — YWCA 24-hr line
              <br />
              <strong>Text:</strong>{' '}
              <a href="sms:509-220-3725" style={LINK}>509-220-3725</a>
              <br />
              Location is confidential — they will coordinate safe placement.
            </div>
          </div>

          <button
            onClick={handlePrint}
            style={{
              fontSize: 11,
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0 2px',
              fontFamily: 'inherit',
              textDecoration: 'underline',
            }}
          >
            🖨 Print this guide
          </button>
        </div>
      )}
    </>
  );
}
