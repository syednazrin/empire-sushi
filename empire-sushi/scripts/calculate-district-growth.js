const fs = require('fs');
const path = require('path');

// Load data
const districtData = require('../public/District Dosm Data/json files/simplified_district_data.json');
const stores = require('../public/data/stores.json');
const mallData = require('../public/data/store-mall.json');

// Calculate total population by district and year
const districtYearPop = {};

for (let i = 0; i < districtData.district.length; i++) {
  const district = districtData.district[i];
  const date = districtData.date[i];
  const pop = districtData.population[i];
  const year = date.split('-')[0];
  const sex = districtData.sex[i];
  const age = districtData.age[i];
  const ethnicity = districtData.ethnicity[i];
  
  // Only use overall totals
  if (sex === 'both' && age === 'overall' && ethnicity === 'overall') {
    const key = `${district}|${year}`;
    districtYearPop[key] = (districtYearPop[key] || 0) + pop;
  }
}

// Calculate growth from 2020 to 2024
const growthData = {};
Object.keys(districtYearPop).forEach(key => {
  const [district, year] = key.split('|');
  if (year === '2020' || year === '2024') {
    if (!growthData[district]) growthData[district] = {};
    growthData[district][year] = districtYearPop[key];
  }
});

// Calculate growth rates
const growthRates = [];
Object.entries(growthData).forEach(([district, years]) => {
  if (years['2020'] && years['2024']) {
    const growth = ((years['2024'] - years['2020']) / years['2020']) * 100;
    growthRates.push({
      district,
      pop2020: years['2020'],
      pop2024: years['2024'],
      growthPct: parseFloat(growth.toFixed(2)),
      absoluteGrowth: years['2024'] - years['2020']
    });
  }
});

// Sort by growth rate
growthRates.sort((a, b) => b.growthPct - a.growthPct);

// Get top 30 growth districts
const topGrowthDistricts = growthRates.slice(0, 30);

// Count stores by brand in each district
// First, load enriched store data to get district info
const enrichedPath = path.join(__dirname, '../public/data/stores-enriched-temp.json');
let enrichedStores = [];
if (fs.existsSync(enrichedPath)) {
  enrichedStores = JSON.parse(fs.readFileSync(enrichedPath, 'utf-8'));
} else {
  console.warn('Note: stores-enriched-temp.json not found. Using stores.json without district mapping.');
  enrichedStores = stores;
}

// Count stores by district and brand
const districtStores = {};
enrichedStores.forEach(store => {
  const district = store.district || 'Unknown';
  if (!districtStores[district]) {
    districtStores[district] = {};
  }
  if (!districtStores[district][store.brand]) {
    districtStores[district][store.brand] = 0;
  }
  districtStores[district][store.brand]++;
});

// Enrich top growth districts with store counts
const enrichedGrowthDistricts = topGrowthDistricts.map(d => {
  const storeData = districtStores[d.district] || {};
  return {
    ...d,
    empireCount: storeData['Empire Sushi'] || 0,
    sushiKingCount: storeData['Sushi King'] || 0,
    familyMartCount: storeData['Family Mart'] || 0,
    sushiZanmaiCount: storeData['Sushi Zanmai'] || 0,
    sushiJiroCount: storeData['Sushi Jiro'] || 0,
    sushiPlusCount: storeData['Sushi Plus'] || 0,
    totalCompetitors: Object.values(storeData).reduce((sum, count) => sum + count, 0)
  };
});

// Output results
console.log('\n=== TOP 30 HIGHEST GROWTH DISTRICTS (2020-2024) ===\n');
enrichedGrowthDistricts.forEach((d, i) => {
  console.log(`${i + 1}. ${d.district}`);
  console.log(`   Growth: ${d.growthPct}% | Pop 2020: ${d.pop2020.toLocaleString()} → 2024: ${d.pop2024.toLocaleString()}`);
  console.log(`   Empire: ${d.empireCount} | Sushi King: ${d.sushiKingCount} | Family Mart: ${d.familyMartCount}`);
  console.log(`   Total stores: ${d.totalCompetitors}\n`);
});

// Save to JSON for visualization
const outputPath = path.join(__dirname, '../public/data/district-growth-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(enrichedGrowthDistricts, null, 2));
console.log(`\n✓ Saved to ${outputPath}`);

// Summary stats
const districtsWithEmpire = enrichedGrowthDistricts.filter(d => d.empireCount > 0).length;
const districtsWithoutEmpire = enrichedGrowthDistricts.filter(d => d.empireCount === 0 && d.totalCompetitors > 0).length;
const totalEmpireInGrowth = enrichedGrowthDistricts.reduce((sum, d) => sum + d.empireCount, 0);

console.log('\n=== SUMMARY ===');
console.log(`High-growth districts with Empire presence: ${districtsWithEmpire} of 30`);
console.log(`High-growth districts with competitors but NO Empire: ${districtsWithoutEmpire}`);
console.log(`Total Empire stores in high-growth areas: ${totalEmpireInGrowth}`);
