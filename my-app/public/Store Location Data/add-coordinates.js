/**
 * Adds Coordinates column to store Excel files using TomTom Geocoding API.
 * Skips Family Mart.xlsx (already done).
 * Expects columns: Name, Address. Adds: Coordinates (lat,lon).
 */

const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const TOMTOM_API_KEY = "8AS7kLv3JtD24yxA9feANeyU3LFRQ66D";
const FOLDER = __dirname;
const SKIP_FILE = "Family Mart.xlsx";
const DELAY_MS = 250; // avoid rate limiting

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocodeAddress(address) {
  if (!address || String(address).trim() === "") return null;
  const query = encodeURIComponent(String(address).trim());
  const url = `https://api.tomtom.com/search/2/geocode/${query}.json?key=${TOMTOM_API_KEY}&limit=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0 && data.results[0].position) {
      const { lat, lon } = data.results[0].position;
      return `${lat},${lon}`;
    }
  } catch (e) {
    console.warn("  Geocode error:", e.message);
  }
  return null;
}

async function processFile(filename) {
  const filepath = path.join(FOLDER, filename);
  if (!fs.existsSync(filepath)) {
    console.warn("Skip (not found):", filename);
    return;
  }

  const wb = XLSX.readFile(filepath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (rows.length < 2) {
    console.warn("Skip (no data rows):", filename);
    return;
  }

  const headers = rows[0].map((h) => (h != null ? String(h).trim() : ""));
  const nameIdx = headers.findIndex((h) => /^name$/i.test(h));
  const addressIdx = headers.findIndex((h) => /^address$/i.test(h));
  let coordIdx = headers.findIndex((h) => /^coordinates?$/i.test(h));

  if (addressIdx === -1) {
    console.warn("Skip (no Address column):", filename);
    return;
  }

  const hasCoordCol = coordIdx >= 0;
  if (!hasCoordCol) {
    headers.push("Coordinates");
    coordIdx = headers.length - 1;
  }

  let updated = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    while (row.length <= coordIdx) row.push("");
    const address = row[addressIdx];
    const name = nameIdx >= 0 ? row[nameIdx] : "";
    const existingCoord = hasCoordCol ? (row[coordIdx] || "").trim() : "";
    if (existingCoord) continue; // already has coordinates
    const coords = await geocodeAddress(address);
    row[coordIdx] = coords != null ? coords : "";
    if (coords) updated++;
    if ((i - 1) % 10 === 0 || i === rows.length - 1) {
      process.stdout.write(`  ${filename}: row ${i}/${rows.length - 1}\r`);
    }
    await sleep(DELAY_MS);
  }

  rows[0] = headers;
  const newWs = XLSX.utils.aoa_to_sheet(rows);
  wb.Sheets[sheetName] = newWs;
  try {
    XLSX.writeFile(wb, filepath);
    console.log(`${filename}: written, ${updated} coordinates added.`);
  } catch (e) {
    if (e.code === "EBUSY") {
      const altName = filename.replace(/\.xlsx$/i, "_with_coordinates.xlsx");
      const altPath = path.join(FOLDER, altName);
      XLSX.writeFile(wb, altPath);
      console.log(`${filename}: file locked — saved as ${altName} (${updated} coordinates). Close original and rename if needed.`);
    } else throw e;
  }
}

async function main() {
  const files = fs.readdirSync(FOLDER).filter((f) => f.endsWith(".xlsx") && f !== SKIP_FILE && !f.startsWith("~$"));
  console.log("Files to process:", files.join(", "));
  for (const f of files) {
    await processFile(f);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
