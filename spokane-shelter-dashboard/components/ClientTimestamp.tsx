'use client';

import { useEffect, useState } from 'react';

export default function ClientTimestamp({
  isoString,
  fallback = 'Unknown',
}: {
  isoString: string | null | undefined;
  fallback?: string;
}) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    if (!isoString) return;
    setFormatted(
      new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    );
  }, [isoString]);

  if (!formatted) return <span>{fallback}</span>;
  return <span>{formatted}</span>;
}
