import type { ShelterEntry } from './shelters';

export type FilterType =
  | 'all'
  | 'men'
  | 'women'
  | 'youth'
  | 'young-adults'
  | 'families'
  | 'lgbtq'
  | 'dv'
  | 'low-barrier'
  | 'high-barrier';

export const FILTER_PILLS: { value: FilterType; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'men',         label: 'Men' },
  { value: 'women',       label: 'Women' },
  { value: 'youth',       label: 'Youth (13–17)' },
  { value: 'young-adults',label: 'Young Adults (18–24)' },
  { value: 'families',    label: 'Families' },
  { value: 'lgbtq',       label: 'LGBTQIA+' },
  { value: 'dv',          label: 'DV Crisis' },
  { value: 'low-barrier', label: 'Low Barrier' },
  { value: 'high-barrier',label: 'High Barrier' },
];

export function matchesFilter(shelter: ShelterEntry, filter: FilterType): boolean {
  const p = shelter.populationServed;
  switch (filter) {
    case 'all':
      return true;
    case 'men':
      return p.includes('Adult men');
    case 'women':
      return (
        p.includes('Adult women') ||
        p.includes('Women with children') ||
        p.includes('Domestic violence survivors')
      );
    case 'youth':
      return p.includes('Youth');
    case 'young-adults':
      // Match shelters explicitly for 18–24 age range
      return shelter.ageRange.includes('18–24') || shelter.ageRange.includes('18-24');
    case 'families':
      return (
        p.includes('Families') ||
        p.includes('Women with children') ||
        p.includes('Pregnant individuals')
      );
    case 'lgbtq':
      return p.includes('LGBTQIA+');
    case 'dv':
      return p.includes('Domestic violence survivors');
    case 'low-barrier':
      return shelter.barrierLevel === 'low';
    case 'high-barrier':
      return shelter.barrierLevel === 'high';
    default:
      return true;
  }
}

export function getMarkerColor(shelter: ShelterEntry): { color: string; isDashed: boolean } {
  if (shelter.barrierLevel === 'inclement-only' || shelter.status === 'inclement-only') {
    return { color: '#2563eb', isDashed: true };
  }
  if (shelter.status === 'full' || shelter.bedsAvailable === 0) {
    return { color: '#dc2626', isDashed: false };
  }
  if (shelter.bedsAvailable !== null && shelter.bedsAvailable > 0) {
    if (shelter.totalBeds !== null && shelter.bedsAvailable / shelter.totalBeds < 0.2) {
      return { color: '#d97706', isDashed: false };
    }
    return { color: '#16a34a', isDashed: false };
  }
  if (shelter.status === 'open') {
    return { color: '#16a34a', isDashed: false };
  }
  return { color: '#9ca3af', isDashed: false };
}

export function getStatusAccentColor(shelter: ShelterEntry): string {
  const { color } = getMarkerColor(shelter);
  return color;
}

function sortPriority(s: ShelterEntry): number {
  if (s.status === 'inclement-only' || s.barrierLevel === 'inclement-only') return 30;
  if (s.status === 'full' || s.bedsAvailable === 0) return 20;
  if (s.bedsAvailable !== null && s.bedsAvailable > 0) return 0;
  if (s.status === 'open') return 1;
  return 10; // unknown
}

export function sortShelters(list: ShelterEntry[]): ShelterEntry[] {
  return [...list].sort((a, b) => {
    const pa = sortPriority(a);
    const pb = sortPriority(b);
    if (pa !== pb) return pa - pb;
    // Within "available" group: most beds remaining first
    if (pa === 0 && pb === 0) {
      return (b.bedsAvailable ?? 0) - (a.bedsAvailable ?? 0);
    }
    return 0;
  });
}
