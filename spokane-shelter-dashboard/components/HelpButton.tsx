'use client';

import { useState, useRef, useEffect } from 'react';

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        style={{
          background: '#00B4C8',
          border: 'none',
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          padding: '6px 14px',
          borderRadius: 4,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#0099AA';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#00B4C8';
        }}
      >
        Need Help?
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            width: 250,
            padding: '16px',
            zIndex: 9999,
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 14,
              color: '#1a1a1a',
            }}
          >
            Get Help Now
          </div>

          {/* 2-1-1 */}
          <div style={{ marginBottom: 13 }}>
            <div
              style={{
                fontSize: 10,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 3,
              }}
            >
              Information &amp; Referrals
            </div>
            <a
              href="tel:211"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#00B4C8',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Call 2-1-1
            </a>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Mon–Fri 8am–5pm (for referrals)
            </div>
          </div>

          {/* DV Crisis */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 12,
              marginBottom: 13,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 3,
              }}
            >
              DV Crisis Line — 24/7
            </div>
            <a
              href="tel:509-326-2255"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#dc2626',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              509-326-2255
            </a>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Tap to call — available 24/7
            </div>
          </div>

          {/* Text crisis */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 12,
              marginBottom: 13,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 3,
              }}
            >
              Text Crisis Line
            </div>
            <a
              href="sms:509-220-3725"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#00B4C8',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              509-220-3725
            </a>
          </div>

          {/* ShelterMe */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 3,
              }}
            >
              Live Bed Data
            </div>
            <a
              href="https://shelterme.spokane.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#00B4C8',
                textDecoration: 'none',
              }}
            >
              ShelterMeSpokane.org &#x2197;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
