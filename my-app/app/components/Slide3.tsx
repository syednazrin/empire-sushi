'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ScatterChart,
  Scatter,
  Cell,
  BarChart,
  Line,
} from 'recharts';

interface MenuItem {
  store: string;
  item: string;
  price: number;
  category?: string;
}

interface BoxPlotData {
  store: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  outliers: number[];
  color: string;
}

type ChartId = 'boxplot' | 'histogram' | 'scatter' | 'category';

const STORE_COLORS: { [key: string]: string } = {
  'Empire Sushi': '#ff1744',
  'Sushi Jiro': '#9b7a8a',
  'Mentai Sushi': '#6b9b8a',
  'Family Mart': '#a88b9c',
};

const calculateBoxPlotStats = (prices: number[]): Omit<BoxPlotData, 'store' | 'color'> => {
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;
  
  const q1Index = Math.floor(n * 0.25);
  const medianIndex = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  
  const q1 = sorted[q1Index];
  const median = sorted[medianIndex];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  
  const outliers = sorted.filter(p => p < lowerFence || p > upperFence);
  const validPrices = sorted.filter(p => p >= lowerFence && p <= upperFence);
  
  const min = validPrices[0] || sorted[0];
  const max = validPrices[validPrices.length - 1] || sorted[sorted.length - 1];
  const mean = prices.reduce((a, b) => a + b, 0) / n;
  
  return { min, q1, median, q3, max, mean, outliers };
};

