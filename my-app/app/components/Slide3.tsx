'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Radar as RadarIcon, MapPin, AlertCircle, X, Search } from 'lucide-react';
import { competitiveAreas, topContestedStores, isTier1District, circlePolygon } from '../utils/geo';
import type { StoreWithCoord } from '../utils/geo';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibXNoYW1pIiwiYSI6ImNtMGljY28zMzBqZGsycXF4MGppdmE0bWUifQ.nWArfpCw78mToZi2cN-e8w';

const CHOROPLETH_METRICS = [
  { value: 'Population (k)', label: 'Population (k)' },
  { value: 'Income per capita', label: 'Income per Capita' },
  { value: 'Income', label: 'Income' },
];

const BRAND_COLORS: { [key: string]: string } = {
  'Empire Sushi': '#ff1744',
  'Sushi Mentai': '#6b9b8a',
  'Sushi King': '#8a9b6b',
  'Nippon Sushi': '#9b8a6b',
  'Family Mart': '#a88b9c',
  'Sushi Zanmai': '#7a9ba8',
  'Sushi Jiro': '#9b7a8a',
  'Sushi Plus': '#8a7a9b',
};

const EMPIRE_RED = '#c62828';
const MARKER_SIZE_EMPIRE = 24;
const MARKER_SIZE_OTHER = 16;

const MALAYSIA_BOUNDS: [[number, number], [number, number]] = [
  [99.5, 0.8],
  [120, 7.4],
];

