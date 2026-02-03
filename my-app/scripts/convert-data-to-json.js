const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BRAND_FROM_FILENAME = {
  'Empire_Sushi_Cleaned.xlsx': 'Empire Sushi',
  'Family_Mart_Cleaned.xlsx': 'Family Mart',
  'Nippon_Sushi_Cleaned.xlsx': 'Nippon Sushi',
  'Sushi_Jiro_Cleaned.xlsx': 'Sushi Jiro',
  'Sushi_King_Cleaned.xlsx': 'Sushi King',
  'Sushi_Mentai_Cleaned.xlsx': 'Sushi Mentai',
  'Sushi_Plus_Cleaned.xlsx': 'Sushi Plus',
  'Sushi_Zanmai_Cleaned.xlsx': 'Sushi Zanmai',
};

const storeDataFolder = path.join(__dirname, '..', 'public', 'Store Location Data');
const outputFile = path.join(__dirname, '..', 'public', 'data', 'stores.json');

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const stores = [];

for (const [filename, brand] of Object.entries(BRAND_FROM_FILENAME)) {
  const filepath = path.join(storeDataFolder, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`File not found: ${filepath}`);
    continue;
  }

  try {
    const fileBuffer = fs.readFileSync(filepath);
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (rows.length < 2) continue;

    const headers = rows[0].map((h) => (h != null ? String(h).trim().toLowerCase() : ''));
    const nameIdx = headers.findIndex((h) => h === 'name' || h === 'store' || h === 'store name');
    const addressIdx = headers.findIndex((h) => h === 'address' || h === 'location');
    const coordIdx = headers.findIndex((h) => h === 'coordinates' || h === 'coordinate' || h === 'coord');
    const latIdx = headers.findIndex((h) => h === 'lat' || h === 'latitude');
    const lngIdx = headers.findIndex((h) => h === 'lng' || h === 'lon' || h === 'longitude');

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      let lat, lng;

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
    console.error(`Error reading ${filename}:`, e);
  }
}

fs.writeFileSync(outputFile, JSON.stringify(stores, null, 2));
console.log(`Converted ${stores.length} stores to ${outputFile}`);
