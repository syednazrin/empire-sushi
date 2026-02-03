import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const BRAND_FROM_FILENAME: Record<string, string> = {
  'Empire_Sushi_Cleaned.xlsx': 'Empire Sushi',
  'Family_Mart_Cleaned.xlsx': 'Family Mart',
  'Nippon_Sushi_Cleaned.xlsx': 'Nippon Sushi',
  'Sushi_Jiro_Cleaned.xlsx': 'Sushi Jiro',
  'Sushi_King_Cleaned.xlsx': 'Sushi King',
  'Sushi_Mentai_Cleaned.xlsx': 'Sushi Mentai',
  'Sushi_Plus_Cleaned.xlsx': 'Sushi Plus',
  'Sushi_Zanmai_Cleaned.xlsx': 'Sushi Zanmai',
};

type Store = { name: string; address: string; lat: number; lng: number; brand: string };
type EnrichedStore = Store & { state?: string; stateName?: string; district?: string };

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
  const folder = path.join(process.cwd(), 'public', 'Store Location Data');
  const stores: Store[] = [];

  for (const filename of Object.keys(BRAND_FROM_FILENAME)) {
    const filepath = path.join(folder, filename);
    if (!fs.existsSync(filepath)) continue;
    try {
      const wb = XLSX.readFile(filepath);
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as (string | number)[][];
      if (rows.length < 2) continue;
      const headers = (rows[0] as string[]).map((h) => (h != null ? String(h).trim().toLowerCase() : ''));
      const nameIdx = headers.findIndex((h) => h === 'name' || h === 'store');
      const addressIdx = headers.findIndex((h) => h === 'address');
      const coordIdx = headers.findIndex((h) => h === 'coordinates' || h === 'coordinate');
      const brand = BRAND_FROM_FILENAME[filename];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as (string | number)[];
        const coordRaw = coordIdx >= 0 ? String(row[coordIdx] ?? '').trim() : '';
        if (!coordRaw) continue;
        const [latStr, lngStr] = coordRaw.split(/[,\s]+/);
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
        const name = nameIdx >= 0 ? String(row[nameIdx] ?? '').trim() : '';
        const address = addressIdx >= 0 ? String(row[addressIdx] ?? '').trim() : '';
        stores.push({ name: name || 'Store', address, lat, lng, brand });
      }
    } catch (e) {
      console.warn('Error reading', filename, e);
    }
  }
  return stores;
}

export async function GET() {
  const stores = await loadStores();
  const bordersPath = path.join(process.cwd(), 'public', 'State and District Border', 'malaysia.district-jakim.geojson');
  if (!fs.existsSync(bordersPath)) {
    return NextResponse.json(stores.map((s) => ({ ...s, state: undefined, stateName: undefined, district: undefined })));
  }
  const geojson = JSON.parse(fs.readFileSync(bordersPath, 'utf-8'));
  const features = geojson.features || [];
  const enriched: EnrichedStore[] = stores.map((store) => {
    for (const f of features) {
      const geom = f.geometry;
      const props = f.properties || {};
      if (geom?.type === 'MultiPolygon' && geom.coordinates) {
        if (pointInMultiPolygon(store.lng, store.lat, geom.coordinates)) {
          return {
            ...store,
            state: props.state,
            stateName: STATE_CODE_TO_NAME[props.state] || props.state,
            district: props.name,
          };
        }
      }
    }
    return { ...store, state: undefined, stateName: undefined, district: undefined };
  });
  return NextResponse.json(enriched);
}
