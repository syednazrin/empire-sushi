# District Demographics Feature

## Overview
Enhanced the Spatial Statistics page (Slide 3) with district-level demographic insights alongside the existing brand analytics.

## What Was Added

### 1. **Tab Panel at the Top**
- Two tabs: "Brand Analytics" and "District Demographics"
- Seamlessly switch between analytics views and district-level demographic insights
- Matches the design pattern from the reference image

### 2. **District Demographics Data Integration**
- Loaded simplified district demographic data (`simplified_district_data.json`)
- Data includes:
  - 319,200 demographic records
  - 160 districts across 16 states
  - Population data from 2020-2024
  - Breakdowns by age, sex, and ethnicity

### 3. **Interactive Map Features**
- **Click on districts** on the map to view their demographics
- Automatically switches to "District Demographics" tab when clicking a district
- Visual cursor feedback when hovering over districts
- Districts are already colored by Population/Income metrics (choropleth)

### 4. **District Demographics Panel**
When a district is selected, the panel shows:

#### Left Column:
- **Overview Card**: District name, state, total population (2024)
- **Population Trend Chart**: Line chart showing population growth from 2020-2024
- **Ethnicity Breakdown**: Interactive pie chart showing ethnic composition

#### Right Column:
- **Age Distribution**: Horizontal bar chart showing population by age groups (0-4, 5-9, etc.)
- **Detailed Breakdown Table**: Scrollable list of ethnicities with population and percentages
- **Insights Card**: Key demographic insights about the selected district

### 5. **District Selection Options**
- Click any district on the map
- OR use the dropdown selector in the panel header

## Files Modified

1. **`app/components/Slide3.tsx`**
   - Added district demographics state management
   - Integrated demographic data loading
   - Added map click handlers for district selection
   - Created tab panel UI
   - Built comprehensive demographics visualization panels
   - Added population trend, ethnicity, and age distribution charts

2. **Created: `scripts/parquet-to-simplified-json.py`**
   - Converts parquet demographic data to columnar JSON format
   - Reduces file size by ~57% (from 47.7MB to 20.3MB)

3. **Created: `public/District Dosm Data/json files/simplified_district_data.json`**
   - Columnar JSON format for efficient loading
   - Contains all 319,200 demographic records

## How to Use

1. **Navigate to Page 3** (Spatial Statistics)
2. **View Brand Analytics** (default view):
   - See store distribution, market share, competitive areas
   - Analyze brand performance metrics
   
3. **Switch to District Demographics**:
   - Click the "District Demographics" tab, OR
   - Click any district on the map
   
4. **Explore Demographics**:
   - View population trends over time
   - See ethnic composition
   - Analyze age distribution
   - Compare different districts by selecting from dropdown or clicking the map

## Data Structure

The demographic data is stored in columnar format:
```json
{
  "state": ["Johor", "Johor", ...],
  "district": ["Batu Pahat", "Batu Pahat", ...],
  "date": ["2020-01-01", "2020-01-01", ...],
  "sex": ["both", "both", ...],
  "age": ["overall", "overall", ...],
  "ethnicity": ["overall", "bumi_malay", ...],
  "population": [495.3, 311.3, ...]
}
```

## Features Highlights

✅ **Tab-based navigation** between analytics and demographics
✅ **Interactive map** - click districts to view demographics
✅ **Population trends** - 5 years of historical data
✅ **Ethnicity breakdown** - visual pie chart + detailed table
✅ **Age distribution** - comprehensive bar chart
✅ **Growth metrics** - automatic calculation of population growth
✅ **Responsive design** - works on different screen sizes
✅ **Smooth transitions** - polished UI animations

## Technical Details

- **Framework**: Next.js 16.1.6 with React 19
- **Mapping**: Mapbox GL JS
- **Charts**: Recharts library
- **Data Format**: Columnar JSON for performance
- **File Size**: 20.3MB (optimized from 47.7MB parquet)

## Dev Server

The application is running at:
- Local: http://localhost:3000
- Network: http://172.20.10.3:3000

Navigate to page 3 to see the new district demographics feature!