export default function Slide3() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [stores, setStores] = useState<{ name: string; address: string; lat: number; lng: number; brand: string }[]>([]);
  const [enriched, setEnriched] = useState<{ brand: string; state?: string; stateName?: string; district?: string }[]>([]);
  const [choroplethGeoJSON, setChoroplethGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [metric, setMetric] = useState('Population (k)');
  const [panelInView, setPanelInView] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('Empire Sushi');
  const [showConflictZones, setShowConflictZones] = useState(false);
  const [highlightClusters, setHighlightClusters] = useState(false);
  const [districtCount, setDistrictCount] = useState(12);
  const [districtSearch, setDistrictSearch] = useState('');
  const [contestedSearch, setContestedSearch] = useState('');
  type ChartId = 'pie' | 'bar' | 'state-bar' | 'performance-radar';
  const [expandedChart, setExpandedChart] = useState<ChartId | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then(setStores)
      .catch(() => setStores([]));
    fetch('/api/stores-enriched')
      .then((r) => r.json())
      .then((data) => setEnriched(data))
      .catch(() => setEnriched([]));
  }, []);

  useEffect(() => {
    fetch(`/api/district-choropleth?metric=${encodeURIComponent(metric)}`)
      .then((r) => r.json())
      .then((data) => setChoroplethGeoJSON(data))
      .catch(() => setChoroplethGeoJSON(null));
  }, [metric]);

  useEffect(() => {
    if (!mapContainer.current) return;
    const container = mapContainer.current;

    map.current = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      bounds: new mapboxgl.LngLatBounds(MALAYSIA_BOUNDS[0], MALAYSIA_BOUNDS[1]),
      fitBoundsOptions: { padding: 40, maxZoom: 8 },
      attributionControl: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      const m = map.current;
      if (!m) return;

      m.fitBounds(new mapboxgl.LngLatBounds(MALAYSIA_BOUNDS[0], MALAYSIA_BOUNDS[1]), { padding: 40, maxZoom: 8, duration: 0 });

      m.addSource('state-borders', {
        type: 'geojson',
        data: '/State and District Border/malaysia.state.geojson',
      });
      m.addLayer({
        id: 'state-outline',
        type: 'line',
        source: 'state-borders',
        paint: { 'line-color': '#888', 'line-width': 1.5 },
      });

      m.addSource('district-borders', {
        type: 'geojson',
        data: '/State and District Border/malaysia.district-jakim.geojson',
      });
      m.addLayer({
        id: 'district-outline',
        type: 'line',
        source: 'district-borders',
        paint: { 'line-color': '#ccc', 'line-width': 0.75 },
      });
    });

    return () => {
      markersRef.current.forEach((mrk) => mrk.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !stores.length) return;

    const addMarkers = () => {
      markersRef.current.forEach((mrk) => mrk.remove());
      markersRef.current = [];
      const lngs = stores.map((s) => s.lng);
      const lats = stores.map((s) => s.lat);
      
      // Add non-Empire markers first, then Empire so Empire is on top
      const nonEmpireStores = stores.filter((s) => s.brand !== 'Empire Sushi');
      const empireStores = stores.filter((s) => s.brand === 'Empire Sushi');
      const sortedStores = [...nonEmpireStores, ...empireStores];

      sortedStores.forEach((store) => {
        const isEmpire = store.brand === 'Empire Sushi';
        const size = isEmpire ? MARKER_SIZE_EMPIRE : MARKER_SIZE_OTHER;
        const el = document.createElement('div');
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '50%';
        el.style.backgroundColor = isEmpire ? EMPIRE_RED : BRAND_COLORS[store.brand] || '#999';
        el.style.border = '3px solid #fff';
        el.style.boxShadow = isEmpire ? '0 2px 8px rgba(0,0,0,0.35)' : '0 2px 6px rgba(0,0,0,0.5)';
        el.style.cursor = 'pointer';
        el.style.opacity = '1';

        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="padding:8px 12px;font-size:12px;min-width:160px;"><strong>${store.brand}</strong><br/>${store.name}<br/><span style="color:#666">${store.address || ''}</span></div>`
        );

        const marker = new mapboxgl.Marker(el)
          .setLngLat([store.lng, store.lat])
          .setPopup(popup)
          .addTo(m);
        markersRef.current.push(marker);
      });
      if (lngs.length > 0 && lats.length > 0) {
        const bounds = new mapboxgl.LngLatBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
        );
        m.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 1000 });
      }
    };

    if (m.loaded()) {
      addMarkers();
    } else {
      m.once('load', addMarkers);
    }
  }, [stores]);

  useEffect(() => {
    const m = map.current;
    if (!m || !choroplethGeoJSON || !m.getSource) return;
    if (m.getLayer('choropleth-fill')) m.removeLayer('choropleth-fill');
    if (m.getSource('choropleth')) m.removeSource('choropleth');
    m.addSource('choropleth', { type: 'geojson', data: choroplethGeoJSON });
    const beforeId = m.getLayer('state-outline') ? 'state-outline' : undefined;
    m.addLayer(
      {
        id: 'choropleth-fill',
        type: 'fill',
        source: 'choropleth',
        paint: {
          'fill-color': ['get', '_fill'],
          'fill-opacity': 0.5,
        },
      },
      beforeId
    );
  }, [choroplethGeoJSON]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => setPanelInView(e.isIntersecting),
      { threshold: 0.2, rootMargin: '0px' }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const byBrand = stores.reduce<{ [key: string]: number }>((acc, s) => {
    acc[s.brand] = (acc[s.brand] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(byBrand).map(([name, value]) => ({ name, value, fill: BRAND_COLORS[name] || '#888' }));

  const isGeneral = selectedBrand === 'General';
  const filteredEnriched = isGeneral ? enriched : enriched.filter((s) => s.brand === selectedBrand);

  const byState = filteredEnriched.reduce<{ [key: string]: { [key: string]: number } }>((acc, s) => {
    const state = s.stateName || s.state || 'Unknown';
    if (!acc[state]) acc[state] = {};
    acc[state][s.brand] = (acc[state][s.brand] || 0) + 1;
    return acc;
  }, {});
  const brands = Array.from(new Set(filteredEnriched.map((s) => s.brand)));
  const radarData = Object.entries(byState).slice(0, 8).map(([state, counts]) => {
    const obj: { [key: string]: string | number } = { state: state.length > 12 ? state.slice(0, 12) + '…' : state };
    brands.forEach((b) => (obj[b] = counts[b] || 0));
    return obj;
  });

  const byDistrict = filteredEnriched.reduce<{ [key: string]: number }>((acc, s) => {
    const d = s.district || 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const districtDataFull = Object.entries(byDistrict)
    .sort((a, b) => b[1] - a[1])
    .map(([district, count]) => ({ district, count }));
  const barData = districtDataFull
    .slice(0, districtCount)
    .map(({ district, count }) => ({ district: district.length > 14 ? district.slice(0, 14) + '…' : district, count }));

  const allBrands = Array.from(new Set(stores.map((s) => s.brand))).sort((a, b) => a === 'Empire Sushi' ? -1 : b === 'Empire Sushi' ? 1 : a.localeCompare(b));

  const storesWithCoord: StoreWithCoord[] = useMemo(() => {
    const byKey = new Map<string, StoreWithCoord>();
    stores.forEach((s) => byKey.set(`${s.lng}-${s.lat}-${s.brand}`, { ...s }));
    enriched.forEach((e: { brand: string; state?: string; stateName?: string; district?: string; lat?: number; lng?: number; name?: string; address?: string }) => {
      const key = `${e.lng}-${e.lat}-${e.brand}`;
      const existing = byKey.get(key);
      if (existing) byKey.set(key, { ...existing, state: e.state, stateName: e.stateName, district: e.district });
      else if (e.lat != null && e.lng != null) byKey.set(key, { name: e.name ?? '', address: e.address ?? '', lat: e.lat, lng: e.lng, brand: e.brand, state: e.state, stateName: e.stateName, district: e.district });
    });
    return Array.from(byKey.values());
  }, [stores, enriched]);

  const { count: competitiveAreasCount, conflictCoords } = useMemo(
    () => competitiveAreas(storesWithCoord),
    [storesWithCoord]
  );

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const apply = () => {
      if (!m?.getSource) return;
      if (m.getLayer('conflict-zones-fill')) m.removeLayer('conflict-zones-fill');
      if (m.getSource('conflict-zones')) m.removeSource('conflict-zones');
      if (showConflictZones && conflictCoords.length > 0) {
        const features = conflictCoords.map((c) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [circlePolygon(c.lng, c.lat, 1)],
          },
        }));
        m.addSource('conflict-zones', { type: 'geojson', data: { type: 'FeatureCollection', features } });
        m.addLayer({
          id: 'conflict-zones-fill',
          type: 'fill',
          source: 'conflict-zones',
          paint: { 'fill-color': '#ff6b4a', 'fill-opacity': 0.2 },
        });
      }
    };

    if (m.isStyleLoaded()) {
      apply();
    } else {
      m.once('load', apply);
    }
  }, [showConflictZones, conflictCoords]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const apply = () => {
      if (!m?.getSource) return;
      if (m.getLayer('cluster-highlight-fill')) m.removeLayer('cluster-highlight-fill');
      if (m.getSource('cluster-highlight')) m.removeSource('cluster-highlight');
      if (highlightClusters && conflictCoords.length > 0) {
        const features = conflictCoords.map((c) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [circlePolygon(c.lng, c.lat, 1)],
          },
        }));
        m.addSource('cluster-highlight', { type: 'geojson', data: { type: 'FeatureCollection', features } });
        m.addLayer({
          id: 'cluster-highlight-fill',
          type: 'fill',
          source: 'cluster-highlight',
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.35 },
        });
      }
    };

    if (m.isStyleLoaded()) {
      apply();
    } else {
      m.once('load', apply);
    }
  }, [highlightClusters, conflictCoords]);

  const contestedStores = useMemo(() => topContestedStores(storesWithCoord, 5), [storesWithCoord]);

  const stateBarData = useMemo(() => {
    const byStateBrand = enriched.reduce<{ [state: string]: { [brand: string]: number } }>((acc, s) => {
      const state = s.stateName || s.state || 'Unknown';
      if (!acc[state]) acc[state] = {};
      acc[state][s.brand] = (acc[state][s.brand] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(byStateBrand)
      .map(([state, counts]) => ({ state: state.length > 12 ? state.slice(0, 12) + '…' : state, count: counts[selectedBrand] || 0 }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [enriched, selectedBrand]);

  const allDistricts = useMemo(() => Array.from(new Set(enriched.map((e) => e.district).filter(Boolean))), [enriched]);
  const brandDistricts = useMemo(() => new Set(enriched.filter((e) => e.brand === selectedBrand).map((e) => e.district).filter(Boolean)), [enriched, selectedBrand]);
  const maxStoresBrand = Math.max(...Object.values(byBrand), 1);
  const brandStoresCount = byBrand[selectedBrand] || 0;
  const brandEnriched = enriched.filter((e) => e.brand === selectedBrand);
  const urbanCount = brandEnriched.filter((e) => isTier1District(e.district)).length;
  const brandInCompetitiveAreas = useMemo(
    () => conflictCoords.filter((c) => {
      const brandStore = storesWithCoord.find((s) => s.brand === selectedBrand && s.lng === c.lng && s.lat === c.lat);
      return !!brandStore;
    }).length,
    [conflictCoords, storesWithCoord, selectedBrand]
  );
  const brandPerformanceData = useMemo(() => {
    const penetration = allDistricts.length > 0 ? (brandDistricts.size / allDistricts.length) * 100 : 0;
    const accessibility = maxStoresBrand > 0 ? (brandStoresCount / maxStoresBrand) * 100 : 0;
    const urbanDominance = brandStoresCount > 0 ? (urbanCount / brandStoresCount) * 100 : 0;
    const clutter = brandStoresCount > 0 ? (brandInCompetitiveAreas / brandStoresCount) * 100 : 0;
    return [
      { metric: 'Accessibility', value: Math.round(accessibility), fullMark: 100 },
      { metric: 'Market Penetration', value: Math.round(penetration), fullMark: 100 },
      { metric: 'Urban Dominance', value: Math.round(urbanDominance), fullMark: 100 },
      { metric: 'Clutter Score', value: Math.round(Math.min(clutter, 100)), fullMark: 100 },
    ];
  }, [selectedBrand, brandStoresCount, maxStoresBrand, brandDistricts.size, allDistricts.length, urbanCount, brandInCompetitiveAreas]);

  const marketGapDistricts = useMemo(() => {
    const byDistrictAll = enriched.reduce<{ [d: string]: { [b: string]: number } }>((acc, s) => {
      const d = s.district || '';
      if (!d) return acc;
      if (!acc[d]) acc[d] = {};
      acc[d][s.brand] = (acc[d][s.brand] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(byDistrictAll)
      .filter(([, counts]) => !counts[selectedBrand] && Object.keys(counts).length > 0)
      .map(([district, counts]) => ({ district, totalCompetitors: Object.values(counts).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.totalCompetitors - a.totalCompetitors)
      .slice(0, 3);
  }, [enriched, selectedBrand]);

  const nationalAvgStoresPerDistrict = allDistricts.length > 0 ? stores.length / allDistricts.length : 0;
  const brandAvgStoresPerDistrict = brandDistricts.size > 0 ? brandStoresCount / brandDistricts.size : 0;
  const saturationScore = nationalAvgStoresPerDistrict > 0 ? Math.min(100, Math.round((brandAvgStoresPerDistrict / nationalAvgStoresPerDistrict) * 50)) : 0;

  return (
    <section className="slide relative min-h-screen w-full flex bg-[var(--bg-cream)] overflow-hidden">
      <div className="w-1/2 h-screen relative" style={{ minHeight: '100vh' }}>
        <div
          ref={mapContainer}
          className="absolute inset-0 w-full h-full"
          style={{ minHeight: '100vh' }}
        />
        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/80">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Store locations</p>
            <div className="flex flex-col gap-2">
              {Array.from(new Set(stores.map((s) => s.brand)))
                .sort((a, b) => (a === 'Empire Sushi' ? -1 : b === 'Empire Sushi' ? 1 : a.localeCompare(b)))
                .map((brand) => {
                  const isEmpire = brand === 'Empire Sushi';
                  const count = stores.filter((s) => s.brand === brand).length;
                  return (
                    <div key={brand} className="flex items-center gap-2">
                      <span
                        className="inline-block rounded-full border-2 border-white flex-shrink-0"
                        style={{
                          width: isEmpire ? 16 : 13,
                          height: isEmpire ? 16 : 13,
                          backgroundColor: isEmpire ? EMPIRE_RED : BRAND_COLORS[brand] || '#999',
                          boxShadow: isEmpire ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.25)',
                        }}
                      />
                      <span className="text-sm font-medium text-gray-800">{brand}</span>
                      <span className="text-xs text-gray-500 ml-auto">({count})</span>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-3 border border-white/80">
            <label className="text-xs font-medium text-gray-500 block mb-1">Choropleth metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="text-sm font-sans bg-transparent border-0 text-gray-800 font-medium focus:ring-0 focus:outline-none cursor-pointer w-full"
            >
              {CHOROPLETH_METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <label className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-3 border border-white/80 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={highlightClusters}
              onChange={(e) => setHighlightClusters(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-xs font-medium text-gray-700">Highlight competitive clusters</span>
          </label>
        </div>
      </div>

      <div
        ref={panelRef}
        className={`slide3-panel w-1/2 h-screen overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 transition-all duration-700 bg-[#f9fafb] ${panelInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-xl lg:text-2xl text-[#1a1a1a] tracking-tight">Spatial &amp; brand analytics</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-sm font-sans bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-gray-800 font-medium focus:ring-2 focus:ring-[var(--accent-coral)] focus:outline-none cursor-pointer"
            >
              {allBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left column: General + chart widgets (filled – same widgets as before, shared across columns for balance) */}
          <div className="flex flex-col gap-4 min-h-0">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('pie')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('pie')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
            >
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[var(--accent-coral)]" />
                Market share by brand
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.name === 'Empire Sushi' ? EMPIRE_RED : entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Stores']} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>

            {/* Store count by state */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('state-bar')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('state-bar')}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
            >
              <h3 className="font-serif text-xs text-[#1a1a1a] mb-1.5 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-coral)] shrink-0" />
                <span className="truncate">Store count by state ({selectedBrand})</span>
              </h3>
              <div className="aspect-square w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateBarData} layout="vertical" margin={{ left: 4, right: 4, top: 0, bottom: 0 }}>
                    <XAxis type="number" stroke="#999" tick={{ fontSize: 7 }} />
                    <YAxis type="category" dataKey="state" width={44} tick={{ fontSize: 6 }} stroke="#999" />
                    <Tooltip />
                    <Bar dataKey="count" fill={BRAND_COLORS[selectedBrand] || EMPIRE_RED} radius={[0, 3, 3, 0]} name="Stores" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>

            {/* Stores per district */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2">Stores per district</h3>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="range"
                  min={5}
                  max={Math.max(5, Math.min(50, districtDataFull.length))}
                  value={districtCount}
                  onChange={(e) => setDistrictCount(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none bg-gray-200 accent-[var(--accent-coral)]"
                />
                <span className="text-xs font-medium text-gray-600 tabular-nums">Top {districtCount}</span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                <ResponsiveContainer width="100%" height={Math.max(60, Math.min(160, districtDataFull.slice(0, districtCount).length * 20))}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" stroke="#999" tick={{ fontSize: 8 }} />
                    <YAxis type="category" dataKey="district" width={70} tick={{ fontSize: 7 }} stroke="#999" />
                    <Tooltip />
                    <Bar dataKey="count" fill={BRAND_COLORS[selectedBrand] || EMPIRE_RED} radius={[0, 3, 3, 0]} name="Stores" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Brand performance radar */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('performance-radar')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('performance-radar')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
            >
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2 flex items-center gap-2">
                <RadarIcon className="w-4 h-4 text-[var(--accent-coral)]" />
                Brand performance metrics
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={brandPerformanceData}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 7 }} />
                  <Radar name={selectedBrand} dataKey="value" stroke={BRAND_COLORS[selectedBrand] || EMPIRE_RED} fill={BRAND_COLORS[selectedBrand] || EMPIRE_RED} fillOpacity={0.4} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>
          </div>

          {/* Right column: Competitive insights, market gap, saturation, proximity, focus */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Competitive Areas + Show Conflict Zones */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--accent-coral)]" />
                Count of competitive areas
              </h3>
              <p className="text-2xl font-bold text-[#1a1a1a] tabular-nums">{competitiveAreasCount}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Store locations with ≥1 competitor within 1 km</p>
              <button
                type="button"
                onClick={() => setShowConflictZones((v) => !v)}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-[#fff5f2] text-[var(--accent-coral)] border border-[#ffb4a2]/50 hover:bg-[#ffebe6] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {showConflictZones ? 'Hide conflict zones' : 'Show conflict zones'}
              </button>
            </div>

            {/* Market gap */}
            {marketGapDistricts.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-serif text-sm text-[#1a1a1a] mb-2">Market gap (expansion potential)</h3>
                <p className="text-[10px] text-gray-500 mb-2">Top districts with zero {selectedBrand} presence but high competitor presence</p>
                <ul className="space-y-1">
                  {marketGapDistricts.map(({ district, totalCompetitors }) => (
                    <li key={district} className="flex justify-between text-xs">
                      <span className="text-gray-800 truncate">{district}</span>
                      <span className="text-gray-500 tabular-nums">{totalCompetitors} competitors</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Saturation score */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2">Saturation score</h3>
              <p className="text-[10px] text-gray-500 mb-1">Crowdedness of {selectedBrand} locations vs national average</p>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-coral)] transition-all duration-300"
                  style={{ width: `${saturationScore}%` }}
                />
              </div>
              <p className="text-xs font-medium text-gray-600 mt-1">{saturationScore}%</p>
            </div>

            {/* Proximity table – top 5 contested */}
            {contestedStores.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-serif text-sm text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[var(--accent-coral)]" />
                  Top 5 most contested stores
                </h3>
                <input
                  type="text"
                  placeholder="Search address..."
                  value={contestedSearch}
                  onChange={(e) => setContestedSearch(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mb-2 focus:ring-2 focus:ring-[var(--accent-coral)] focus:outline-none"
                />
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {contestedStores
                    .filter(({ store }) => !contestedSearch || store.address.toLowerCase().includes(contestedSearch.toLowerCase()))
                    .map(({ store, competitorCount }) => (
                      <div key={`${store.lng}-${store.lat}`} className="text-[10px] p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="font-medium text-gray-800 truncate">{store.address || store.name}</p>
                        <p className="text-gray-500">({store.lat.toFixed(4)}, {store.lng.toFixed(4)}) · {competitorCount} competitors within 1 km</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="bg-[#fff5f2] rounded-xl p-3 border border-[#ffb4a2]/30">
              <p className="text-[10px] font-medium text-[#c62828] uppercase tracking-wider mb-1">Focus brand</p>
              <p className="text-[10px] text-gray-700 font-light">
                <strong className="text-[#c62828]">{selectedBrand}</strong> is highlighted on the map. Use the choropleth dropdown to compare district-level Population, Income per capita, or Income.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded chart overlay */}
      {expandedChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setExpandedChart(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged chart"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h3 className="font-serif text-xl text-[#1a1a1a]">
                {expandedChart === 'pie' && 'Market Share by Brand'}
                {expandedChart === 'bar' && `Stores per District (Top ${districtCount})`}
                {expandedChart === 'state-bar' && `Store Count by State (${selectedBrand})`}
                {expandedChart === 'performance-radar' && `Brand Performance (${selectedBrand})`}
              </h3>
              <button
                type="button"
                onClick={() => setExpandedChart(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)]"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6" style={{ minHeight: '60vh' }}>
              {expandedChart === 'pie' && (
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.name === 'Empire Sushi' ? EMPIRE_RED : entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Stores']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'bar' && (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" stroke="#999" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} stroke="#999" />
                    <Tooltip />
                    <Bar dataKey="count" fill={BRAND_COLORS[selectedBrand] || EMPIRE_RED} radius={[0, 6, 6, 0]} name="Stores" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'state-bar' && (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={stateBarData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" stroke="#999" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="state" width={100} tick={{ fontSize: 11 }} stroke="#999" />
                    <Tooltip />
                    <Bar dataKey="count" fill={BRAND_COLORS[selectedBrand] || EMPIRE_RED} radius={[0, 6, 6, 0]} name="Stores" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'performance-radar' && (
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={brandPerformanceData}>
                    <PolarGrid stroke="#e5e5e5" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name={selectedBrand} dataKey="value" stroke={BRAND_COLORS[selectedBrand] || EMPIRE_RED} fill={BRAND_COLORS[selectedBrand] || EMPIRE_RED} fillOpacity={0.4} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
