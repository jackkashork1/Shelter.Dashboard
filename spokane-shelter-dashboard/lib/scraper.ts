import type { ShelterEntry } from "./shelters";

export type ScraperResult = {
  id: string;
  bedsAvailable: number | null;
  status: ShelterEntry["status"];
  lastUpdated: string;
};

/**
 * Stub: fetch live bed availability for a single shelter.
 * Replace with real scraping logic per source when available.
 */
export async function scrapeShelter(id: string): Promise<ScraperResult | null> {
  void id;
  return null;
}

/**
 * Stub: fetch live bed availability for all shelters.
 */
export async function scrapeAll(): Promise<ScraperResult[]> {
  return [];
}
