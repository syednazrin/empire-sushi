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

export async function GET() {
  const folder = path.join(process.cwd(), 'public', 'Store Location Data');
  const stores: StoreRow[] = [];

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

  return NextResponse.json(stores);
}