export default function Slide3() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChart, setExpandedChart] = useState<ChartId | null>(null);

  useEffect(() => {
    fetch('/api/menu-items')
      .then((r) => r.json())
      .then((data) => {
        setMenuItems(data);
        setLoading(false);
        // Select all stores by default
        const stores = Array.from(new Set(data.map((item: MenuItem) => item.store))) as string[];
        setSelectedStores(new Set(stores));
      })
      .catch((err) => {
        console.error('Error loading menu items:', err);
        setLoading(false);
      });
  }, []);

  const allStores = useMemo(() => {
    return Array.from(new Set(menuItems.map((item) => item.store))).sort();
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) =>
      selectedStores.size === 0 || selectedStores.has(item.store)
    );
  }, [menuItems, selectedStores]);

  const kpis = useMemo(() => {
    const stats: { [store: string]: { avg: number; min: number; max: number; count: number } } = {};
    
    allStores.forEach((store) => {
      const storeItems = menuItems.filter((item) => item.store === store);
      const prices = storeItems.map((item) => item.price);
      
      if (prices.length > 0) {
        stats[store] = {
          avg: prices.reduce((a, b) => a + b, 0) / prices.length,
          min: Math.min(...prices),
          max: Math.max(...prices),
          count: prices.length,
        };
      }
    });
    
    return stats;
  }, [menuItems, allStores]);

  const boxPlotData = useMemo(() => {
    const data: BoxPlotData[] = [];
    
    selectedStores.forEach((store) => {
      const storeItems = filteredItems.filter((item) => item.store === store);
      const prices = storeItems.map((item) => item.price);
      
      if (prices.length > 0) {
        const stats = calculateBoxPlotStats(prices);
        data.push({
          store,
          ...stats,
          color: STORE_COLORS[store] || '#888',
        });
      }
    });
    
    return data;
  }, [filteredItems, selectedStores]);

  const histogramData = useMemo(() => {
    const binSize = 5;
    const bins: { [key: string]: { [store: string]: number } } = {};
    
    filteredItems.forEach((item) => {
      const bin = Math.floor(item.price / binSize) * binSize;
      const binLabel = `RM ${bin}-${bin + binSize}`;
      
      if (!bins[binLabel]) bins[binLabel] = {};
      bins[binLabel][item.store] = (bins[binLabel][item.store] || 0) + 1;
    });
    
    return Object.entries(bins)
      .map(([range, stores]) => ({ range, ...stores }))
      .sort((a, b) => {
        const aNum = parseInt(a.range.split(' ')[1]);
        const bNum = parseInt(b.range.split(' ')[1]);
        return aNum - bNum;
      });
  }, [filteredItems]);

  const scatterData = useMemo(() => {
    return filteredItems.map((item, idx) => ({
      ...item,
      x: idx,
      y: item.price,
      isHighlighted: highlightedItem === item.item,
    }));
  }, [filteredItems, highlightedItem]);

  const categoryData = useMemo(() => {
    const catStats: { [category: string]: { [store: string]: { count: number; avgPrice: number } } } = {};
    
    filteredItems.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      if (!catStats[cat]) catStats[cat] = {};
      if (!catStats[cat][item.store]) catStats[cat][item.store] = { count: 0, avgPrice: 0 };
      
      catStats[cat][item.store].count += 1;
      catStats[cat][item.store].avgPrice += item.price;
    });
    
    return Object.entries(catStats).map(([category, stores]) => {
      const result: any = { category };
      Object.entries(stores).forEach(([store, stats]) => {
        result[`${store}_count`] = stats.count;
        result[`${store}_avg`] = stats.avgPrice / stats.count;
      });
      return result;
    });
  }, [filteredItems]);

  const toggleStore = (store: string) => {
    const newSelected = new Set(selectedStores);
    if (newSelected.has(store)) {
      newSelected.delete(store);
    } else {
      newSelected.add(store);
    }
    setSelectedStores(newSelected);
  };

  if (loading) {
    return (
      <section className="slide relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-cream)]">
        <div className="text-center">
          <div className="text-4xl mb-4">🍣</div>
          <p className="text-gray-600">Loading menu data...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="slide relative min-h-screen w-full bg-[var(--bg-cream)] overflow-hidden">
      <div className="flex h-screen">
        {/* Left Sidebar - Filters & KPIs */}
        <div className="w-80 h-screen overflow-y-auto bg-white border-r border-gray-200 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="font-serif text-2xl text-[#1a1a1a] mb-1">Menu Comparison</h2>
              <p className="text-xs text-gray-500">Interactive analytics dashboard</p>
            </div>

            {/* Store Selection - compact */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Stores</label>
              <div className="grid grid-cols-2 gap-1.5">
                {allStores.map((store) => (
                  <button
                    key={store}
                    onClick={() => toggleStore(store)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                      selectedStores.has(store)
                        ? 'bg-gradient-to-r from-[var(--accent-coral)] to-[var(--accent-coral-soft)] text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className="w-2 h-2 shrink-0 rounded-full border border-white/80"
                      style={{ backgroundColor: STORE_COLORS[store] || '#888' }}
                    />
                    <span className="truncate text-left flex-1 min-w-0">{store}</span>
                    {selectedStores.has(store) && (
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Store Statistics</h3>
              <div className="space-y-3">
                {allStores.map((store) => {
                  const stats = kpis[store];
                  if (!stats) return null;
                  
                  return (
                    <div
                      key={store}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: STORE_COLORS[store] || '#888' }}
                        />
                        <h4 className="font-semibold text-sm text-gray-800">{store}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Avg:</span>
                          <span className="ml-1 font-semibold text-gray-800">RM {stats.avg.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Items:</span>
                          <span className="ml-1 font-semibold text-gray-800">{stats.count}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Min:</span>
                          <span className="ml-1 font-semibold text-gray-800">RM {stats.min.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max:</span>
                          <span className="ml-1 font-semibold text-gray-800">RM {stats.max.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-[#fff5f2] rounded-xl p-4 border border-[#ffb4a2]/30">
              <p className="text-xs font-medium text-[#ff1744] uppercase tracking-wider mb-2">Insights</p>
              <ul className="text-xs text-gray-700 space-y-1 font-light leading-relaxed">
                <li>• {filteredItems.length} items match your filters</li>
                <li>• {selectedStores.size} stores selected</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right - Charts in card grid */}
        <div className="flex-1 h-screen overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="font-serif text-3xl text-[#1a1a1a] tracking-tight">Price Analysis</h2>
              <p className="text-sm text-gray-500 mt-1">Click a card to enlarge. Select stores in the sidebar.</p>
            </div>

            {selectedStores.size === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <div className="text-6xl mb-4">🍱</div>
                <h3 className="font-serif text-xl text-gray-800 mb-2">No stores selected</h3>
                <p className="text-sm text-gray-500">Select at least one store from the sidebar to view analytics</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Box Plot Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedChart('boxplot')}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('boxplot')}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
                >
                  <h3 className="font-serif text-lg text-[#1a1a1a] mb-3">Box Plot – Price Range Distribution</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height={260}>
                      <ComposedChart data={boxPlotData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="store" tick={{ fontSize: 11 }} stroke="#999" />
                        <YAxis label={{ value: 'Price (RM)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} stroke="#999" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload?.length) {
                              const d = payload[0].payload as BoxPlotData;
                              return (
                                <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 text-xs">
                                  <p className="font-semibold mb-1">{d.store}</p>
                                  <p>Max: RM {d.max.toFixed(2)}</p>
                                  <p>Median: RM {d.median.toFixed(2)}</p>
                                  <p>Min: RM {d.min.toFixed(2)}</p>
                                  <p className="mt-1 pt-1 border-t">Mean: RM {d.mean.toFixed(2)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="min" fill="transparent" />
                        <Bar dataKey="q1" stackId="a" fill="transparent" />
                        <Bar dataKey={(data: BoxPlotData) => data.q3 - data.q1} stackId="a">
                          {boxPlotData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.6} />
                          ))}
                        </Bar>
                        <Line dataKey="median" stroke="#000" strokeWidth={2} dot={{ r: 0 }} />
                        <Line dataKey="mean" stroke="#ff1744" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#ff1744' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
                </div>

                {/* Histogram Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedChart('histogram')}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('histogram')}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
                >
                  <h3 className="font-serif text-lg text-[#1a1a1a] mb-3">Price Distribution Histogram</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={histogramData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} stroke="#999" />
                        <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} stroke="#999" />
                        <Tooltip />
                        <Legend />
                        {Array.from(selectedStores).map((store) => (
                          <Bar key={store} dataKey={store} fill={STORE_COLORS[store] || '#888'} name={store} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
                </div>

                {/* Scatter Plot Card */}
                {scatterData.length > 0 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedChart('scatter')}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('scatter')}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
                  >
                    <h3 className="font-serif text-lg text-[#1a1a1a] mb-3">Scatter – Items vs Price</h3>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height={260}>
                        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} stroke="#999" />
                          <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} stroke="#999" label={{ value: 'Price (RM)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                          <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload?.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 text-xs">
                                    <p className="font-semibold">{d.store}</p>
                                    <p className="text-gray-700">{d.item}</p>
                                    <p className="text-[#ff1744] font-medium mt-1">RM {d.price.toFixed(2)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {Array.from(selectedStores).map((store) => {
                            const storeData = scatterData.filter((d) => d.store === store);
                            return (
                              <Scatter key={store} name={store} data={storeData} fill={STORE_COLORS[store] || '#888'} onClick={(data) => setHighlightedItem(data.item)} />
                            );
                          })}
                          <Legend />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
                  </div>
                )}

                {/* Category Card */}
                {categoryData.length > 0 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedChart('category')}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedChart('category')}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
                  >
                    <h3 className="font-serif text-lg text-[#1a1a1a] mb-3">Category-wise Average Price</h3>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={categoryData} margin={{ top: 10, right: 20, bottom: 50, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="category" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} stroke="#999" />
                          <YAxis label={{ value: 'Avg (RM)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} stroke="#999" />
                          <Tooltip />
                          <Legend />
                          {Array.from(selectedStores).map((store) => (
                            <Bar key={`${store}_avg`} dataKey={`${store}_avg`} fill={STORE_COLORS[store] || '#888'} name={store} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
                  </div>
                )}
              </div>
            )}

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
                  className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
                    <h3 className="font-serif text-xl text-[#1a1a1a]">
                      {expandedChart === 'boxplot' && 'Box Plot – Price Range Distribution'}
                      {expandedChart === 'histogram' && 'Price Distribution Histogram'}
                      {expandedChart === 'scatter' && 'Scatter – All Items vs Price'}
                      {expandedChart === 'category' && 'Category-wise Average Price'}
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
                  <div className="p-6" style={{ minHeight: '70vh' }}>
                    {expandedChart === 'boxplot' && (
                      <>
                        <ResponsiveContainer width="100%" height={500}>
                          <ComposedChart data={boxPlotData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="store" tick={{ fontSize: 12 }} stroke="#999" />
                            <YAxis label={{ value: 'Price (RM)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} tick={{ fontSize: 11 }} stroke="#999" />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload?.length) {
                                  const d = payload[0].payload as BoxPlotData;
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs">
                                      <p className="font-semibold mb-2">{d.store}</p>
                                      <p>Max: RM {d.max.toFixed(2)}</p>
                                      <p>Q3: RM {d.q3.toFixed(2)}</p>
                                      <p>Median: RM {d.median.toFixed(2)}</p>
                                      <p>Q1: RM {d.q1.toFixed(2)}</p>
                                      <p>Min: RM {d.min.toFixed(2)}</p>
                                      <p className="mt-1 pt-1 border-t">Mean: RM {d.mean.toFixed(2)}</p>
                                      {d.outliers.length > 0 && <p className="text-red-600">Outliers: {d.outliers.length}</p>}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="min" fill="transparent" />
                            <Bar dataKey="q1" stackId="a" fill="transparent" />
                            <Bar dataKey={(data: BoxPlotData) => data.q3 - data.q1} stackId="a">
                              {boxPlotData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.6} />
                              ))}
                            </Bar>
                            <Line dataKey="median" stroke="#000" strokeWidth={2} dot={{ r: 0 }} />
                            <Line dataKey="mean" stroke="#ff1744" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#ff1744' }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex gap-4 justify-center text-xs text-gray-600">
                          <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-black" /><span>Median</span></div>
                          <div className="flex items-center gap-2"><div className="w-4 h-0.5 border-dashed" style={{ borderTop: '2px dashed #ff1744' }} /><span>Mean</span></div>
                          <div className="flex items-center gap-2"><div className="w-4 h-3 bg-gray-400 opacity-60" /><span>IQR (Q1-Q3)</span></div>
                        </div>
                      </>
                    )}
                    {expandedChart === 'histogram' && (
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart data={histogramData} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="range" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} stroke="#999" />
                          <YAxis label={{ value: 'Item Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} tick={{ fontSize: 11 }} stroke="#999" />
                          <Tooltip />
                          <Legend />
                          {Array.from(selectedStores).map((store) => (
                            <Bar key={store} dataKey={store} fill={STORE_COLORS[store] || '#888'} name={store} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {expandedChart === 'scatter' && scatterData.length > 0 && (
                      <ResponsiveContainer width="100%" height={500}>
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis type="number" dataKey="x" name="Item Index" tick={{ fontSize: 11 }} stroke="#999" label={{ value: 'Items (ordered)', position: 'bottom', style: { fontSize: 12 } }} />
                          <YAxis type="number" dataKey="y" name="Price" tick={{ fontSize: 11 }} stroke="#999" label={{ value: 'Price (RM)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                          <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload?.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs">
                                    <p className="font-semibold">{d.store}</p>
                                    <p className="text-gray-700">{d.item}</p>
                                    <p className="text-[#ff1744] font-medium mt-1">RM {d.price.toFixed(2)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {Array.from(selectedStores).map((store) => {
                            const storeData = scatterData.filter((d) => d.store === store);
                            return <Scatter key={store} name={store} data={storeData} fill={STORE_COLORS[store] || '#888'} onClick={(data) => setHighlightedItem(data.item)} />;
                          })}
                          <Legend />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                    {expandedChart === 'category' && categoryData.length > 0 && (
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart data={categoryData} margin={{ top: 10, right: 30, bottom: 60, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={80} stroke="#999" />
                          <YAxis label={{ value: 'Avg Price (RM)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} tick={{ fontSize: 11 }} stroke="#999" />
                          <Tooltip />
                          <Legend />
                          {Array.from(selectedStores).map((store) => (
                            <Bar key={`${store}_avg`} dataKey={`${store}_avg`} fill={STORE_COLORS[store] || '#888'} name={store} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
