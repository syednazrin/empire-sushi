import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

type Store = { name: string; address: string; lat: number; lng: number; brand: string };
type EnrichedStore = Store & { state?: string; stateName?: string; district?: string; inMall?: boolean };

function pointInRing([lng, lat]: number[], ring: number[][]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInMultiPolygon(lng: number, lat: number, coordinates: number[][][][]): boolean {
  for (const polygon of coordinates) {
    const outer = polygon[0];
    if (!outer || outer.length < 3) continue;
    if (!pointInRing([lng, lat], outer)) continue;
    let inHole = false;
    for (let i = 1; i < polygon.length; i++) {
      if (pointInRing([lng, lat], polygon[i])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

const STATE_CODE_TO_NAME: Record<string, string> = {
  JHR: 'Johor', KDH: 'Kedah', KTN: 'Kelantan', MLK: 'Melaka', NSN: 'Negeri Sembilan',
  PHG: 'Pahang', PRK: 'Perak', PLS: 'Perlis', PNG: 'Pulau Pinang', SBH: 'Sabah', SWK: 'Sarawak',
  SGR: 'Selangor', TRG: 'Terengganu', KUL: 'Kuala Lumpur', LBN: 'Labuan', PJY: 'Putrajaya',
};

async function loadStores(): Promise<Store[]> {
  const jsonPath = path.join(process.cwd(), 'public', 'data', 'stores.json');
  console.log('Attempting to read stores from:', jsonPath);
  
  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  const stores: Store[] = JSON.parse(fileContent);
  console.log('Successfully loaded stores:', stores.length);
  return stores;
}

export async function GET() {
  try {
    const stores = await loadStores();
    const bordersPath = path.join(process.cwd(), 'public', 'State and District Border', 'malaysia.district-jakim.geojson');
    
    console.log('Attempting to read borders from:', bordersPath);
    
    let geojson;
    try {
      const bordersContent = fs.readFileSync(bordersPath, 'utf-8');
      geojson = JSON.parse(bordersContent);
    } catch (err) {
      console.warn('Borders file not found, returning unenriched data:', err);
      return NextResponse.json(stores.map((s) => ({ ...s, state: undefined, stateName: undefined, district: undefined })));
    }
  const features = geojson.features || [];
  let mallMap: Record<string, boolean> = {};
  try {
    const mallPath = path.join(process.cwd(), 'public', 'data', 'store-mall.json');
    mallMap = JSON.parse(fs.readFileSync(mallPath, 'utf-8'));
  } catch {
    // store-mall.json optional; run scripts/classify-stores-mall.js to generate
  }

  const enriched: EnrichedStore[] = stores.map((store) => {
    let state: string | undefined;
    let stateName: string | undefined;
    let district: string | undefined;
    for (const f of features) {
      const geom = f.geometry;
      const props = f.properties || {};
      if (geom?.type === 'MultiPolygon' && geom.coordinates) {
        if (pointInMultiPolygon(store.lng, store.lat, geom.coordinates)) {
          state = props.state;
          stateName = STATE_CODE_TO_NAME[props.state] || props.state;
          district = props.name;
          break;
        }
      }
    }
    const key = `${store.lng},${store.lat},${store.brand}`;
    const inMall = mallMap[key] ?? undefined;
    return { ...store, state, stateName, district, inMall };
  });
  console.log('Enriched stores:', enriched.length);
  return NextResponse.json(enriched);
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Failed to load enriched stores', 
      details: errorMessage,
      cwd: process.cwd()
    }, { status: 500 });
  }
}
