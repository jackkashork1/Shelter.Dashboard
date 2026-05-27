/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  async headers() {
    return [
      // ── Allow all origins to embed the dashboard in an iframe ──────────
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'X-Frame-Options',         value: 'ALLOWALL' },
        ],
      },
      // ── Serve map.html with correct type and same-origin framing ───────
      // (map.html is loaded as a same-origin iframe by MapView.tsx)
      {
        source: '/map.html',
        headers: [
          { key: 'Content-Type',    value: 'text/html' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
