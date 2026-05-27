/**
 * Geocodes shelter addresses via Nominatim (free, no API key required).
 * Respects the 1 req/sec rate limit with a 1100ms delay between requests.
 *
 * Usage:
 *   node scripts/geocode.mjs
 *
 * Output: JSON object mapping shelter id → { lat, lng }
 */

const shelters = [
  { id: 'house-of-charity',      address: '32 W Pacific Ave, Spokane, WA 99201' },
  { id: 'ugm-mens',              address: '1224 E Trent Ave, Spokane, WA 99202' },
  { id: 'ugm-crisis-women',      address: '1515 E Illinois Ave, Spokane, WA 99207' },
  { id: 'family-promise',        address: '2002 E Mission Ave, Spokane, WA 99202' },
  { id: 'crosswalk-youth',       address: '525 W 2nd Ave, Spokane, WA 99201' },
  { id: 'voa-young-adult',       address: '3104 E Augusta Ave, Spokane, WA 99207' },
  { id: 'cat-spokane',           address: '960 E 3rd Ave, Spokane, WA 99202' },
  { id: 'navigation-center',     address: '527 S Cannon St, Spokane, WA 99201' },
  { id: 'salvation-army-way-out',address: '55 W Mission Ave, Spokane, WA 99201' },
  { id: 'hoc-inclement',         address: '527 S Cannon St, Spokane, WA 99201' },
  { id: 'jewels-inclement-women',address: '3909 W Rowan Ave, Spokane, WA 99205' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(address) {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SpokaneBusinessAssociation-ShelterMap/1.0' },
  });
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

const results = {};

for (const shelter of shelters) {
  process.stdout.write(`Geocoding ${shelter.id}...`);
  try {
    const coords = await geocode(shelter.address);
    if (coords) {
      results[shelter.id] = coords;
      console.log(` ✓  lat: ${coords.lat}, lng: ${coords.lng}`);
    } else {
      console.log(' ✗  not found');
    }
  } catch (e) {
    console.log(` ✗  error: ${e.message}`);
  }
  await sleep(1100);
}

console.log('\n── Results ──────────────────────────────────────');
console.log(JSON.stringify(results, null, 2));
