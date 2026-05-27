'use client';

import { useEffect, useState } from 'react';

type WeatherState =
  | { status: 'idle' }
  | { status: 'severe'; temp: number }
  | { status: 'warning'; temp: number };

interface Props {
  onShowInclement: () => void;
}

export default function WeatherBanner({ onShowInclement }: Props) {
  const [weather, setWeather] = useState<WeatherState>({ status: 'idle' });

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast' +
        '?latitude=47.6588&longitude=-117.4260' +
        '&current=temperature_2m,weathercode' +
        '&temperature_unit=fahrenheit' +
        '&forecast_days=1',
    )
      .then((r) => r.json())
      .then((data) => {
        const temp: number = data?.current?.temperature_2m;
        if (typeof temp !== 'number') return;
        if (temp <= 35) setWeather({ status: 'severe', temp });
        else if (temp <= 45) setWeather({ status: 'warning', temp });
        // else: no banner
      })
      .catch(() => {/* silently ignore network errors */});
  }, []);

  if (weather.status === 'idle') return null;

  if (weather.status === 'severe') {
    return (
      <div
        style={{
          background: '#1e40af',
          color: 'white',
          padding: '10px 14px',
          fontSize: 12,
          lineHeight: 1.55,
          flexShrink: 0,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          ❄ Current temperature: {Math.round(weather.temp)}°F — Inclement weather
          shelters are likely ACTIVE.
        </div>
        <div style={{ opacity: 0.85, marginBottom: 8 }}>
          Call{' '}
          <a
            href="tel:509-755-2489"
            style={{ color: '#93c5fd', fontWeight: 600, textDecoration: 'none' }}
          >
            509-755-2489
          </a>{' '}
          to confirm activation status.
        </div>
        <button
          onClick={onShowInclement}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.35)',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Show inclement shelters ↓
        </button>
      </div>
    );
  }

  // warning: 36–45 °F
  return (
    <div
      style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        color: '#78350f',
        padding: '9px 14px',
        fontSize: 12,
        lineHeight: 1.55,
        flexShrink: 0,
      }}
    >
      🌡 Temperature is <strong>{Math.round(weather.temp)}°F</strong> — inclement
      weather shelters may activate soon. Monitor{' '}
      <a
        href="https://my.spokanecity.org/news/news/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#b45309', fontWeight: 500 }}
      >
        spokanecity.org
      </a>{' '}
      for activation notices.
    </div>
  );
}
