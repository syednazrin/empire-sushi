'use client';

import { useEffect, useRef, useState } from 'react';
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

const EMPIRE_NEON_RED = '#ff1744';
const MARKER_SIZE_EMPIRE = 24;
const MARKER_SIZE_OTHER = 16;

export default function Slide2() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [stores, setStores] = useState<{ name: string; address: string; lat: number; lng: number; brand: string }[]>([]);
  const [enriched, setEnriched] = useState<{ brand: string; state?: string; stateName?: string; district?: string }[]>([]);
  const [choroplethGeoJSON, setChoroplethGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [metric, setMetric] = useState('Population (k)');
  const [panelInView, setPanelInView] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('Empire Sushi');
  type ChartId = 'pie' | 'bar' | 'radar';
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
      center: [101.69, 4.2],
      zoom: 6,
      attributionControl: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      const m = map.current;
      if (!m) return;

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
        el.style.backgroundColor = isEmpire ? EMPIRE_NEON_RED : BRAND_COLORS[store.brand] || '#999';
        el.style.border = '3px solid #fff';
        el.style.boxShadow = isEmpire ? '0 0 16px #ff1744, 0 0 28px rgba(255,23,68,0.6)' : '0 2px 6px rgba(0,0,0,0.5)';
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

  const filteredEnriched = selectedBrand === 'All Brands' ? enriched : enriched.filter((s) => s.brand === selectedBrand);

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
  const barData = Object.entries(byDistrict)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([district, count]) => ({ district: district.length > 14 ? district.slice(0, 14) + '…' : district, count }));

  const allBrands = Array.from(new Set(stores.map((s) => s.brand))).sort((a, b) => a === 'Empire Sushi' ? -1 : b === 'Empire Sushi' ? 1 : a.localeCompare(b));

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
                          backgroundColor: isEmpire ? EMPIRE_NEON_RED : BRAND_COLORS[brand] || '#999',
                          boxShadow: isEmpire ? '0 0 10px #ff1744' : '0 1px 3px rgba(0,0,0,0.25)',
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
        </div>
      </div>

      <div
        ref={panelRef}
        className={`w-1/2 h-screen overflow-y-auto p-5 lg:p-6 flex flex-col gap-5 transition-all duration-700 ${panelInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl lg:text-3xl text-[#1a1a1a] tracking-tight">Spatial &amp; brand analytics</h2>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-sm font-sans bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 font-medium focus:ring-2 focus:ring-[var(--accent-coral)] focus:outline-none cursor-pointer"
            >
              <option value="All Brands">All Brands</option>
              {allBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 font-light">Store counts by state and district (filtered by brand)</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpandedChart('pie')}
          onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('pie')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
        >
          <h3 className="font-serif text-base text-[#1a1a1a] mb-3">Market share by brand</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'Empire Sushi' ? EMPIRE_NEON_RED : entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'Stores']} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">Click to enlarge</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpandedChart('bar')}
          onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('bar')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
        >
          <h3 className="font-serif text-base text-[#1a1a1a] mb-3">Stores per district (top 12)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" stroke="#999" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="district" width={90} tick={{ fontSize: 10 }} stroke="#999" />
              <Tooltip />
              <Bar dataKey="count" fill={EMPIRE_NEON_RED} radius={[0, 4, 4, 0]} name="Stores" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">Click to enlarge</p>
        </div>

        {radarData.length > 0 && brands.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setExpandedChart('radar')}
            onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('radar')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
          >
            <h3 className="font-serif text-base text-[#1a1a1a] mb-3">Store count by brand across states</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e5e5" />
                <PolarAngleAxis dataKey="state" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                {brands.map((b, i) => (
                  <Radar
                    key={b}
                    name={b}
                    dataKey={b}
                    stroke={b === 'Empire Sushi' ? EMPIRE_NEON_RED : BRAND_COLORS[b] || '#888'}
                    fill={b === 'Empire Sushi' ? EMPIRE_NEON_RED : BRAND_COLORS[b] || '#888'}
                    fillOpacity={b === 'Empire Sushi' ? 0.45 : 0.2}
                    strokeWidth={b === 'Empire Sushi' ? 2.5 : 1}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">Click to enlarge</p>
          </div>
        )}

        <div className="bg-[#fff5f2] rounded-2xl p-3 border border-[#ffb4a2]/30">
          <p className="text-xs font-medium text-[#ff1744] uppercase tracking-wider mb-1">Focus brand</p>
          <p className="text-xs text-gray-700 font-light">
            <strong className="text-[#ff1744]">Empire Sushi</strong> is highlighted on the map with a neon red, blinking marker (larger than other brands). Analytics above use store counts from the map. Use the choropleth dropdown to compare district-level Population, Income per capita, or Income.
          </p>
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
                {expandedChart === 'bar' && 'Stores per District (Top 12)'}
                {expandedChart === 'radar' && 'Store Count by Brand Across States'}
              </h3>
              <button
                type="button"
                onClick={() => setExpandedChart(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)]"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.name === 'Empire Sushi' ? EMPIRE_NEON_RED : entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Stores']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'bar' && (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" stroke="#999" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} stroke="#999" />
                    <Tooltip />
                    <Bar dataKey="count" fill={EMPIRE_NEON_RED} radius={[0, 6, 6, 0]} name="Stores" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'radar' && radarData.length > 0 && brands.length > 0 && (
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e5e5" />
                    <PolarAngleAxis dataKey="state" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    {brands.map((b) => (
                      <Radar
                        key={b}
                        name={b}
                        dataKey={b}
                        stroke={b === 'Empire Sushi' ? EMPIRE_NEON_RED : BRAND_COLORS[b] || '#888'}
                        fill={b === 'Empire Sushi' ? EMPIRE_NEON_RED : BRAND_COLORS[b] || '#888'}
                        fillOpacity={b === 'Empire Sushi' ? 0.45 : 0.2}
                        strokeWidth={b === 'Empire Sushi' ? 2.5 : 1}
                      />
                    ))}
                    <Legend />
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
