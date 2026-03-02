# Gen Z Hotspots & Ethnicity Demographics Feature

## 🎯 Overview
Enhanced the District Demographics tab with **Gen Z hotspot mapping**, **ethnicity-based coloring**, and **strategic metrics** comparing Empire Sushi to competitors in demographics targeting.

---

## 🗺️ Map Features

### 1. **Gen Z Hotspots** (Age 10-29)
When "Gen Z Hotspots" metric is selected, districts are colored by Gen Z population:

**Color Scale:**
- 🔴 **Dark Red** (≥100k) - Very High Gen Z population
- 🟠 **Orange** (50-100k) - High Gen Z population  
- 🟡 **Yellow** (25-50k) - Medium Gen Z population
- 🟢 **Light Green** (10-25k) - Low-Medium Gen Z population
- ⚪ **Gray** (<10k) - Low Gen Z population

### 2. **Primary Ethnicity**
When "Primary Ethnicity" metric is selected, districts are colored by the dominant ethnic group:

**Color Coding:**
- 🟢 **Green** - Bumi Malay (majority)
- 🔴 **Red** - Chinese (majority)
- 🟠 **Orange** - Indian (majority)
- 🔵 **Cyan** - Bumi Other (majority)
- 🟣 **Purple** - Other Citizen (majority)
- ⚪ **Gray** - Unknown/No data

---

## 📊 Strategic Metrics (Dashboard View)

When you're on the District Demographics tab but haven't selected a district, you see **strategic insights**:

### 1. **Gen Z Hotspot Coverage**
Shows which brands have the best presence in Gen Z-rich districts (≥50k Gen Z population):

- **Stores in hotspots** vs total stores per brand
- **Percentage bar** showing hotspot penetration
- **Sortable by performance** - see who's winning the Gen Z game

**Example:**
```
Empire Sushi: 15/45 stores → 33% in Gen Z hotspots
Sushi King: 42/89 stores → 47% in Gen Z hotspots
```

### 2. **Primary Ethnicity Targeting**
Reveals which ethnic demographic each brand primarily serves:

- **Most common ethnicity** in districts where brand operates
- **Number of stores** targeting that demographic
- **Percentage** of brand's portfolio in that demographic

**Example:**
```
Empire Sushi → Bumi Malay: 28 stores (62%)
Sushi King → Chinese: 51 stores (57%)
```

### 3. **Empire Sushi Strategic Position**
Dedicated card highlighting Empire Sushi's demographics strategy:

**Metrics:**
- **Gen Z Hotspot Penetration** - % of Empire stores in Gen Z-rich districts
- **District Coverage** - Number of unique districts Empire operates in
- **Primary Target** - Main ethnic demographic Empire serves

---

## 🎛️ How to Use

### Access the Feature:
1. Navigate to **Page 3** (Spatial Statistics)
2. Click **"District Demographics" tab**
3. You'll see strategic metrics immediately

### Switch Map Views:
Use the **"Demographic metric"** dropdown on the left map panel:
- Select **"Gen Z Hotspots (10-29 yrs)"** - See youth concentration
- Select **"Primary Ethnicity"** - See ethnic distribution

### Explore Districts:
- **Click any district** on the map to see detailed demographics
- **Use dropdown** to select specific districts
- View population trends, ethnicity breakdown, and age distribution

---

## 📈 Key Insights You Can Discover

### 1. **Gen Z Market Opportunities**
- Which districts have the highest Gen Z populations?
- Are Empire Sushi stores located in Gen Z hotspots?
- Which competitors dominate Gen Z areas?

### 2. **Demographic Targeting**
- What's the primary ethnic group in each district?
- Are stores aligned with local demographics?
- Which brands target which ethnicities?

### 3. **Competitive Positioning**
- How does Empire Sushi compare to competitors in Gen Z coverage?
- Which districts have high Gen Z but low Empire presence?
- What's the ethnic composition of Empire's target districts?

### 4. **Expansion Strategy**
- Identify Gen Z hotspots with no Empire presence
- Find districts with favorable demographics
- Compare demographic strategies across brands

---

## 💡 Strategic Questions This Answers

1. **"Are we targeting Gen Z effectively?"**
   → See Gen Z Hotspot Coverage metric

