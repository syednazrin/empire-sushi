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

function getStoreDataFolder(): string {
  const cwd = process.cwd();
  // In Vercel, the working directory structure is different
  const candidates = [
    path.join(cwd, 'public', 'Store Location Data'),
    path.join(cwd, '.next', 'server', 'app', 'api', 'stores-enriched', 'public', 'Store Location Data'),
    path.join(cwd, 'my-app', 'public', 'Store Location Data'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      console.log('Using store data folder:', dir);
      return dir;
    }
  }
  console.warn('Store data folder not found, using default');
  return path.join(cwd, 'public', 'Store Location Data');
}

async function loadStores(): Promise<Store[]> {
  const folder = getStoreDataFolder();
  const stores: Store[] = [];

  console.log('Reading stores from:', folder);

  for (const filename of Object.keys(BRAND_FROM_FILENAME)) {
    const filepath = path.join(folder, filename);
    if (!fs.existsSync(filepath)) {
      console.warn('File not found:', filepath);
      continue;
    }
    try {
      const fileBuffer = fs.readFileSync(filepath);
      const wb = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as (string | number)[][];
      if (rows.length < 2) continue;
      const headers = (rows[0] as string[]).map((h) => (h != null ? String(h).trim().toLowerCase() : ''));
      const nameIdx = headers.findIndex((h) => h === 'name' || h === 'store' || h === 'store name');
      const addressIdx = headers.findIndex((h) => h === 'address' || h === 'location');
      const coordIdx = headers.findIndex((h) => h === 'coordinates' || h === 'coordinate' || h === 'coord');
      const latIdx = headers.findIndex((h) => h === 'lat' || h === 'latitude');
      const lngIdx = headers.findIndex((h) => h === 'lng' || h === 'lon' || h === 'longitude');
      const brand = BRAND_FROM_FILENAME[filename];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as (string | number)[];
        let lat: number;
        let lng: number;

        if (latIdx >= 0 && lngIdx >= 0) {
          lat = parseFloat(String(row[latIdx] ?? '').trim());
          lng = parseFloat(String(row[lngIdx] ?? '').trim());
        } else {
          const coordRaw = coordIdx >= 0 ? String(row[coordIdx] ?? '').trim() : '';
          if (!coordRaw) continue;
          const parts = coordRaw.split(/[,\s]+/).filter(Boolean);
          if (parts.length < 2) continue;
          const a = parseFloat(parts[0]);
          const b = parseFloat(parts[1]);
          if (Number.isNaN(a) || Number.isNaN(b)) continue;
          if (a >= 99 && a <= 120 && b >= 0.5 && b <= 8) {
            lng = a;
            lat = b;
          } else {
            lat = a;
            lng = b;
          }
        }

        if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

        const name = nameIdx >= 0 ? String(row[nameIdx] ?? '').trim() : '';
        const address = addressIdx >= 0 ? String(row[addressIdx] ?? '').trim() : '';
        stores.push({ name: name || 'Store', address, lat, lng, brand });
      }
    } catch (e) {
      console.error('Error reading', filename, e);
    }
  }
  console.log('Total stores loaded:', stores.length);
  return stores;
}

export async function GET() {
  try {
    const stores = await loadStores();
    const bordersPath = path.join(process.cwd(), 'public', 'State and District Border', 'malaysia.district-jakim.geojson');
    
    console.log('Borders path:', bordersPath);
    console.log('Borders file exists:', fs.existsSync(bordersPath));
    
    if (!fs.existsSync(bordersPath)) {
      console.warn('Borders file not found, returning unenriched data');
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
  console.log('Enriched stores:', enriched.length);
  return NextResponse.json(enriched);
} catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to load enriched stores', details: String(error) }, { status: 500 });
  }
}
