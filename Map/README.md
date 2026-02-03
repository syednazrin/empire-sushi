# Empire Sushi — Map & Analytics Deck

A slide-deck style web app for the Empire Sushi competitive landscape and location intelligence study.

## Stack

- **Next.js 16** (App Router)
- **Tailwind CSS 4**
- **Mapbox GL** (via `react-map-gl`)
- **Recharts**

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mapbox token

Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`. The app uses it for the map on Slide 2.

## Slides

1. **Cover** — Empire Sushi title, subtitle, and “Scroll to Explore”
2. **Map + Analytics** — Mapbox map (store locations + choropleth), brand metrics, top items
3. **Trends** — Line chart (premium vs mass sushi), short insights

Scroll-snap and a bottom-center page counter (e.g. `02 / 03`) are enabled globally.
