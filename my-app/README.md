# Empire Sushi - Premium Slide Deck Website

A luxurious, slide-deck-style website showcasing competitive intelligence and location analytics for Empire Sushi. Built with Next.js, featuring a minimal Japanese-inspired design aesthetic.

## 🎨 Design Philosophy

- **Minimal & Premium**: White-dominant backgrounds with black typography
- **Japanese-Inspired Luxury**: Editorial serif titles, clean sans-serif body text
- **Soft Peach/Coral Accents**: `#FFB4A2` and `#FF8A73` for visual framing
- **Generous Whitespace**: Calm, refined, investor-grade presentation
- **Subtle Motion**: Smooth scroll-snap transitions between full-viewport slides

## 📊 Slide Structure

### Slide 1: Title / Cover
- Split hero layout with premium sushi imagery placeholder
- Large serif title with Japanese decorative text
- Elegant CTA pill button
- Introduces the competitive intelligence study

### Slide 2: Map + Competitive Analytics ⭐
- **Left Half**: Full-height Mapbox GL map
  - Store locations for Empire Sushi, Sushi Mentai, Nippon Sushi, FamilyMart
  - Population density choropleth (mock data)
  - Interactive markers with brand-specific colors
- **Right Half**: Analytics panel
  - Competitor pricing comparison
  - Menu depth analysis
  - Store counts and distribution
  - Key strategic insights

### Slide 3: Sushi Trend Analytics
- Line chart showing search interest over time
- Premium vs. mass-market trend comparison
- Market share bar chart (estimated)
- Strategic observations on growth patterns

### Slide 4: Competitive Matrix 🆕
- Radar chart comparing brands across 5 dimensions
  - Price Point, Menu Variety, Premium Feel, Accessibility, Innovation
- Pricing tier breakdown (Budget / Mid-Range / Premium)
- Brand positioning insights

### Slide 5: Recommendations & Next Steps 🆕
- 4 actionable strategic recommendations
  - Geographic expansion opportunities
  - Digital experience enhancement
  - Premium line extension
  - Menu optimization
- Risk assessment matrix
- Investment outlook summary

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.6 (Turbopack)
- **Styling**: Tailwind CSS 4
- **Maps**: Mapbox GL JS 3.18.1
- **Charts**: Recharts 3.7.0
- **Typography**: 
  - Cormorant Garamond (serif, editorial)
  - Inter (sans-serif, body)
  - Geist Sans & Mono (Next.js defaults)

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to view the site.

## 🔑 Environment Variables

The Mapbox access token is currently hardcoded in `Slide2.tsx`. For production, create a `.env.local` file:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

Then update `Slide2.tsx`:
```typescript
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
```

## 🎯 Key Features

### Scroll Snapping
Full-viewport slides with smooth scroll-snap behavior implemented via CSS in `globals.css`.

### Page Counter
Fixed bottom-center counter showing current slide (e.g., "01 / 05"). Auto-updates on scroll.

### Interactive Map
- Seamlessly integrated Mapbox GL map (no borders, blends into layout)
- Brand-specific marker colors
- Hover effects and popups
- Map legend with store counts

### Responsive Charts
- Line charts for trend analysis
- Bar charts for market share
- Radar charts for competitive positioning
- Custom tooltips with brand colors

## 📁 Project Structure

```
my-app/
├── app/
│   ├── components/
│   │   ├── PageCounter.tsx    # Slide counter component
│   │   ├── Slide1.tsx          # Title/cover slide
│   │   ├── Slide2.tsx          # Map + analytics (main)
│   │   ├── Slide3.tsx          # Trend analytics
│   │   ├── Slide4.tsx          # Competitive matrix
│   │   └── Slide5.tsx          # Recommendations
│   ├── globals.css             # Global styles + scroll-snap
│   ├── layout.tsx              # Root layout with fonts
│   └── page.tsx                # Main page assembling slides
├── public/
│   └── malaysia.district-jakim.geojson  # District boundaries (unused currently)
└── package.json
```

## 🎨 Color Palette

```css
--background: #ffffff       /* Pure white */
--foreground: #171717       /* Near black */
--accent-peach: #FFB4A2     /* Soft peach */
--accent-coral: #FF8A73     /* Muted coral */
```

### Brand Colors (Charts & Maps)
- **Empire Sushi**: `#FF8A73` (coral)
- **Sushi Mentai**: `#4ECDC4` (teal)
- **Nippon Sushi**: `#95E1D3` (mint)
- **FamilyMart**: `#F38181` (rose)

## 💡 Recommended Additions

Consider adding these slides to enhance the presentation:

### 1. **Customer Demographics Slide**
- Age distribution charts
- Income bracket analysis
- Dining frequency patterns
- Brand preference by demographic

### 2. **Operational Metrics Slide**
- Average wait time comparison
- Table turnover rates
- Peak hour analysis
- Delivery vs. dine-in split

### 3. **Financial Projections Slide**
- Revenue growth forecast
- Market expansion scenarios
- Break-even analysis for new locations
- ROI timeline visualization

## 🐛 Known Considerations

- **Mock Data**: All analytics use dummy/random data for demonstration
- **Choropleth Layer**: Currently has empty GeoJSON; needs actual district data from `malaysia.district-jakim.geojson`
- **Image Placeholders**: Slide 1 uses emoji placeholder for premium sushi imagery
- **Dark Mode**: Currently disabled (removed from `globals.css`)

## 📝 Data Sources (Mock)

All data is currently mock/fabricated for design purposes:
- Store locations: Approximate real mall locations in KL
- Pricing: Realistic but not actual prices
- Menu counts: Estimated
- Search trends: Generated curves
- Market share: Hypothetical estimates

Replace with real data for production use.

## 🔧 Customization

### Changing Slide Colors
Edit `globals.css` CSS variables:
```css
--accent-peach: #FFB4A2;  /* Your color here */
--accent-coral: #FF8A73;  /* Your color here */
```

### Adding More Slides
1. Create `app/components/SlideX.tsx`
2. Import in `app/page.tsx`
3. Add to JSX: `<SlideX />`
4. Update `<PageCounter totalSlides={6} />`

### Modifying Map Style
In `Slide2.tsx`, change the `style` property:
```typescript
style: 'mapbox://styles/mapbox/light-v11'  // or streets-v12, satellite-v9, etc.
```

## 📱 Responsiveness

- Mobile: Single-column layouts, stacked components
- Tablet: Slide 2 may benefit from adjustments to map/analytics split
- Desktop: Optimized for 1920x1080 and wider

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Recharts Documentation](https://recharts.org/en-US/)

## 📄 License

Private project for Empire Sushi competitive intelligence analysis.

---

**Built with ❤️ using Next.js + Tailwind + Mapbox + Recharts**