2. **"Which ethnic groups do we serve most?"**
   → See Primary Ethnicity Targeting breakdown

3. **"Where should we expand next?"**
   → Look for high Gen Z districts with low Empire presence

4. **"How do competitors approach demographics?"**
   → Compare ethnicity targeting across all brands

5. **"What's our demographic profile vs Sushi King?"**
   → Compare both Gen Z and ethnicity metrics side-by-side

---

## 🎨 Visual Example

**Scenario: Analyzing Gen Z Strategy**

1. Switch to "District Demographics" tab
2. Select "Gen Z Hotspots" metric
3. Map shows:
   - Petaling (Selangor) - **Dark Red** (150k Gen Z)
   - Johor Bahru (Johor) - **Orange** (80k Gen Z)
   - Kuching (Sarawak) - **Yellow** (35k Gen Z)

4. Strategic metrics show:
   ```
   Gen Z Hotspot Coverage:
   Sushi King:    47% (42/89 stores)
   Empire Sushi:  33% (15/45 stores)  ← Room to improve
   Sushi Mentai:  29% (12/41 stores)
   ```

5. **Insight**: Empire Sushi has opportunity to expand in Gen Z hotspots to match Sushi King's penetration.

---

## 📁 Files Modified/Created

### Modified:
- `app/components/Slide3.tsx` - Added all demographic features

### Data Sources:
- `public/District Dosm Data/json files/simplified_district_data.json` - Population data
- `public/State and District Border/malaysia.district-jakim.geojson` - District boundaries

---

## 🚀 Technical Implementation

### Gen Z Calculation:
```javascript
// Ages 10-29 includes: 10-14, 15-19, 20-24, 25-29
const genZAges = ['10-14', '15-19', '20-24', '25-29'];
const genZPop = sum of all these age groups;
```

### Primary Ethnicity:
```javascript
// For each district, find ethnicity with highest population
ethnicities.sort((a, b) => b.population - a.population);
primaryEthnicity = ethnicities[0];
```

### Hotspot Definition:
- **Gen Z Hotspot** = District with ≥50k Gen Z population
- Used to calculate brand penetration metrics

---

## 🎯 Business Value

1. **Data-Driven Expansion**
   - Identify high-potential districts based on youth demographics
   - Avoid oversaturated or poor-fit locations

2. **Competitive Intelligence**
   - See where competitors focus their resources
   - Find underserved Gen Z markets

3. **Demographic Alignment**
   - Understand ethnic composition of operating areas
   - Tailor menu/marketing to local demographics

4. **Performance Benchmarking**
   - Compare Empire's demographic strategy to market leaders
   - Set targets for Gen Z market penetration

---

## 🌟 Example Use Cases

### Use Case 1: Finding Expansion Opportunities
1. View Gen Z Hotspots map
2. Identify dark red/orange districts (high Gen Z)
3. Check Gen Z Hotspot Coverage metric
4. Find districts where Empire has 0 stores but competitors have presence
5. Prioritize these for expansion

### Use Case 2: Understanding Demographic Mix
1. Switch to Primary Ethnicity map
2. See which colors dominate Empire's current locations
3. Compare to competitors' ethnic targeting
4. Adjust marketing/menu based on findings

### Use Case 3: Strategic Planning
1. View Strategic Position card
2. Note Gen Z penetration % (e.g., 33%)
3. Set goal to reach competitor level (e.g., 47%)
4. Calculate: need X more stores in Y Gen Z hotspots

---

## 📞 Getting Started

**Run the app:**
```bash
cd "d:\Work Folder\Empire Sushi\empire-sushi"
npm run dev
```

**Access the feature:**
1. Open http://localhost:3000
2. Navigate to Page 3 (Spatial Statistics)
3. Click "District Demographics" tab
4. Explore the strategic metrics and interactive map!

---

## 🔑 Key Takeaway

This feature transforms demographic data into **actionable business intelligence**. You can now:
- ✅ See where Gen Z clusters are
- ✅ Understand ethnic composition by district
- ✅ Compare Empire's demographic strategy to all competitors
- ✅ Identify expansion opportunities based on demographics
- ✅ Make data-driven location decisions

**The map is colored, the metrics are clear, and the insights are powerful!** 🎉
