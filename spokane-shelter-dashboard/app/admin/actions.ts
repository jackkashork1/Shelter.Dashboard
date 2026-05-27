'use server';

import fs from 'fs';
import path from 'path';

export type AvailabilityRow = {
  status: 'unknown' | 'open' | 'full' | 'inclement-only';
  bedsAvailable: number | null;
};

export type AvailabilityFile = {
  lastUpdated: string;
  shelters: Record<string, AvailabilityRow>;
};

/** Called from the admin login form — password never leaves the server. */
export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

/** Writes updated availability data to /public/availability.json. */
export async function saveAvailability(
  data: AvailabilityFile,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'availability.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
