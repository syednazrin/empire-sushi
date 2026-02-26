import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const STATE_NAME_TO_CODE: Record<string, string> = {
  Johor: 'JHR',
  Kedah: 'KDH',
  Kelantan: 'KTN',
  Melaka: 'MLK',
  'Negeri Sembilan': 'NSN',
  Pahang: 'PHG',
  Perak: 'PRK',
  Perlis: 'PLS',
  'Pulau Pinang': 'PNG',
  Sabah: 'SBH',
  Sarawak: 'SWK',
  Selangor: 'SGR',
  Terengganu: 'TRG',
  'WP Kuala Lumpur': 'KUL',
  'Kuala Lumpur': 'KUL',
  'WP Labuan': 'LBN',
  'WP Putrajaya': 'PJY',
};

const METRIC_KEYS = ['Population (k)', 'Income per capita', 'Income'] as const;

function normalize(s: string) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function GET(req: NextRequest) {
  const metric = (req.nextUrl.searchParams.get('metric') || 'Population (k)') as (typeof METRIC_KEYS)[number];
  if (!METRIC_KEYS.includes(metric)) {
    return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
  }

  const statsPath = path.join(process.cwd(), 'public', 'District Stats', 'District Statistics.geojson');
  const bordersPath = path.join(process.cwd(), 'public', 'State and District Border', 'malaysia.district-jakim.geojson');

  if (!fs.existsSync(statsPath) || !fs.existsSync(bordersPath)) {
    return NextResponse.json({ error: 'Data files not found' }, { status: 404 });
  }

  const statsData = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
  const bordersData = JSON.parse(fs.readFileSync(bordersPath, 'utf-8'));

  const statsByKey = new Map<string, { value: number; [k: string]: unknown }>();
  for (const f of statsData.features || []) {
    const p = f.properties || {};
    const stateName = p.State;
    const districtName = p.District;
    const code = STATE_NAME_TO_CODE[stateName];
    if (!code) continue;
    const key = `${code}|${normalize(districtName)}`;
    const raw = p[metric];
    const value = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 0;
    statsByKey.set(key, { ...p, value });
  }

  let minVal = Infinity;
  let maxVal = -Infinity;
  statsByKey.forEach((s) => {
    const v = s.value;
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  });
  if (minVal === Infinity) minVal = 0;
  if (maxVal <= minVal) maxVal = minVal + 1;

  const features = (bordersData.features || []).map((f: { properties?: { name?: string; state?: string }; geometry: unknown }) => {
    const p = f.properties || {};
    const stateCode = (p.state || '').trim();
    const districtName = (p.name || '').trim();
    const key = `${stateCode}|${normalize(districtName)}`;
    const stat = statsByKey.get(key);
    const value = stat ? stat.value : null;
    const normalized = value != null ? (value - minVal) / (maxVal - minVal) : 0;
    const fill = value != null ? interpolateBeigeToCoral(normalized) : '#f5f0e8';
    return {
      ...f,
      properties: {
        ...p,
        [metric]: value,
        _value: value,
        _fill: fill,
        _min: minVal,
        _max: maxVal,
      },
    };
  });

  return NextResponse.json({
    type: 'FeatureCollection',
    features,
    bounds: { min: minVal, max: maxVal },
  });
}

function interpolateBeigeToCoral(t: number) {
  const beige = { r: 245, g: 240, b: 232 };
  const coral = { r: 255, g: 107, b: 74 };
  const r = Math.round(beige.r + (coral.r - beige.r) * t);
  const g = Math.round(beige.g + (coral.g - beige.g) * t);
  const b = Math.round(beige.b + (coral.b - beige.b) * t);
  return `rgb(${r},${g},${b})`;
}
