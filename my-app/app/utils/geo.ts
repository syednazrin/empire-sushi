/**
 * Haversine distance in km between two [lng, lat] points.
 */
export function haversineKm(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Store with coordinates.
 */
export type StoreWithCoord = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  brand: string;
  state?: string;
  stateName?: string;
  district?: string;
};

const COMPETITIVE_RADIUS_KM = 1;

/**
 * Count of store locations that have at least one competitor within COMPETITIVE_RADIUS_KM.
 * Returns also the list of those store coords for drawing conflict zones.
 */
export function competitiveAreas(
  stores: StoreWithCoord[]
): { count: number; conflictCoords: { lng: number; lat: number }[] } {
  const conflictCoords: { lng: number; lat: number }[] = [];
  for (const store of stores) {
    const hasCompetitor = stores.some(
      (other) =>
        other.brand !== store.brand &&
        haversineKm(
          { lng: store.lng, lat: store.lat },
          { lng: other.lng, lat: other.lat }
        ) <= COMPETITIVE_RADIUS_KM
    );
    if (hasCompetitor) conflictCoords.push({ lng: store.lng, lat: store.lat });
  }
  return { count: conflictCoords.length, conflictCoords };
}

/**
 * For each store, count competitors within 1km. Return top N most contested.
 */
export function topContestedStores(
  stores: StoreWithCoord[],
  n: number
): { store: StoreWithCoord; competitorCount: number }[] {
  const contested = stores.map((store) => {
    const competitorCount = stores.filter(
      (other) =>
        other.brand !== store.brand &&
        haversineKm(
          { lng: store.lng, lat: store.lat },
          { lng: other.lng, lat: other.lat }
        ) <= COMPETITIVE_RADIUS_KM
    ).length;
    return { store, competitorCount };
  });
  return contested
    .filter((x) => x.competitorCount > 0)
    .sort((a, b) => b.competitorCount - a.competitorCount)
    .slice(0, n);
}

/** Tier 1 / urban districts (simplified: major cities and key districts). */
const TIER1_DISTRICTS = new Set([
  'kuala lumpur',
  'petaling',
  'george town',
  'johor bahru',
  'ipoh',
  'kota kinabalu',
  'kuching',
  'shah alam',
  'klang',
  'kajang',
  'subang jaya',
  'putrajaya',
]);

export function isTier1District(district?: string): boolean {
  if (!district) return false;
  return TIER1_DISTRICTS.has(district.toLowerCase().trim());
}

/**
 * Approximate circle polygon around [lng, lat] with radius in km.
 * Returns GeoJSON coordinates for the polygon (first and last point same).
 */
export function circlePolygon(
  lng: number,
  lat: number,
  radiusKm: number,
  steps = 32
): number[][] {
  const coords: number[][] = [];
  const latDegPerKm = 1 / 110.574;
  const lngDegPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    coords.push([
      lng + (radiusKm * lngDegPerKm) * Math.cos(angle),
      lat + (radiusKm * latDegPerKm) * Math.sin(angle),
    ]);
  }
  return coords;
}
