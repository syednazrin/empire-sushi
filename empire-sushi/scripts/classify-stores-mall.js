/**
 * Classify each store as in-mall or not using OpenAI.
 * Requires OPENAI_API_KEY in .env.local or environment.
 * Run: node scripts/classify-stores-mall.js (from empire-sushi directory)
 * Output: public/data/store-mall.json
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if present (Next.js style)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY. Set it in .env.local or environment.');
  process.exit(1);
}

const storesPath = path.join(__dirname, '..', 'public', 'data', 'stores.json');
const outputPath = path.join(__dirname, '..', 'public', 'data', 'store-mall.json');

const BATCH_SIZE = 20;
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function classifyStore(store) {
  const prompt = `Based only on the store name and address, is this location inside a shopping mall (e.g. mall, shopping center, AEON Mall, Pavilion, Mid Valley, standalone mall)? Reply with exactly one word: YES or NO.

Store: ${store.name}
Address: ${store.address || 'N/A'}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();
  const inMall = text.startsWith('YES');
  return { key: `${store.lng},${store.lat},${store.brand}`, inMall };
}

async function main() {
  const stores = JSON.parse(fs.readFileSync(storesPath, 'utf-8'));
  const results = {};
  let done = 0;

  for (let i = 0; i < stores.length; i += BATCH_SIZE) {
    const batch = stores.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (store) => {
        try {
          const { key, inMall } = await classifyStore(store);
          results[key] = inMall;
        } catch (e) {
          console.warn(`Failed ${store.brand} ${store.name}:`, e.message);
          results[`${store.lng},${store.lat},${store.brand}`] = false;
        }
        done++;
        if (done % 50 === 0) console.log(`Classified ${done}/${stores.length}...`);
      })
    );
    if (i + BATCH_SIZE < stores.length) await sleep(DELAY_MS);
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Wrote ${Object.keys(results).length} classifications to ${outputPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
