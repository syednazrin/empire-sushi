"use client";

import { useCallback, useRef } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import { STORES, BRANDS, BRAND_METRICS, TOP_ITEMS } from "@/lib/data";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Mock choropleth: simple GeoJSON with district-like polygons and density
const CHOROPLETH_DATA = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "KL", density: 0.9 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [101.65, 3.12],
            [101.75, 3.12],
            [101.75, 3.22],
            [101.65, 3.22],
            [101.65, 3.12],
          ],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "PJ", density: 0.7 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [101.55, 3.02],
            [101.68, 3.02],
            [101.68, 3.14],
            [101.55, 3.14],
            [101.55, 3.02],
          ],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Shah Alam", density: 0.5 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [101.48, 3.00],
            [101.58, 3.00],
            [101.58, 3.12],
            [101.48, 3.12],
            [101.48, 3.00],
          ],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Subang", density: 0.6 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [101.52, 3.04],
            [101.62, 3.04],
            [101.62, 3.10],
            [101.52, 3.10],
            [101.52, 3.04],
          ],
        ],
      },
    },
  ],
};

export function MapSlide({ isActive = true }: { isActive?: boolean }) {
  const mapRef = useRef<MapRef>(null);

  const getBrandColor = useCallback((brandId: string) => {
    return BRANDS.find((b) => b.id === brandId)?.color ?? "#888";
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full min-h-screen w-full items-center justify-center bg-[#fafafa] text-black/60">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
      </div>
    );
  }

  return (
    <section
      className={`slide flex min-h-screen w-full flex-col md:flex-row ${!isActive ? "slide-inactive" : ""}`}
    >
      {/* Left: full-height map — no borders */}
      <div className="relative h-[50vh] w-full md:h-screen md:w-1/2">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: 101.65,
            latitude: 3.12,
            zoom: 9.5,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          transformRequest={(url: string, resourceType?: string) => {
            // Only proxy Mapbox API and tile requests
            if (url && (url.includes('api.mapbox.com') || url.includes('tiles.mapbox.com'))) {
              return {
                url: `/api/mapbox-proxy?url=${encodeURIComponent(url)}`,
              };
            }
            // Return original URL for everything else
            return { url: url || '' };
          }}
        >
          {/* Choropleth: population density */}
          <Source id="choropleth" type="geojson" data={CHOROPLETH_DATA}>
            <Layer
              id="choropleth-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "density"],
                  0,
                  "#f5e6e0",
                  0.5,
                  "#e8c4ba",
                  1,
                  "#e8a598",
                ],
                "fill-opacity": 0.5,
              }}
            />
            <Layer
              id="choropleth-line"
              type="line"
              paint={{
                "line-color": "#e8a598",
                "line-width": 0.5,
                "line-opacity": 0.4,
              }}
            />
          </Source>
          {/* Store markers */}
          {STORES.map((store) => (
            <Marker
              key={`${store.brand}-${store.name}`}
              longitude={store.lng}
              latitude={store.lat}
              anchor="bottom"
              color={getBrandColor(store.brand)}
            >
              <div
                className="h-3 w-3 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: getBrandColor(store.brand) }}
              />
            </Marker>
          ))}
        </Map>
      </div>

      {/* Right: analytics panel */}
      <div className="flex w-full flex-col gap-6 overflow-y-auto bg-white p-6 md:w-1/2 md:max-h-screen md:justify-center md:px-10 md:py-12">
        <h2
          className="text-2xl font-semibold text-[#171717] md:text-3xl"
          style={{ fontFamily: "var(--font-serif-jp), Georgia, serif" }}
        >
          Competitive Analytics
        </h2>

        {/* Metrics cards — soft shadow, no heavy borders */}
        <div className="grid gap-4 sm:grid-cols-2">
          {BRAND_METRICS.map((b) => (
            <div
              key={b.brand}
              className="rounded-2xl bg-[#fafafa] p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-[#171717]/70">{b.brand}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <span>Avg RM {b.avgPrice.toFixed(1)}</span>
                <span>·</span>
                <span>{b.menuCount} items</span>
                <span>·</span>
                <span>{b.storeCount} stores</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bar comparison: avg price */}
        <div className="rounded-2xl bg-[#fafafa] p-4 shadow-sm">
          <p
            className="mb-3 text-sm font-medium text-[#171717]"
            style={{ fontFamily: "var(--font-serif-jp), Georgia, serif" }}
          >
            Average item price (RM)
          </p>
          <div className="flex flex-col gap-2">
            {BRAND_METRICS.map((b) => (
              <div key={b.brand} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-[#171717]/70">{b.brand}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eee]">
                  <div
                    className="h-full rounded-full bg-[#e8a598]/80"
                    style={{ width: `${(b.avgPrice / 14) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-medium">{b.avgPrice}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 items per brand */}
        <div className="rounded-2xl bg-[#fafafa] p-4 shadow-sm">
          <p
            className="mb-3 text-sm font-medium text-[#171717]"
            style={{ fontFamily: "var(--font-serif-jp), Georgia, serif" }}
          >
            Top items (preview)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(TOP_ITEMS).map(([brand, items]) => (
              <div key={brand}>
                <p className="text-xs font-medium text-[#171717]/70">{brand}</p>
                <p className="text-xs text-[#171717]/60">
                  {items.slice(0, 5).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
