# Menu Comparison Dashboard - Slide 3

## Overview
An interactive, analytics-focused dashboard that compares menu items and prices across multiple sushi stores (Empire Sushi and competitors).

## Features Implemented

### 1. **API Route** (`/api/menu-items`)
- Automatically reads all Excel files from `public/Menu Items/`
- Parses menu data with flexible column name detection
- Returns structured JSON with: store, item, price, category

### 2. **Left Sidebar - Interactive Filters**

#### **Search Bar**
- Real-time search across all menu items
- Case-insensitive matching

#### **Store Selection**
- Multi-select with color-coded buttons
- Visual indicators for selected stores
- Dynamic filtering

#### **Price Range Slider**
- Dual-range slider for min/max price
- Real-time filtering
- Auto-adjusts to data range

#### **KPI Widgets**
Display for each store:
- Average price (RM)
- Total item count
- Minimum price
- Maximum price
- Color-coded by store brand

### 3. **Main Charts Area**

#### **Box Plot - Price Range Distribution** ⭐ KEY FEATURE
- Shows price distribution for each selected store
- Displays: Min, Q1, Median, Q3, Max
- Includes mean line (red dashed)
- Detects and reports outliers
- Color-coded by store
- Interactive tooltips with all statistics

#### **Price Distribution Histogram**
- Bins prices into RM 5 ranges
- Stacked or grouped bars per store
- Shows concentration of prices
- Compare price strategies across stores

#### **Scatter Plot - Items vs Price**
- Every menu item plotted
- X-axis: Item index (ordered)
- Y-axis: Price
- Color-coded by store
- Click to highlight items
- Rich tooltips (store, item name, price)

#### **Category-wise Comparison** (if categories exist)
- Average price per category per store
- Side-by-side bar comparison
- Identifies which categories are premium/budget

### 4. **Interactive Features**

#### **Cross-Filtering**
- Select stores → all charts update
- Adjust price range → filters apply globally
- Search items → highlights across dashboard

#### **Hover Tooltips**
- Every chart has rich tooltips
- Shows: store, item, price, statistics
- Context-aware information

#### **Click Interactions**
- Click scatter points to highlight items
- Toggle stores on/off instantly
- Smooth transitions and animations

### 5. **Design & UX**

#### **Visual Style**
- Clean, minimalistic dashboard
- Sushi-inspired color palette (soft pastels)
- Consistent with your existing slides
- Professional, investor-friendly

#### **Responsive Layout**
- Left sidebar: 320px (filters + KPIs)
- Right panel: Flexible, scrollable
- Adapts to desktop and tablet

#### **Empty States**
- Guidance when no stores selected
- Loading states with sushi emoji
- Helpful insights panel

## Data Requirements

### Excel File Format
Each file in `public/Menu Items/` should have columns:
- **Item** or **Item Name** or **Name** (menu item name)
- **Price** or **Price (RM)** or **RM** (numeric price)
- **Category** or **Type** (optional, for category analysis)

### Supported Files
- Empire Sushi Menu.xlsx
- Sushi Jiro Menu.xlsx
- Mentai Sushi Menu.xlsx
- Family Mart Sushi Menu.xlsx
- (Any additional xlsx files)

## Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Charts**: Recharts (responsive, interactive)
- **Data Parsing**: xlsx (SheetJS)
- **State**: React hooks (useState, useMemo, useEffect)

## Usage

### Default Behavior
1. Loads all menu data on mount
2. Selects first 2 stores by default
3. Sets price range to data max
4. Shows all charts immediately

### User Interactions
1. **Select stores** → Update all visualizations
2. **Adjust price range** → Filter items dynamically
3. **Search items** → Highlight matches
4. **Click scatter points** → Emphasize specific items
5. **Hover charts** → View detailed statistics

## Key Insights Provided
- **Price positioning**: How does Empire Sushi compare?
- **Price distribution**: Are items clustered or spread?
- **Outliers**: Any unusually priced items?
- **Category pricing**: Which categories are premium?
- **Item overlap**: Which items are common across stores?
- **Market strategy**: Budget vs premium positioning

## Performance Optimizations
- `useMemo` for expensive calculations (KPIs, charts)
- Memoized filtering logic
- Efficient state updates
- Lazy chart rendering (only selected stores)

## Future Enhancements (Optional)
- Export charts as PDF
- Item overlap Venn diagram
- Recommendation panel (competitive pricing insights)
- Time-based analysis (if historical data available)
- Custom category grouping

## Notes
- All calculations done client-side for speed
- Box plot uses standard IQR method for outliers
- Charts auto-scale to data ranges
- Color palette matches brand guidelines
- Accessibility: keyboard navigation, ARIA labels
