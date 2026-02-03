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

export type StoreRow = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  brand: string;
};

function getStoreDataFolder(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'public', 'Store Location Data'),
    path.join(cwd, 'my-app', 'public', 'Store Location Data'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return path.join(cwd, 'public', 'Store Location Data');
}

export async function GET() {
  const folder = getStoreDataFolder();
  const stores: StoreRow[] = [];

  for (const filename of Object.keys(BRAND_FROM_FILENAME)) {
    const filepath = path.join(folder, filename);
    if (!fs.existsSync(filepath)) continue;

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
          // Malaysia: lat ~1-7, lng ~99-120. If reversed (lng,lat), swap.
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
      console.warn('Error reading', filename, e);
    }
  }

  return NextResponse.json(stores);
}
