import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

function parseRow(line: string): string[] {
  return line.split(',').map((cell) => cell.replace(/^"|"$/g, '').trim());
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow).filter((r) => r.some((c) => c.length > 0));
  return { headers, rows };
}

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'Search By Stores');
    if (!fs.existsSync(dir)) {
      return NextResponse.json({ data: [], stores: [] });
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.csv') && !f.startsWith('~$'));

    const byDate: Record<string, Record<string, number>> = {};
    const storeSet = new Set<string>();

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { headers, rows } = parseCSV(content);
      if (headers.length < 2) continue;
      const storeName = headers[1];
      if (storeSet.has(storeName)) continue;
      storeSet.add(storeName);

      for (const row of rows) {
        const date = row[0];
        const value = parseInt(row[1], 10);
        if (!date || isNaN(value)) continue;
        if (!byDate[date]) byDate[date] = {};
        byDate[date][storeName] = value;
      }
    }

    const dates = Object.keys(byDate).sort();
    const stores = Array.from(storeSet).sort((a, b) => (a === 'Empire Sushi' ? -1 : b === 'Empire Sushi' ? 1 : a.localeCompare(b)));
    const data = dates.map((date) => {
      const row: Record<string, string | number> = { date };
      stores.forEach((s) => (row[s] = byDate[date][s] ?? 0));
      return row;
    });

    return NextResponse.json({ data, stores });
  } catch (e) {
    console.error('Search by stores API error:', e);
    return NextResponse.json({ data: [], stores: [] }, { status: 500 });
  }
}
