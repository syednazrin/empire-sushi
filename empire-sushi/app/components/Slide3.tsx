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
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Radar as RadarIcon, MapPin, AlertCircle, X, Search, Building2, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { competitiveAreas, topContestedStores, isTier1District, circlePolygon } from '../utils/geo';
import type { StoreWithCoord } from '../utils/geo';

// All tiles/styles are fetched via /api/mapbox-proxy (server adds real token)
// No token needed on client side
mapboxgl.accessToken = 'pk.proxy';

type DistrictData = {
  state: string[];
  district: string[];
  date: string[];
  sex: string[];
  age: string[];
  ethnicity: string[];
  population: number[];
};

const CHOROPLETH_METRICS = [
  { value: 'Population (k)', label: 'Population (k)' },
  { value: 'Income per capita', label: 'Income per Capita' },
  { value: 'Income', label: 'Income' },
];

const BRAND_COLORS: { [key: string]: string } = {
  'Aeon': '#2563eb',
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
  const [enriched, setEnriched] = useState<{ brand: string; state?: string; stateName?: string; district?: string; inMall?: boolean }[]>([]);
  const [choroplethGeoJSON, setChoroplethGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [metric, setMetric] = useState('Population (k)');
  const [panelInView, setPanelInView] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('Empire Sushi');
  const [showConflictZones, setShowConflictZones] = useState(false);
  const [highlightClusters, setHighlightClusters] = useState(false);
  const [districtCount, setDistrictCount] = useState(12);
  const [districtSearch, setDistrictSearch] = useState('');
  const [contestedSearch, setContestedSearch] = useState('');
  type ChartId = 'pie' | 'bar' | 'state-bar' | 'performance-radar' | 'competitive-areas' | 'mall-presence' | 'market-gap' | 'saturation' | 'contested-stores' | 'focus-brand' | 'district-trend' | 'district-ethnicity-pie' | 'district-age' | 'demographics-growth' | 'demographics-growth-competitors' | 'demographics-halal' | 'demographics-female-genz' | 'demographics-market-potential';
  const [expandedChart, setExpandedChart] = useState<ChartId | null>(null);
  const expandableClass = 'cursor-pointer hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2';
  const panelRef = useRef<HTMLDivElement>(null);
  
  // New state for district demographics
  const [activeTab, setActiveTab] = useState<'analytics' | 'demographics'>('analytics');
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [demographicMetric, setDemographicMetric] = useState<'genz' | 'growth' | 'chinese_pct' | 'malay_pct' | 'sushi_gap'>('genz');
  const [districtGeoJSON, setDistrictGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [mapLegendCollapsed, setMapLegendCollapsed] = useState(false);
  
  // High-growth districts data
  type GrowthDistrictData = {
    district: string;
    pop2020: number;
    pop2024: number;
    growthPct: number;
    absoluteGrowth: number;
    empireCount: number;
    sushiKingCount: number;
    familyMartCount: number;
    sushiZanmaiCount: number;
    sushiJiroCount: number;
    sushiPlusCount: number;
    totalCompetitors: number;
  };
  const [growthDistricts, setGrowthDistricts] = useState<GrowthDistrictData[]>([]);

  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then(setStores)
      .catch(() => setStores([]));
    fetch('/api/stores-enriched')
      .then((r) => r.json())
      .then((data) => setEnriched(data))
      .catch(() => setEnriched([]));
    // Load district demographic data
    fetch('/District Dosm Data/json files/simplified_district_data.json')
      .then((r) => r.json())
      .then((data: DistrictData) => setDistrictData(data))
      .catch(() => setDistrictData(null));
    // Load district GeoJSON
    fetch('/State and District Border/malaysia.district-jakim.geojson')
      .then((r) => r.json())
      .then((data) => setDistrictGeoJSON(data))
      .catch(() => setDistrictGeoJSON(null));
    // Load district growth analysis
    fetch('/data/district-growth-analysis.json')
      .then((r) => r.json())
      .then((data: GrowthDistrictData[]) => setGrowthDistricts(data))
      .catch(() => setGrowthDistricts([]));
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
      transformRequest: (url: string) => {
        // Proxy all Mapbox requests through our server; must return absolute URL so Request() parses correctly
        if (url && url.includes('mapbox.com')) {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          return {
            url: `${origin}/api/mapbox-proxy?url=${encodeURIComponent(url)}`,
          };
        }
        return { url: url || '' };
      },
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
      
      // Add click handler for districts
      m.on('click', 'choropleth-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          if (props && props.name_2) {
            setSelectedDistrict(props.name_2);
            setSelectedState(props.name_1 || null);
            setActiveTab('demographics');
          }
        }
      });
      
      // Change cursor on hover
      m.on('mouseenter', 'choropleth-fill', () => {
        if (m.getCanvas()) m.getCanvas().style.cursor = 'pointer';
      });
      m.on('mouseleave', 'choropleth-fill', () => {
        if (m.getCanvas()) m.getCanvas().style.cursor = '';
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

  const mallStats = useMemo(() => {
    const withMall = enriched.filter((e) => e.inMall === true);
    const withoutMall = enriched.filter((e) => e.inMall === false);
    const unknown = enriched.filter((e) => e.inMall === undefined);
    const byBrand: { [brand: string]: { total: number; inMall: number } } = {};
    enriched.forEach((e) => {
      if (!byBrand[e.brand]) byBrand[e.brand] = { total: 0, inMall: 0 };
      byBrand[e.brand].total += 1;
      if (e.inMall === true) byBrand[e.brand].inMall += 1;
    });
    const totalKnown = withMall.length + withoutMall.length;
    return {
      inMallCount: withMall.length,
      notInMallCount: withoutMall.length,
      unknownCount: unknown.length,
      totalKnown,
      pctInMall: totalKnown > 0 ? Math.round((withMall.length / totalKnown) * 100) : 0,
      byBrand,
    };
  }, [enriched]);

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
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.2 },
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
    const totalBrand = byBrand[selectedBrand] || 0;
    const byStateBrand = enriched.reduce<{ [state: string]: { [brand: string]: number } }>((acc, s) => {
      const state = s.stateName || s.state || 'Unknown';
      if (!acc[state]) acc[state] = {};
      acc[state][s.brand] = (acc[state][s.brand] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(byStateBrand)
      .map(([state, counts]) => {
        const count = counts[selectedBrand] || 0;
        const pct = totalBrand > 0 ? (count / totalBrand) * 100 : 0;
        return {
          state: state.length > 12 ? state.slice(0, 12) + '…' : state,
          stateFull: state,
          count,
          pct,
        };
      })
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [enriched, selectedBrand, byBrand]);

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

  // District demographics analysis
  const districtDemographics = useMemo(() => {
    if (!districtData || !selectedDistrict) return null;
    
    // Filter data for selected district, latest year, overall sex/age/ethnicity
    const indices = districtData.district
      .map((d, i) => ({ d, i }))
      .filter(({ d, i }) => 
        d === selectedDistrict && 
        districtData.date[i] === '2024-01-01' &&
        districtData.sex[i] === 'both'
      )
      .map(({ i }) => i);
    
    if (indices.length === 0) return null;
    
    // Get overall population
    const overallIdx = indices.find(i => 
      districtData.age[i] === 'overall' && 
      districtData.ethnicity[i] === 'overall'
    );
    const totalPop = overallIdx !== undefined ? districtData.population[overallIdx] : 0;
    
    // Get ethnicity breakdown
    const ethnicityData = indices
      .filter(i => districtData.age[i] === 'overall' && districtData.ethnicity[i] !== 'overall')
      .map(i => ({
        name: districtData.ethnicity[i].replace('bumi_', 'Bumi ').replace('_', ' '),
        value: districtData.population[i],
        pct: totalPop > 0 ? (districtData.population[i] / totalPop * 100) : 0,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
    
    // Get age distribution
    const ageData = indices
      .filter(i => districtData.age[i] !== 'overall' && districtData.ethnicity[i] === 'overall')
      .map(i => ({
        age: districtData.age[i],
        population: districtData.population[i],
      }))
      .sort((a, b) => {
        const order = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '85+'];
        return order.indexOf(a.age) - order.indexOf(b.age);
      });
    
    // Get historical trend (all years, overall)
    const trendData = Array.from(new Set(districtData.date))
      .sort()
      .map(date => {
        const idx = districtData.district.findIndex((d, i) => 
          d === selectedDistrict &&
          districtData.date[i] === date &&
          districtData.sex[i] === 'both' &&
          districtData.age[i] === 'overall' &&
          districtData.ethnicity[i] === 'overall'
        );
        return {
          year: date.substring(0, 4),
          population: idx >= 0 ? districtData.population[idx] : 0,
        };
      })
      .filter(d => d.population > 0);
    
    return {
      totalPop,
      ethnicityData,
      ageData,
      trendData,
      state: selectedState || districtData.state[indices[0]],
    };
  }, [districtData, selectedDistrict, selectedState]);

  // Get all unique districts for dropdown
  const allUniqueDistricts = useMemo(() => {
    if (!districtData) return [];
    return Array.from(new Set(districtData.district)).sort();
  }, [districtData]);

  // Population growth by district (2020 → 2024)
  const districtPopulationGrowth = useMemo(() => {
    if (!districtData) return [];
    const byDistrict: { [key: string]: { pop2020: number; pop2024: number; growthPct: number; state: string } } = {};
    const dates = districtData.date;
    const districts = districtData.district;
    const states = districtData.state;
    const pops = districtData.population;
    const sex = districtData.sex;
    const age = districtData.age;
    const ethnicity = districtData.ethnicity;
    for (let i = 0; i < districts.length; i++) {
      if (sex[i] !== 'both' || age[i] !== 'overall' || ethnicity[i] !== 'overall') continue;
      const d = districts[i];
      if (!byDistrict[d]) byDistrict[d] = { pop2020: 0, pop2024: 0, growthPct: 0, state: states[i] || '' };
      if (dates[i] === '2020-01-01') byDistrict[d].pop2020 = pops[i];
      if (dates[i] === '2024-01-01') byDistrict[d].pop2024 = pops[i];
    }
    return Object.entries(byDistrict)
      .filter(([, v]) => v.pop2020 > 0 && v.pop2024 > 0)
      .map(([district, v]) => ({
        district,
        state: v.state,
        pop2020: v.pop2020,
        pop2024: v.pop2024,
        growthPct: ((v.pop2024 - v.pop2020) / v.pop2020) * 100,
      }))
      .sort((a, b) => b.growthPct - a.growthPct)
      .slice(0, 15);
  }, [districtData]);

  // Gender breakdown by district (2024) and national
  const genderByDistrict = useMemo(() => {
    if (!districtData) return { national: { male: 0, female: 0, total: 0, femalePct: 0 }, byDistrict: [] };
    let nationalMale = 0, nationalFemale = 0;
    const map = new Map<string, { district: string; state: string; male: number; female: number }>();
    const dates = districtData.date;
    const districts = districtData.district;
    const states = districtData.state;
    const pops = districtData.population;
    const sex = districtData.sex;
    const age = districtData.age;
    const ethnicity = districtData.ethnicity;
    for (let i = 0; i < districts.length; i++) {
      if (dates[i] !== '2024-01-01' || age[i] !== 'overall' || ethnicity[i] !== 'overall') continue;
      const d = districts[i];
      const s = sex[i];
      const pop = pops[i];
      if (s === 'male') {
        nationalMale += pop;
        if (!map.has(d)) map.set(d, { district: d, state: states[i] || '', male: 0, female: 0 });
        map.get(d)!.male = pop;
      } else if (s === 'female') {
        nationalFemale += pop;
        if (!map.has(d)) map.set(d, { district: d, state: states[i] || '', male: 0, female: 0 });
        map.get(d)!.female = pop;
      }
    }
    const nationalTotal = nationalMale + nationalFemale;
    const byDistrict = Array.from(map.values())
      .map((r) => ({
        ...r,
        total: r.male + r.female,
        femalePct: r.male + r.female > 0 ? (r.female / (r.male + r.female)) * 100 : 0,
      }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
    return {
      national: { male: nationalMale, female: nationalFemale, total: nationalTotal, femalePct: nationalTotal > 0 ? (nationalFemale / nationalTotal) * 100 : 0 },
      byDistrict,
    };
  }, [districtData]);

  // Compute Gen Z population and primary ethnicity for each district
  const districtGenZData = useMemo(() => {
    if (!districtData || !districtGeoJSON) return null;
    
    const result: {
      [district: string]: {
        genZPop: number;
        totalPop: number;
        genZPct: number;
        primaryEthnicity: string;
        primaryEthnicityPct: number;
        ethnicityColor: string;
      };
    } = {};
    
    const ethnicityColors: { [key: string]: string } = {
      'bumi_malay': '#16a34a',
      'chinese': '#dc2626',
      'indian': '#ea580c',
      'bumi_other': '#0891b2',
      'other_citizen': '#7c3aed',
      'other_noncitizen': '#6b7280',
    };
    
    // Process each district
    const districts = Array.from(new Set(districtData.district));
    
    districts.forEach(district => {
      const districtIndices = districtData.district
        .map((d, i) => ({ d, i }))
        .filter(({ d, i }) => 
          d === district && 
          districtData.date[i] === '2024-01-01' &&
          districtData.sex[i] === 'both'
        )
        .map(({ i }) => i);
      
      if (districtIndices.length === 0) return;
      
      // Get total population
      const totalIdx = districtIndices.find(i => 
        districtData.age[i] === 'overall' && 
        districtData.ethnicity[i] === 'overall'
      );
      const totalPop = totalIdx !== undefined ? districtData.population[totalIdx] : 0;
      
      // Calculate Gen Z population (age 10-29)
      const genZAges = ['10-14', '15-19', '20-24', '25-29'];
      const genZPop = districtIndices
        .filter(i => 
          genZAges.includes(districtData.age[i]) && 
          districtData.ethnicity[i] === 'overall'
        )
        .reduce((sum, i) => sum + districtData.population[i], 0);
      
      // Find primary ethnicity
      const ethnicities = districtIndices
        .filter(i => 
          districtData.age[i] === 'overall' && 
          districtData.ethnicity[i] !== 'overall'
        )
        .map(i => ({
          ethnicity: districtData.ethnicity[i],
          pop: districtData.population[i],
        }))
        .sort((a, b) => b.pop - a.pop);
      
      const primaryEth = ethnicities[0];
      
      result[district] = {
        genZPop,
        totalPop,
        genZPct: totalPop > 0 ? (genZPop / totalPop * 100) : 0,
        primaryEthnicity: primaryEth?.ethnicity || 'unknown',
        primaryEthnicityPct: totalPop > 0 && primaryEth ? (primaryEth.pop / totalPop * 100) : 0,
        ethnicityColor: ethnicityColors[primaryEth?.ethnicity] || '#9ca3af',
      };
    });
    
    return result;
  }, [districtData, districtGeoJSON]);

  // Per-district ethnicity percentages (2024) for concentration indexing
  const districtEthnicityPct = useMemo(() => {
    if (!districtData) return {} as { [district: string]: { state: string; chinesePct: number; malayPct: number; indianPct: number; totalPop: number } };
    const dates = districtData.date;
    const districts = districtData.district;
    const states = districtData.state;
    const pops = districtData.population;
    const sex = districtData.sex;
    const age = districtData.age;
    const ethnicity = districtData.ethnicity;
    const map: { [d: string]: { state: string; chinese: number; malay: number; indian: number; total: number } } = {};
    for (let i = 0; i < districts.length; i++) {
      if (dates[i] !== '2024-01-01' || sex[i] !== 'both' || age[i] !== 'overall') continue;
      const d = districts[i];
      if (!map[d]) map[d] = { state: states[i] || '', chinese: 0, malay: 0, indian: 0, total: 0 };
      const eth = ethnicity[i];
      const pop = pops[i];
      map[d].total += pop;
      if (eth === 'chinese') map[d].chinese += pop;
      else if (eth === 'bumi_malay') map[d].malay += pop;
      else if (eth === 'indian') map[d].indian += pop;
    }
    const out: { [district: string]: { state: string; chinesePct: number; malayPct: number; indianPct: number; totalPop: number } } = {};
    Object.entries(map).forEach(([d, v]) => {
      const t = v.total;
      out[d] = {
        state: v.state,
        totalPop: t,
        chinesePct: t > 0 ? (v.chinese / t) * 100 : 0,
        malayPct: t > 0 ? (v.malay / t) * 100 : 0,
        indianPct: t > 0 ? (v.indian / t) * 100 : 0,
      };
    });
    return out;
  }, [districtData]);

  // Store count per district (from enriched)
  const districtStoreCount = useMemo(() => {
    const count: { [district: string]: number } = {};
    const empireCount: { [district: string]: number } = {};
    enriched.forEach((e) => {
      const d = e.district;
      if (d) {
        count[d] = (count[d] || 0) + 1;
        if (e.brand === 'Empire Sushi') {
          empireCount[d] = (empireCount[d] || 0) + 1;
        }
      }
    });
    return { total: count, empire: empireCount };
  }, [enriched]);

  // Combined investor metrics per district: growth, Gen Z, ethnicity %, store count, sushi gap
  const districtInvestorMetrics = useMemo(() => {
    const growthByDistrict: { [d: string]: number } = {};
    districtPopulationGrowth.forEach((r) => { growthByDistrict[r.district] = r.growthPct; });
    const out: {
      [district: string]: {
        state: string;
        genZPop: number;
        genZPct: number;
        totalPop: number;
        growthPct: number;
        chinesePct: number;
        malayPct: number;
        indianPct: number;
        storeCount: number;
        sushiGap: number; // pop per store (higher = opportunity)
      };
    } = {} as any;
    if (!districtGenZData) return out;
    Object.entries(districtGenZData).forEach(([district, data]) => {
      const storeCount = districtStoreCount.total[district] ?? 0;
      const pop = data.totalPop || 0;
      const eth = districtEthnicityPct[district];
      const stateFromGrowth = districtPopulationGrowth.find((r) => r.district === district)?.state;
      out[district] = {
        state: eth?.state ?? stateFromGrowth ?? '',
        genZPop: data.genZPop,
        genZPct: data.genZPct,
        totalPop: data.totalPop,
        growthPct: growthByDistrict[district] ?? 0,
        chinesePct: eth?.chinesePct ?? 0,
        malayPct: eth?.malayPct ?? 0,
        indianPct: eth?.indianPct ?? 0,
        storeCount,
        sushiGap: storeCount >= 0 ? pop / (storeCount + 1) : pop,
      };
    });
    districtPopulationGrowth.forEach((r) => {
      if (out[r.district]) out[r.district].state = r.state || out[r.district].state;
    });
    return out;
  }, [districtGenZData, districtPopulationGrowth, districtEthnicityPct, districtStoreCount]);

  // Gen Z vs Growth scatter (and bubble) data
  const genZGrowthScatterData = useMemo(() => {
    return Object.entries(districtInvestorMetrics)
      .filter(([, v]) => v.totalPop > 0 && v.growthPct !== undefined)
      .map(([district, v]) => ({
        district,
        state: v.state,
        genZPct: v.genZPct,
        growthPct: v.growthPct,
        genZPop: v.genZPop,
        totalPop: v.totalPop,
      }))
      .sort((a, b) => b.genZPop - a.genZPop);
  }, [districtInvestorMetrics]);

  // Halal opportunity: high Malay % + low store coverage
  const halalOpportunityDistricts = useMemo(() => {
    return Object.entries(districtInvestorMetrics)
      .filter(([, v]) => v.malayPct >= 70 && v.storeCount <= 2 && v.totalPop >= 20)
      .map(([district, v]) => ({ district, state: v.state, malayPct: v.malayPct, storeCount: v.storeCount, totalPop: v.totalPop, sushiGap: v.sushiGap }))
      .sort((a, b) => b.sushiGap - a.sushiGap)
      .slice(0, 15);
  }, [districtInvestorMetrics]);

  // Female Gen Z (10-24) share by district for top 10 by Gen Z pop
  const femaleGenZByDistrict = useMemo(() => {
    if (!districtData) return [];
    const genZAges = ['10-14', '15-19', '20-24'];
    const dates = districtData.date;
    const districts = districtData.district;
    const states = districtData.state;
    const pops = districtData.population;
    const sex = districtData.sex;
    const age = districtData.age;
    const ethnicity = districtData.ethnicity;
    const byDistrict: { [d: string]: { state: string; male: number; female: number } } = {};
    for (let i = 0; i < districts.length; i++) {
      if (dates[i] !== '2024-01-01' || !genZAges.includes(age[i]) || ethnicity[i] !== 'overall') continue;
      const d = districts[i];
      if (!byDistrict[d]) byDistrict[d] = { state: states[i] || '', male: 0, female: 0 };
      if (sex[i] === 'male') byDistrict[d].male += pops[i];
      else if (sex[i] === 'female') byDistrict[d].female += pops[i];
    }
    const withPct = Object.entries(byDistrict)
      .filter(([, v]) => v.male + v.female > 0)
      .map(([district, v]) => ({
        district,
        state: v.state,
        male: v.male,
        female: v.female,
        total: v.male + v.female,
        femalePct: (v.female / (v.male + v.female)) * 100,
        storeCount: districtStoreCount.total[district] ?? 0,
        empireStoreCount: districtStoreCount.empire[district] ?? 0,
      }));
    const topByGenZ = Object.entries(districtGenZData || {})
      .sort((a, b) => b[1].genZPop - a[1].genZPop)
      .slice(0, 10)
      .map(([d]) => d);
    return withPct
      .filter((r) => topByGenZ.includes(r.district))
      .sort((a, b) => topByGenZ.indexOf(a.district) - topByGenZ.indexOf(b.district));
  }, [districtData, districtGenZData, districtStoreCount]);

  // Market potential score (0-100): growth + Gen Z + sushi gap + female Gen Z
  const marketPotentialTopDistricts = useMemo(() => {
    const arr = Object.entries(districtInvestorMetrics)
      .filter(([, v]) => v.totalPop >= 10);
    const growthArr = arr.map(([, v]) => v.growthPct);
    const genZArr = arr.map(([, v]) => v.genZPct);
    const gapArr = arr.map(([, v]) => v.sushiGap);
    const maxG = Math.max(...growthArr, 0.01);
    const maxZ = Math.max(...genZArr, 0.01);
    const maxGap = Math.max(...gapArr, 1);
    const femaleMap: { [d: string]: number } = {};
    femaleGenZByDistrict.forEach((r) => { femaleMap[r.district] = r.femalePct; });
    const scored = arr.map(([district, v]) => {
      const growthNorm = (v.growthPct / maxG) * 100;
      const genZNorm = v.genZPct;
      const gapNorm = (v.sushiGap / maxGap) * 100;
      const femaleNorm = femaleMap[district] ?? 50;
      const score = 0.35 * Math.min(100, growthNorm) + 0.3 * genZNorm + 0.25 * gapNorm + 0.1 * (femaleNorm / 100) * 100;
      return { district, state: v.state, score: Math.round(score), growthPct: v.growthPct, genZPct: v.genZPct, sushiGap: v.sushiGap };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 15);
  }, [districtInvestorMetrics, femaleGenZByDistrict]);

  // Generate demographic choropleth (Gen Z, Growth, Chinese %, Malay %, Sushi gap)
  const demographicChoropleth = useMemo(() => {
    if (!districtGeoJSON || !districtGenZData) return null;
    
    const features = districtGeoJSON.features.map((feature: any) => {
      const districtName = feature.properties.name;
      const data = districtGenZData[districtName];
      const inv = districtInvestorMetrics[districtName];
      
      if (!data) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            _fill: '#e5e7eb',
            _genZPop: 0,
            _primaryEth: 'unknown',
          },
        };
      }
      
      let fillColor = '#e5e7eb';
      
      if (demographicMetric === 'genz') {
        const genZPop = data.genZPop;
        if (genZPop >= 100) fillColor = '#dc2626';
        else if (genZPop >= 50) fillColor = '#f97316';
        else if (genZPop >= 25) fillColor = '#fbbf24';
        else if (genZPop >= 10) fillColor = '#a3e635';
        else fillColor = '#d1d5db';
      } else if (demographicMetric === 'growth') {
        const g = inv?.growthPct ?? 0;
        if (g >= 8) fillColor = '#166534';
        else if (g >= 5) fillColor = '#16a34a';
        else if (g >= 2) fillColor = '#84cc16';
        else if (g >= 0) fillColor = '#e5e7eb';
        else fillColor = '#d1d5db';
      } else if (demographicMetric === 'chinese_pct') {
        const c = inv?.chinesePct ?? 0;
        if (c >= 40) fillColor = '#dc2626';
        else if (c >= 25) fillColor = '#ea580c';
        else if (c >= 15) fillColor = '#eab308';
        else if (c >= 5) fillColor = '#a3e635';
        else fillColor = '#e5e7eb';
      } else if (demographicMetric === 'malay_pct') {
        const m = inv?.malayPct ?? 0;
        if (m >= 80) fillColor = '#166534';
        else if (m >= 65) fillColor = '#16a34a';
        else if (m >= 50) fillColor = '#84cc16';
        else if (m >= 30) fillColor = '#e5e7eb';
        else fillColor = '#d1d5db';
      } else if (demographicMetric === 'sushi_gap') {
        const gap = inv?.sushiGap ?? 0;
        if (gap >= 200) fillColor = '#0e7490';
        else if (gap >= 100) fillColor = '#0891b2';
        else if (gap >= 50) fillColor = '#22d3ee';
        else if (gap >= 20) fillColor = '#a5f3fc';
        else fillColor = '#e5e7eb';
      } else {
        fillColor = data.ethnicityColor;
      }
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          _fill: fillColor,
          _genZPop: data.genZPop,
          _genZPct: data.genZPct,
          _totalPop: data.totalPop,
          _primaryEth: data.primaryEthnicity,
          _primaryEthPct: data.primaryEthnicityPct,
          _growthPct: inv?.growthPct,
          _chinesePct: inv?.chinesePct,
          _malayPct: inv?.malayPct,
          _sushiGap: inv?.sushiGap,
        },
      };
    });
    
    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [districtGeoJSON, districtGenZData, districtInvestorMetrics, demographicMetric]);

  // Apply choropleth to map (either demographic or original based on active tab)
  useEffect(() => {
    const m = map.current;
    const dataToUse = activeTab === 'demographics' && demographicChoropleth ? demographicChoropleth : choroplethGeoJSON;
    if (!m || !dataToUse) return;

    const applyChoropleth = () => {
      if (!map.current?.getSource) return;
      const mapRef = map.current;
      if (mapRef.getLayer('choropleth-fill')) mapRef.removeLayer('choropleth-fill');
      if (mapRef.getSource('choropleth')) mapRef.removeSource('choropleth');
      mapRef.addSource('choropleth', { type: 'geojson', data: dataToUse });
      const beforeId = mapRef.getLayer('state-outline') ? 'state-outline' : undefined;
      mapRef.addLayer(
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
    };

    if (m.loaded()) {
      applyChoropleth();
    } else {
      m.once('load', applyChoropleth);
    }
  }, [choroplethGeoJSON, demographicChoropleth, activeTab]);

  // Strategic metrics for Empire Sushi vs peers
  const strategicMetrics = useMemo(() => {
    if (!districtGenZData || !enriched.length) return null;
    
    // Define Gen Z hotspots (districts with Gen Z pop >= 50k)
    const genZHotspots = Object.entries(districtGenZData)
      .filter(([, data]) => data.genZPop >= 50)
      .map(([district]) => district);
    
    // Find which stores are in Gen Z hotspots
    const storesByBrand: { [brand: string]: { total: number; inGenZHotspot: number; districts: Set<string> } } = {};
    
    enriched.forEach((store) => {
      if (!storesByBrand[store.brand]) {
        storesByBrand[store.brand] = { total: 0, inGenZHotspot: 0, districts: new Set() };
      }
      storesByBrand[store.brand].total += 1;
      if (store.district) {
        storesByBrand[store.brand].districts.add(store.district);
        if (genZHotspots.includes(store.district)) {
          storesByBrand[store.brand].inGenZHotspot += 1;
        }
      }
    });
    
    // Find primary ethnicity targeting
    const ethnicityDistribution: { [brand: string]: { [ethnicity: string]: number } } = {};
    
    enriched.forEach((store) => {
      if (!store.district) return;
      const districtData = districtGenZData[store.district];
      if (!districtData) return;
      
      if (!ethnicityDistribution[store.brand]) {
        ethnicityDistribution[store.brand] = {};
      }
      const eth = districtData.primaryEthnicity;
      ethnicityDistribution[store.brand][eth] = (ethnicityDistribution[store.brand][eth] || 0) + 1;
    });
    
    // Calculate primary ethnicity for each brand
    const brandPrimaryEthnicity: { [brand: string]: { ethnicity: string; count: number; pct: number } } = {};
    Object.entries(ethnicityDistribution).forEach(([brand, ethDist]) => {
      const entries = Object.entries(ethDist).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0) {
        const total = storesByBrand[brand]?.total || 1;
        brandPrimaryEthnicity[brand] = {
          ethnicity: entries[0][0],
          count: entries[0][1],
          pct: (entries[0][1] / total * 100),
        };
      }
    });
    
    return {
      totalGenZHotspots: genZHotspots.length,
      storesByBrand,
      brandPrimaryEthnicity,
      genZHotspots,
    };
  }, [districtGenZData, enriched]);

  return (
    <section className="slide relative min-h-screen w-full flex bg-[var(--bg-cream)] overflow-hidden">
      <div className="w-1/2 h-screen relative" style={{ minHeight: '100vh' }}>
        <div
          ref={mapContainer}
          className="absolute inset-0 w-full h-full"
          style={{ minHeight: '100vh' }}
        />
        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setMapLegendCollapsed((c) => !c)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-inset"
              aria-expanded={!mapLegendCollapsed}
            >
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Map legend</span>
              {mapLegendCollapsed ? (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </button>
            {!mapLegendCollapsed && (
              <div className="flex flex-col gap-3 px-4 pb-4 pt-0">
                <div className="pt-0">
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
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    {activeTab === 'demographics' ? 'Demographic metric' : 'Choropleth metric'}
                  </label>
                  {activeTab === 'demographics' ? (
                    <select
                      value={demographicMetric}
                      onChange={(e) => setDemographicMetric(e.target.value as 'genz' | 'growth' | 'chinese_pct' | 'malay_pct' | 'sushi_gap')}
                      className="text-sm font-sans bg-transparent border-0 text-gray-800 font-medium focus:ring-0 focus:outline-none cursor-pointer w-full"
                    >
                      <option value="genz">Gen Z Hotspots (10-29 yrs)</option>
                      <option value="growth">Population Growth (2020→24)</option>
                      <option value="chinese_pct">Chinese % (concentration)</option>
                      <option value="malay_pct">Malay % (Halal opportunity)</option>
                      <option value="sushi_gap">Sushi Gap (pop per store)</option>
                    </select>
                  ) : (
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
                  )}
                </div>
                {activeTab === 'demographics' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      {demographicMetric === 'genz' && 'Gen Z population'}
                      {demographicMetric === 'growth' && 'Pop. growth % (2020→24)'}
                      {demographicMetric === 'chinese_pct' && 'Chinese %'}
                      {demographicMetric === 'malay_pct' && 'Malay % (Halal)'}
                      {demographicMetric === 'sushi_gap' && 'Sushi gap (pop/store)'}
                    </p>
                    {demographicMetric === 'genz' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }} /><span className="text-xs text-gray-700">≥100k</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }} /><span className="text-xs text-gray-700">50-100k</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }} /><span className="text-xs text-gray-700">25-50k</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#a3e635' }} /><span className="text-xs text-gray-700">10-25k</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#d1d5db' }} /><span className="text-xs text-gray-700">&lt;10k</span></div>
                      </div>
                    )}
                    {demographicMetric === 'growth' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#166534' }} /><span className="text-xs text-gray-700">≥8%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }} /><span className="text-xs text-gray-700">5-8%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#84cc16' }} /><span className="text-xs text-gray-700">2-5%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }} /><span className="text-xs text-gray-700">0-2%</span></div>
                      </div>
                    )}
                    {demographicMetric === 'chinese_pct' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }} /><span className="text-xs text-gray-700">≥40%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#ea580c' }} /><span className="text-xs text-gray-700">25-40%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }} /><span className="text-xs text-gray-700">15-25%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#a3e635' }} /><span className="text-xs text-gray-700">5-15%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }} /><span className="text-xs text-gray-700">&lt;5%</span></div>
                      </div>
                    )}
                    {demographicMetric === 'malay_pct' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#166534' }} /><span className="text-xs text-gray-700">≥80%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }} /><span className="text-xs text-gray-700">65-80%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#84cc16' }} /><span className="text-xs text-gray-700">50-65%</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }} /><span className="text-xs text-gray-700">&lt;50%</span></div>
                      </div>
                    )}
                    {demographicMetric === 'sushi_gap' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#0e7490' }} /><span className="text-xs text-gray-700">≥200</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#0891b2' }} /><span className="text-xs text-gray-700">100-200</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#22d3ee' }} /><span className="text-xs text-gray-700">50-100</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#a5f3fc' }} /><span className="text-xs text-gray-700">20-50</span></div>
                        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }} /><span className="text-xs text-gray-700">&lt;20</span></div>
                      </div>
                    )}
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={highlightClusters}
                    onChange={(e) => setHighlightClusters(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs font-medium text-gray-700">Highlight competitive clusters</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={panelRef}
        className={`slide3-panel w-1/2 h-screen overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 transition-all duration-700 bg-[#f9fafb] ${panelInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        {/* Tab Panel */}
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200 flex gap-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-[var(--accent-coral)] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Brand Analytics
          </button>
          <button
            onClick={() => setActiveTab('demographics')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'demographics'
                ? 'bg-[var(--accent-coral)] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            District Demographics
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <>
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
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
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
              className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 ${expandableClass}`}
            >
              <h3 className="font-serif text-xs text-[#1a1a1a] mb-1.5 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-coral)] shrink-0" />
                <span className="truncate">Store count by state ({selectedBrand})</span>
              </h3>
              <div className="aspect-square w-full min-h-[120px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                  <BarChart data={stateBarData} layout="vertical" margin={{ left: 4, right: 4, top: 0, bottom: 0 }}>
                    <XAxis type="number" stroke="#999" tick={{ fontSize: 7 }} />
                    <YAxis type="category" dataKey="state" width={44} tick={{ fontSize: 6 }} stroke="#999" />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-white border border-gray-200 rounded shadow-lg px-2 py-1.5 text-xs">
                            <div className="font-medium">{(payload[0].payload as { stateFull: string }).stateFull}</div>
                            <div className="text-gray-600">
                              {payload[0].value} stores ({((payload[0].payload as { pct: number }).pct).toFixed(1)}%)
                            </div>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="count" fill={BRAND_COLORS[selectedBrand] || EMPIRE_RED} radius={[0, 3, 3, 0]} name="Stores" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>

            {/* Stores per district */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('bar')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('bar')}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
            >
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2">Stores per district</h3>
              <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
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
              <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>

            {/* Brand performance radar */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('performance-radar')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('performance-radar')}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
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
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('competitive-areas')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('competitive-areas')}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
            >
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--accent-coral)]" />
                Count of competitive areas
              </h3>
              <p className="text-2xl font-bold text-[#1a1a1a] tabular-nums">{competitiveAreasCount}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Store locations with ≥1 competitor within 1 km</p>
              {brandStoresCount > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 mb-0.5">{selectedBrand} in competitive areas</p>
                  <p className="text-sm font-semibold text-[#1a1a1a] tabular-nums">
                    {brandInCompetitiveAreas} of {brandStoresCount} stores ({Math.round((brandInCompetitiveAreas / brandStoresCount) * 100)}%)
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowConflictZones((v) => !v); }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-[#fff5f2] text-[var(--accent-coral)] border border-[#ffb4a2]/50 hover:bg-[#ffebe6] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {showConflictZones ? 'Hide conflict zones' : 'Show conflict zones'}
              </button>
              <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>

            {/* Mall presence */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('mall-presence')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('mall-presence')}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
            >
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2563eb]" />
                Mall presence
              </h3>
              {mallStats.totalKnown === 0 ? (
                <p className="text-[10px] text-gray-500">Run <code className="bg-gray-100 px-1 rounded">node scripts/classify-stores-mall.js</code> with OPENAI_API_KEY to classify stores.</p>
              ) : (
                <>
                  <div className="flex gap-3 mb-2">
                    <div>
                      <p className="text-lg font-bold text-[#1a1a1a] tabular-nums">{mallStats.inMallCount}</p>
                      <p className="text-[10px] text-gray-500">In malls ({mallStats.pctInMall}%)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#1a1a1a] tabular-nums">{mallStats.notInMallCount}</p>
                      <p className="text-[10px] text-gray-500">Not in malls</p>
                    </div>
                  </div>
                  {mallStats.byBrand[selectedBrand] && (
                    <p className="text-[10px] text-gray-600 mb-2">
                      <strong>{selectedBrand}:</strong> {mallStats.byBrand[selectedBrand].inMall} of {mallStats.byBrand[selectedBrand].total} in malls
                      ({mallStats.byBrand[selectedBrand].total > 0 ? Math.round((mallStats.byBrand[selectedBrand].inMall / mallStats.byBrand[selectedBrand].total) * 100) : 0}%)
                    </p>
                  )}
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {allBrands.map((brand) => {
                      const s = mallStats.byBrand[brand];
                      if (!s || s.total === 0) return null;
                      const pct = s.total > 0 ? Math.round((s.inMall / s.total) * 100) : 0;
                      return (
                        <div key={brand} className="flex justify-between text-[10px]">
                          <span className="truncate font-medium" style={{ color: BRAND_COLORS[brand] || '#333' }}>{brand}</span>
                          <span className="tabular-nums text-gray-600">{s.inMall}/{s.total} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>

            {/* Market gap */}
            {marketGapDistricts.length > 0 && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedChart('market-gap')}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('market-gap')}
                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
              >
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
                <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
              </div>
            )}

            {/* Saturation score */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('saturation')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('saturation')}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
            >
              <h3 className="font-serif text-sm text-[#1a1a1a] mb-2">Saturation score</h3>
              <p className="text-[10px] text-gray-500 mb-1">Crowdedness of {selectedBrand} locations vs national average</p>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-coral)] transition-all duration-300"
                  style={{ width: `${saturationScore}%` }}
                />
              </div>
              <p className="text-xs font-medium text-gray-600 mt-1">{saturationScore}%</p>
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                <p className="text-[9px] text-gray-600 font-medium">What it means</p>
                <p className="text-[9px] text-gray-500 leading-tight">
                  <strong>National avg</strong> = total stores (all brands) ÷ number of districts with at least one store. <strong>Brand avg</strong> = {selectedBrand} stores ÷ districts {selectedBrand} is in.
                </p>
                <p className="text-[9px] text-gray-500 leading-tight font-mono bg-gray-50 px-1.5 py-1 rounded">
                  Score = (brand avg ÷ national avg) × 50, max 100%
                </p>
                <p className="text-[9px] text-gray-500 leading-tight">
                  Higher % = more stores per district than the market (concentrated). Lower % = fewer (spread out). ~50% = in line with national density.
                </p>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>

            {/* Proximity table – top 5 contested */}
            {contestedStores.length > 0 && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedChart('contested-stores')}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('contested-stores')}
                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${expandableClass}`}
              >
                <h3 className="font-serif text-sm text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[var(--accent-coral)]" />
                  Top 5 most contested stores
                </h3>
                <input
                  type="text"
                  placeholder="Search address..."
                  value={contestedSearch}
                  onChange={(e) => { e.stopPropagation(); setContestedSearch(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
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
                <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
              </div>
            )}

            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedChart('focus-brand')}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('focus-brand')}
              className={`bg-[#fff5f2] rounded-xl p-3 border border-[#ffb4a2]/30 ${expandableClass}`}
            >
              <p className="text-[10px] font-medium text-[#c62828] uppercase tracking-wider mb-1">Focus brand</p>
              <p className="text-[10px] text-gray-700 font-light">
                <strong className="text-[#c62828]">{selectedBrand}</strong> is highlighted on the map. Use the choropleth dropdown to compare district-level Population, Income per capita, or Income.
              </p>
              <p className="text-[10px] text-gray-500 mt-1 text-center">Click to enlarge</p>
            </div>
          </div>
        </div>
          </>
        ) : (
          /* District Demographics View - district dropdown removed */
          <>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-xl lg:text-2xl text-[#1a1a1a] tracking-tight">District Demographics</h2>
            </div>

            {!selectedDistrict ? (
              <>
                {/* Strategic Metrics - show before district selection */}
                {strategicMetrics && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Gen Z Hotspot Coverage - compact */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <h3 className="font-serif text-sm text-[#1a1a1a] mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--accent-coral)]" />
                        Gen Z Hotspot Coverage
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Stores in districts with ≥50k Gen Z population (age 10-29)
                      </p>
                      <div className="space-y-2">
                        {Object.entries(strategicMetrics.storesByBrand)
                          .sort((a, b) => b[1].inGenZHotspot - a[1].inGenZHotspot)
                          .slice(0, 6)
                          .map(([brand, data]) => {
                            const pct = data.total > 0 ? (data.inGenZHotspot / data.total * 100) : 0;
                            return (
                              <div key={brand} className="flex items-center justify-between">
                                <span className="text-xs font-medium" style={{ color: brand === 'Empire Sushi' ? EMPIRE_RED : BRAND_COLORS[brand] || '#666' }}>
                                  {brand}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">
                                    {data.inGenZHotspot}/{data.total}
                                  </span>
                                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: brand === 'Empire Sushi' ? EMPIRE_RED : BRAND_COLORS[brand] || '#666',
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-800 w-10 text-right">
                                    {pct.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Total Gen Z hotspots: <strong className="text-gray-800">{strategicMetrics.totalGenZHotspots}</strong> districts
                        </p>
                      </div>
                    </div>

                    {/* Primary Ethnicity Targeting - compact */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <h3 className="font-serif text-sm text-[#1a1a1a] mb-3">Primary Ethnicity Targeting</h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Most common ethnicity in districts where each brand operates
                      </p>
                      <div className="space-y-2">
                        {Object.entries(strategicMetrics.brandPrimaryEthnicity)
                          .sort((a, b) => b[1].pct - a[1].pct)
                          .slice(0, 6)
                          .map(([brand, data]) => {
                            const ethnicityLabel = data.ethnicity
                              .replace('bumi_', 'Bumi ')
                              .replace('_', ' ')
                              .split(' ')
                              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ');
                            return (
                              <div key={brand} className="flex items-center justify-between py-1">
                                <span className="text-xs font-medium" style={{ color: brand === 'Empire Sushi' ? EMPIRE_RED : BRAND_COLORS[brand] || '#666' }}>
                                  {brand}
                                </span>
                                <div className="text-right">
                                  <div className="text-xs font-semibold text-gray-800">{ethnicityLabel}</div>
                                  <div className="text-xs text-gray-500">
                                    {data.count} stores ({data.pct.toFixed(0)}%)
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Empire Sushi Strategic Position - compact */}
                    {strategicMetrics.storesByBrand['Empire Sushi'] && (
                      <div className="bg-gradient-to-br from-[#fff5f2] to-white rounded-lg p-3 shadow-sm border border-[#ffb4a2]/30">
                        <h3 className="font-serif text-sm text-[#c62828] mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Empire Sushi Strategic Position
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Gen Z Hotspot Penetration</p>
                            <p className="text-2xl font-bold text-[#c62828]">
                              {strategicMetrics.storesByBrand['Empire Sushi'].total > 0
                                ? ((strategicMetrics.storesByBrand['Empire Sushi'].inGenZHotspot / strategicMetrics.storesByBrand['Empire Sushi'].total) * 100).toFixed(0)
                                : 0}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {strategicMetrics.storesByBrand['Empire Sushi'].inGenZHotspot} of {strategicMetrics.storesByBrand['Empire Sushi'].total} stores
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">District Coverage</p>
                            <p className="text-2xl font-bold text-[#c62828]">
                              {strategicMetrics.storesByBrand['Empire Sushi'].districts.size}
                            </p>
                            <p className="text-xs text-gray-500">unique districts</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Primary Target</p>
                            <p className="text-lg font-bold text-[#c62828]">
                              {strategicMetrics.brandPrimaryEthnicity['Empire Sushi']
                                ? strategicMetrics.brandPrimaryEthnicity['Empire Sushi'].ethnicity
                                    .replace('bumi_', 'Bumi ')
                                    .replace('_', ' ')
                                    .split(' ')
                                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(' ')
                                : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {strategicMetrics.brandPrimaryEthnicity['Empire Sushi']
                                ? `${strategicMetrics.brandPrimaryEthnicity['Empire Sushi'].pct.toFixed(0)}% of stores`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* High-growth districts with competitor comparison */}
                    {growthDistricts.length > 0 && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedChart('demographics-growth-competitors')}
                        onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('demographics-growth-competitors')}
                        className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${expandableClass}`}
                      >
                        <h3 className="font-serif text-xs text-[#1a1a1a] mb-1.5 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                          High-growth districts: Empire vs Competitors
                        </h3>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {growthDistricts.slice(0, 8).map((d) => (
                            <div key={d.district} className="flex items-center justify-between text-[9px]">
                              <span className="font-medium text-gray-700 truncate max-w-[100px]">{d.district}</span>
                              <span className="text-green-600 font-semibold">+{d.growthPct.toFixed(1)}%</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[#c62828] font-bold">{d.empireCount}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-600">{d.totalCompetitors}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1.5 text-center">Empire stores / Total stores • Click to enlarge</p>
                      </div>
                    )}

                    {/* Halal opportunity - small, click to enlarge */}
                    {halalOpportunityDistricts.length > 0 && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedChart('demographics-halal')}
                        onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('demographics-halal')}
                        className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${expandableClass}`}
                      >
                        <h3 className="font-serif text-xs text-[#1a1a1a] mb-1.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                          Halal sushi opportunity
                        </h3>
                        <p className="text-[10px] text-gray-500 mb-2">≥70% Malay, ≤2 stores.</p>
                        <div className="max-h-28 overflow-y-auto space-y-1">
                          {halalOpportunityDistricts.slice(0, 5).map(({ district, state, malayPct, storeCount, sushiGap }) => (
                            <div key={district} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50 border border-gray-100 text-[10px]">
                              <span className="font-medium text-gray-800 truncate max-w-[80px]">{district}</span>
                              <span className="text-gray-500 shrink-0">{malayPct.toFixed(0)}%</span>
                              <span className="text-cyan-700 shrink-0">Gap {sushiGap.toFixed(0)}</span>
                            </div>
                          ))}
                          {halalOpportunityDistricts.length > 5 && (
                            <p className="text-[10px] text-gray-500 pt-0.5">+{halalOpportunityDistricts.length - 5} more</p>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 text-center">Click to enlarge</p>
                      </div>
                    )}

                    {/* Female Gen Z share - small, click to enlarge */}
                    {femaleGenZByDistrict.length > 0 && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedChart('demographics-female-genz')}
                        onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('demographics-female-genz')}
                        className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${expandableClass}`}
                      >
                        <h3 className="font-serif text-xs text-[#1a1a1a] mb-1.5 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                          Female Gen Z share (10–24)
                        </h3>
                        <div className="space-y-1">
                          {femaleGenZByDistrict.slice(0, 5).map((r) => (
                            <div key={r.district} className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-gray-800 truncate max-w-[100px]" title={r.district}>{r.district}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-[var(--accent-coral)] font-semibold">{r.empireStoreCount} ES</span>
                                  <span className="text-[9px] text-gray-500">/ {r.storeCount}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-12 text-right text-[10px] text-gray-600">{(100 - r.femalePct).toFixed(0)}%</div>
                                <div className="flex-1 flex gap-0.5 h-3 rounded overflow-hidden bg-gray-100">
                                  <div className="bg-[#2563eb]" style={{ width: `${100 - r.femalePct}%` }} title="Male" />
                                  <div className="bg-[#ec4899]" style={{ width: `${r.femalePct}%` }} title="Female" />
                                </div>
                              </div>
                            </div>
                          ))}
                          {femaleGenZByDistrict.length > 5 && (
                            <p className="text-[10px] text-gray-500">+{femaleGenZByDistrict.length - 5} more</p>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 text-center">Click to enlarge</p>
                      </div>
                    )}

                    {/* Market potential score - small, click to enlarge */}
                    {marketPotentialTopDistricts.length > 0 && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedChart('demographics-market-potential')}
                        onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('demographics-market-potential')}
                        className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${expandableClass}`}
                      >
                        <h3 className="font-serif text-xs text-[#1a1a1a] mb-1.5 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                          Market potential (top 15)
                        </h3>
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={marketPotentialTopDistricts}
                              layout="vertical"
                              margin={{ left: 4, right: 16, top: 2, bottom: 2 }}
                            >
                              <XAxis type="number" stroke="#999" tick={{ fontSize: 8 }} domain={[0, 100]} />
                              <YAxis type="category" dataKey="district" width={70} tick={{ fontSize: 7 }} stroke="#999" />
                              <Tooltip
                                formatter={(value: number | string | undefined, name: string) => [value, name]}
                                contentStyle={{ fontSize: 11 }}
                                labelFormatter={(_, payload) => {
                                  const p = payload?.[0]?.payload as { state?: string; district?: string };
                                  return p ? `${p.district} (${p.state || ''})` : '';
                                }}
                              />
                              <Bar dataKey="score" name="Score" fill="#0891b2" radius={[0, 3, 3, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 text-center">Click to enlarge</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : districtDemographics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
                {/* Left column */}
                <div className="flex flex-col gap-3 min-h-0">
                  {/* Overview card - compact */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <h3 className="font-serif text-base text-[#1a1a1a] mb-0.5">{selectedDistrict}</h3>
                    <p className="text-xs text-gray-500 mb-2">{districtDemographics.state}</p>
                    <div className="flex items-baseline gap-2">
                      <Users className="w-4 h-4 text-[var(--accent-coral)]" />
                      <span className="text-2xl font-bold text-[#1a1a1a]">
                        {districtDemographics.totalPop.toFixed(1)}k
                      </span>
                      <span className="text-xs text-gray-500">population (2024)</span>
                    </div>
                  </div>

                  {/* Population trend - small, click to enlarge */}
                  {districtDemographics.trendData.length > 1 && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedChart('district-trend')}
                      onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('district-trend')}
                      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${expandableClass}`}
                    >
                      <h3 className="font-serif text-xs text-[#1a1a1a] mb-1 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                        Population trend
                      </h3>
                      <ResponsiveContainer width="100%" height={90}>
                        <LineChart data={districtDemographics.trendData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                          <XAxis dataKey="year" stroke="#999" tick={{ fontSize: 8 }} />
                          <YAxis stroke="#999" tick={{ fontSize: 8 }} width={28} />
                          <Tooltip 
                            formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}k` : '', 'Population']}
                            contentStyle={{ fontSize: 11 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="population" 
                            stroke={EMPIRE_RED} 
                            strokeWidth={1.5}
                            dot={{ fill: EMPIRE_RED, r: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <p className="text-[10px] text-gray-500 mt-0.5 text-center">Click to enlarge</p>
                    </div>
                  )}

                  {/* Ethnicity breakdown - small, click to enlarge */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedChart('district-ethnicity-pie')}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('district-ethnicity-pie')}
                    className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${expandableClass}`}
                  >
                    <h3 className="font-serif text-xs text-[#1a1a1a] mb-2 flex items-center gap-1.5">
                      <PieIcon className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                      Ethnicity breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie
                          data={districtDemographics.ethnicityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={22}
                          outerRadius={38}
                          paddingAngle={2}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {districtDemographics.ethnicityData.map((_, i) => (
                            <Cell 
                              key={i} 
                              fill={['#c62828', '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'][i % 6]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}k` : '', 'Population']}
                          contentStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-gray-500 mt-0.5 text-center">Click to enlarge</p>
                  </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-3 min-h-0">
                  {/* Age distribution - small, click to enlarge */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedChart('district-age')}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('district-age')}
                    className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${expandableClass}`}
                  >
                    <h3 className="font-serif text-xs text-[#1a1a1a] mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                      Age distribution
                    </h3>
                    <div className="max-h-32 overflow-y-auto">
                      <ResponsiveContainer width="100%" height={Math.max(100, districtDemographics.ageData.length * 16)}>
                        <BarChart data={districtDemographics.ageData} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                          <XAxis type="number" stroke="#999" tick={{ fontSize: 8 }} />
                          <YAxis type="category" dataKey="age" width={36} tick={{ fontSize: 8 }} stroke="#999" />
                          <Tooltip 
                            formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}k` : '', 'Population']}
                            contentStyle={{ fontSize: 11 }}
                          />
                          <Bar dataKey="population" fill="#2563eb" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 text-center">Click to enlarge</p>
                  </div>

                  {/* Ethnicity details table - compact */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <h3 className="font-serif text-xs text-[#1a1a1a] mb-1.5">Detailed breakdown</h3>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {districtDemographics.ethnicityData.map((eth) => (
                        <div key={eth.name} className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-xs font-medium text-gray-700 capitalize">{eth.name}</span>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-gray-800">{eth.value.toFixed(1)}k</span>
                            <span className="text-xs text-gray-500 ml-1">({eth.pct.toFixed(1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insights card - compact */}
                  <div className="bg-[#fff5f2] rounded-lg p-2.5 border border-[#ffb4a2]/30">
                    <p className="text-[10px] font-medium text-[#c62828] uppercase tracking-wider mb-0.5">Demographics Insight</p>
                    <p className="text-[11px] text-gray-700 font-light">
                      {districtDemographics.ethnicityData.length > 0 && (
                        <>
                          <strong className="text-[#c62828]">{districtDemographics.ethnicityData[0].name}</strong> is the largest ethnic group 
                          ({districtDemographics.ethnicityData[0].pct.toFixed(1)}%). 
                        </>
                      )}
                      {' '}Click charts to enlarge.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-serif text-lg text-gray-600 mb-2">No data available</h3>
                  <p className="text-sm text-gray-500">
                    Demographic data for {selectedDistrict} is not available
                  </p>
                </div>
              </div>
            )}
          </>
        )}
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
                {expandedChart === 'competitive-areas' && 'Count of Competitive Areas'}
                {expandedChart === 'mall-presence' && 'Mall Presence'}
                {expandedChart === 'market-gap' && 'Market Gap (Expansion Potential)'}
                {expandedChart === 'saturation' && 'Saturation Score'}
                {expandedChart === 'contested-stores' && 'Top 5 Most Contested Stores'}
                {expandedChart === 'focus-brand' && 'Focus Brand'}
                {expandedChart === 'district-trend' && `Population trend – ${selectedDistrict}`}
                {expandedChart === 'district-ethnicity-pie' && `Ethnicity breakdown – ${selectedDistrict}`}
                {expandedChart === 'district-age' && `Age distribution – ${selectedDistrict}`}
                {expandedChart === 'demographics-growth' && 'Highest growing districts (2020 → 2024)'}
                {expandedChart === 'demographics-growth-competitors' && 'High-growth districts: Empire vs Competitors (2020 → 2024)'}
                {expandedChart === 'demographics-halal' && 'Halal sushi opportunity'}
                {expandedChart === 'demographics-female-genz' && 'Female Gen Z share (10–24) – top 10 target districts'}
                {expandedChart === 'demographics-market-potential' && 'Market potential score (top 15)'}
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
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-sm">
                            <div className="font-medium">{(payload[0].payload as { stateFull: string }).stateFull}</div>
                            <div className="text-gray-600">
                              {payload[0].value} stores ({((payload[0].payload as { pct: number }).pct).toFixed(1)}%)
                            </div>
                          </div>
                        ) : null
                      }
                    />
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
              {expandedChart === 'competitive-areas' && (
                <div className="space-y-4 max-w-2xl">
                  <p className="text-4xl font-bold text-[#1a1a1a] tabular-nums">{competitiveAreasCount}</p>
                  <p className="text-gray-600">Store locations with ≥1 competitor within 1 km</p>
                  {brandStoresCount > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">{selectedBrand} in competitive areas</p>
                      <p className="text-2xl font-semibold text-[#1a1a1a] tabular-nums">
                        {brandInCompetitiveAreas} of {brandStoresCount} stores ({Math.round((brandInCompetitiveAreas / brandStoresCount) * 100)}%)
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowConflictZones((v) => !v); setExpandedChart(null); }}
                    className="mt-4 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-medium bg-[#fff5f2] text-[var(--accent-coral)] border border-[#ffb4a2]/50 hover:bg-[#ffebe6] transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    {showConflictZones ? 'Hide conflict zones' : 'Show conflict zones on map'}
                  </button>
                </div>
              )}
              {expandedChart === 'mall-presence' && mallStats.totalKnown > 0 && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-4xl font-bold text-[#1a1a1a] tabular-nums">{mallStats.inMallCount}</p>
                      <p className="text-gray-500">In malls ({mallStats.pctInMall}%)</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-[#1a1a1a] tabular-nums">{mallStats.notInMallCount}</p>
                      <p className="text-gray-500">Not in malls</p>
                    </div>
                  </div>
                  {mallStats.byBrand[selectedBrand] && (
                    <p className="text-base text-gray-700">
                      <strong>{selectedBrand}:</strong> {mallStats.byBrand[selectedBrand].inMall} of {mallStats.byBrand[selectedBrand].total} in malls
                      ({mallStats.byBrand[selectedBrand].total > 0 ? Math.round((mallStats.byBrand[selectedBrand].inMall / mallStats.byBrand[selectedBrand].total) * 100) : 0}%)
                    </p>
                  )}
                  <div className="space-y-2">
                    {allBrands.map((brand) => {
                      const s = mallStats.byBrand[brand];
                      if (!s || s.total === 0) return null;
                      const pct = s.total > 0 ? Math.round((s.inMall / s.total) * 100) : 0;
                      return (
                        <div key={brand} className="flex justify-between text-sm py-2 border-b border-gray-100">
                          <span className="font-medium" style={{ color: BRAND_COLORS[brand] || '#333' }}>{brand}</span>
                          <span className="tabular-nums text-gray-600">{s.inMall}/{s.total} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {expandedChart === 'mall-presence' && mallStats.totalKnown === 0 && (
                <p className="text-gray-500">Run <code className="bg-gray-100 px-2 py-1 rounded">node scripts/classify-stores-mall.js</code> with OPENAI_API_KEY to classify stores.</p>
              )}
              {expandedChart === 'market-gap' && (
                <div className="max-w-2xl">
                  <p className="text-gray-600 mb-6">Top districts with zero {selectedBrand} presence but high competitor presence</p>
                  {marketGapDistricts.length === 0 ? (
                    <p className="text-gray-500">No market gap districts for this brand.</p>
                  ) : (
                  <ul className="space-y-4">
                    {marketGapDistricts.map(({ district, totalCompetitors }) => (
                      <li key={district} className="flex justify-between items-center text-base py-3 border-b border-gray-100">
                        <span className="font-medium text-gray-800">{district}</span>
                        <span className="text-gray-500 tabular-nums">{totalCompetitors} competitors</span>
                      </li>
                    ))}
                  </ul>
                  )}
                </div>
              )}
              {expandedChart === 'saturation' && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <p className="text-4xl font-bold text-[#1a1a1a] tabular-nums mb-2">{saturationScore}%</p>
                    <p className="text-gray-600">Crowdedness of {selectedBrand} locations vs national average</p>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-coral)] transition-all duration-300"
                      style={{ width: `${saturationScore}%` }}
                    />
                  </div>
                  <div className="pt-4 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                    <p><strong>National avg</strong> = total stores (all brands) ÷ number of districts with at least one store.</p>
                    <p><strong>Brand avg</strong> = {selectedBrand} stores ÷ districts {selectedBrand} is in.</p>
                    <p className="font-mono bg-gray-50 px-3 py-2 rounded">Score = (brand avg ÷ national avg) × 50, max 100%</p>
                    <p>Higher % = more stores per district (concentrated). Lower % = fewer (spread out). ~50% = in line with national density.</p>
                  </div>
                </div>
              )}
              {expandedChart === 'contested-stores' && (
                <div className="max-w-2xl space-y-4">
                  <input
                    type="text"
                    placeholder="Search address..."
                    value={contestedSearch}
                    onChange={(e) => setContestedSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--accent-coral)] focus:outline-none"
                  />
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                    {contestedStores
                      .filter(({ store }) => !contestedSearch || store.address.toLowerCase().includes(contestedSearch.toLowerCase()))
                      .map(({ store, competitorCount }) => (
                        <div key={`${store.lng}-${store.lat}`} className="text-sm p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="font-medium text-gray-800">{store.address || store.name}</p>
                          <p className="text-gray-500 mt-1">({store.lat.toFixed(4)}, {store.lng.toFixed(4)}) · {competitorCount} competitors within 1 km</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {expandedChart === 'focus-brand' && (
                <div className="max-w-2xl">
                  <p className="text-lg text-gray-700">
                    <strong className="text-[#c62828]">{selectedBrand}</strong> is highlighted on the map. Use the choropleth dropdown to compare district-level Population, Income per capita, or Income.
                  </p>
                  <p className="text-gray-500 mt-4">Switch to the District Demographics tab to view Gen Z hotspots and ethnicity-based insights.</p>
                </div>
              )}
              {expandedChart === 'district-trend' && districtDemographics && districtDemographics.trendData.length > 1 && (
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={districtDemographics.trendData} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                      <XAxis dataKey="year" stroke="#999" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}k` : '', 'Population']}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="population" 
                        stroke={EMPIRE_RED} 
                        strokeWidth={2}
                        dot={{ fill: EMPIRE_RED, r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {districtDemographics.trendData.length >= 2 && (
                    <p className="text-sm text-gray-500 mt-4">
                      Growth: {(
                        ((districtDemographics.trendData[districtDemographics.trendData.length - 1].population - 
                          districtDemographics.trendData[0].population) / 
                          districtDemographics.trendData[0].population * 100)
                      ).toFixed(1)}% 
                      ({districtDemographics.trendData[0].year}–{districtDemographics.trendData[districtDemographics.trendData.length - 1].year})
                    </p>
                  )}
                </div>
              )}
              {expandedChart === 'district-ethnicity-pie' && districtDemographics && (
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={districtDemographics.ethnicityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={2}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {districtDemographics.ethnicityData.map((_, i) => (
                        <Cell 
                          key={i} 
                          fill={['#c62828', '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'][i % 6]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}k` : '', 'Population']}
                      contentStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'district-age' && districtDemographics && (
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={Math.min(500, Math.max(300, districtDemographics.ageData.length * 28))}>
                    <BarChart data={districtDemographics.ageData} layout="vertical" margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
                      <XAxis type="number" stroke="#999" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="age" width={50} tick={{ fontSize: 11 }} stroke="#999" />
                      <Tooltip 
                        formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}k` : '', 'Population']}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="population" fill="#2563eb" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {expandedChart === 'demographics-growth' && districtPopulationGrowth.length > 0 && (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={districtPopulationGrowth} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
                    <XAxis type="number" stroke="#999" tick={{ fontSize: 12 }} unit="%" />
                    <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} stroke="#999" />
                    <Tooltip formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}%` : '', 'Growth']} contentStyle={{ fontSize: 12 }} labelFormatter={(_, payload) => payload?.[0]?.payload?.state ? `${payload[0].payload.district} (${payload[0].payload.state})` : ''} />
                    <Bar dataKey="growthPct" name="Growth %" fill="#16a34a" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'demographics-growth-competitors' && growthDistricts.length > 0 && (
                <div className="space-y-6" style={{ minHeight: '70vh' }}>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">Summary</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Top 30 high-growth districts</p>
                        <p className="text-2xl font-bold text-green-600">{growthDistricts.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Empire presence</p>
                        <p className="text-2xl font-bold text-[#c62828]">
                          {growthDistricts.filter(d => d.empireCount > 0).length} districts
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Empire stores</p>
                        <p className="text-2xl font-bold text-[#c62828]">
                          {growthDistricts.reduce((sum, d) => sum + d.empireCount, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Opportunities</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {growthDistricts.filter(d => d.empireCount === 0 && d.totalCompetitors > 0).length} gaps
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ width: '100%', height: '600px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={growthDistricts.slice(0, 20)} 
                        layout="vertical" 
                        margin={{ left: 120, right: 40, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis type="number" stroke="#999" tick={{ fontSize: 11 }} />
                        <YAxis 
                          type="category" 
                          dataKey="district" 
                          width={110} 
                          tick={{ fontSize: 11 }} 
                          stroke="#999" 
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length > 0) {
                              const data = payload[0].payload as GrowthDistrictData;
                              return (
                                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                  <p className="font-bold text-gray-800 mb-2">{data.district}</p>
                                  <p className="text-sm text-green-600 font-semibold mb-2">Growth: +{data.growthPct.toFixed(1)}%</p>
                                  <p className="text-xs text-gray-600 mb-1">Population: {(data.pop2020/1000).toFixed(0)}k → {(data.pop2024/1000).toFixed(0)}k</p>
                                  <div className="border-t border-gray-200 mt-2 pt-2 space-y-1 text-xs">
                                    <p className="text-[#c62828] font-semibold">Empire: {data.empireCount}</p>
                                    <p className="text-gray-700">Sushi King: {data.sushiKingCount}</p>
                                    <p className="text-gray-700">Family Mart: {data.familyMartCount}</p>
                                    <p className="text-gray-700">Sushi Zanmai: {data.sushiZanmaiCount}</p>
                                    <p className="text-gray-700">Others: {data.sushiJiroCount + data.sushiPlusCount}</p>
                                    <p className="font-semibold text-gray-800 pt-1 border-t">Total: {data.totalCompetitors}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="empireCount" name="Empire Sushi" fill="#c62828" stackId="stores" />
                        <Bar dataKey="sushiKingCount" name="Sushi King" fill="#8a9b6b" stackId="stores" />
                        <Bar dataKey="familyMartCount" name="Family Mart" fill="#a88b9c" stackId="stores" />
                        <Bar dataKey="sushiZanmaiCount" name="Sushi Zanmai" fill="#7a9ba8" stackId="stores" />
                        <Bar 
                          dataKey={(data: GrowthDistrictData) => data.sushiJiroCount + data.sushiPlusCount} 
                          name="Others" 
                          fill="#94a3b8" 
                          stackId="stores" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Key Insights</h4>
                    <ul className="space-y-1.5 text-sm text-blue-800">
                      <li>• Only {growthDistricts.filter(d => d.empireCount > 0).length} of top 30 high-growth districts have Empire presence</li>
                      <li>• {growthDistricts.filter(d => d.empireCount === 0 && d.totalCompetitors > 0).length} high-growth districts have competitors but NO Empire stores</li>
                      <li>• Top opportunities: {growthDistricts
                          .filter(d => d.empireCount === 0 && d.totalCompetitors >= 2)
                          .slice(0, 3)
                          .map(d => d.district)
                          .join(', ')}</li>
                    </ul>
                  </div>
                </div>
              )}
              {expandedChart === 'demographics-halal' && (
                <div className="max-w-2xl space-y-3">
                  <p className="text-sm text-gray-600">Districts with ≥70% Malay and ≤2 sushi stores.</p>
                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {halalOpportunityDistricts.map(({ district, state, malayPct, storeCount, sushiGap }) => (
                      <div key={district} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-sm font-medium text-gray-800">{district}</span>
                        <span className="text-sm text-gray-500">{state}</span>
                        <span className="text-sm text-green-700 font-medium">{malayPct.toFixed(0)}% Malay</span>
                        <span className="text-sm text-gray-600">{storeCount} stores</span>
                        <span className="text-sm text-cyan-700">Gap {sushiGap.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expandedChart === 'demographics-female-genz' && (
                <div className="max-w-3xl space-y-4">
                  <p className="text-sm text-gray-600">Higher female ratio often correlates with snack-sushi frequency in grab-and-go.</p>
                  <div className="space-y-3">
                    {femaleGenZByDistrict.map((r) => (
                      <div key={r.district} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{r.district}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[var(--accent-coral)] font-semibold">
                              {r.empireStoreCount} Empire Sushi
                            </span>
                            <span className="text-xs text-gray-500">
                              {r.storeCount} total {r.storeCount === 1 ? 'store' : 'stores'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-16 text-right text-sm text-gray-600">{(100 - r.femalePct).toFixed(0)}% M</div>
                          <div className="flex-1 flex gap-0.5 h-6 rounded overflow-hidden bg-gray-100">
                            <div className="bg-[#2563eb]" style={{ width: `${100 - r.femalePct}%` }} title="Male" />
                            <div className="bg-[#ec4899]" style={{ width: `${r.femalePct}%` }} title="Female" />
                          </div>
                          <div className="w-16 text-sm text-gray-600">{r.femalePct.toFixed(0)}% F</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expandedChart === 'demographics-market-potential' && marketPotentialTopDistricts.length > 0 && (
                <div className="w-full">
                  <p className="text-sm text-gray-600 mb-4">Weighted: growth + Gen Z % + sushi gap + female Gen Z share.</p>
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={marketPotentialTopDistricts} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
                      <XAxis type="number" stroke="#999" tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} stroke="#999" />
                      <Tooltip formatter={(value: number | string | undefined, name: string) => [value, name]} contentStyle={{ fontSize: 12 }} labelFormatter={(_, payload) => { const p = payload?.[0]?.payload as { state?: string; district?: string }; return p ? `${p.district} (${p.state || ''})` : ''; }} />
                      <Bar dataKey="score" name="Score" fill="#0891b2" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
