'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const EMPIRE_RED = '#ff1744';

interface FinancialRow {
  company: string;
  brand: string;
  g: boolean;
  r: boolean;
  o: boolean;
  outlets: number;
  fye: number | null;
  revenueRmThousands: number;
  patRmThousands: number;
  patMargin: number;
}

function renderTooltipContent(data: FinancialRow[], label: string) {
  const row = data.find((d) => d.brand === label);
  if (!row) return null;
  const types: string[] = [];
  if (row.g) types.push('G (Grab-and-Go)');
  if (row.r) types.push('R (Conveyor/Quick-Service)');
  if (row.o) types.push('O (Other)');
  const serviceLabel = types.length ? types.join(', ') : '—';
  const marginPct = row.patMargin !== 0 ? (row.patMargin * 100).toFixed(1) + '%' : '—';
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      <p className="text-gray-600 mb-1">Service: {serviceLabel}</p>
      <p>Rev (RM ’000): {row.revenueRmThousands.toLocaleString()}</p>
      <p>PAT (RM ’000): {row.patRmThousands.toLocaleString()}</p>
      <p className="mt-1 pt-1 border-t border-gray-100 font-medium">PAT margin: {marginPct}</p>
    </div>
  );
}

export default function Slide4bFinancials() {
  const [data, setData] = useState<FinancialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartExpanded, setChartExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/financials')
      .then((r) => r.json())
      .then((body) => setData(body.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="financials-slide" className="slide relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-cream)]">
        <p className="text-gray-600">Loading financial data...</p>
      </section>
    );
  }

  return (
    <section id="financials-slide" className="slide relative min-h-screen w-full bg-[var(--bg-cream)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6 h-full flex flex-col">
        <div className="mb-3 flex-shrink-0">
          <h2 className="font-serif text-2xl text-[#1a1a1a] tracking-tight">
            Sushi franchise financials
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Source: Sushi Franchise Financial Data.
          </p>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
          {/* Table - main content */}
          <div className="flex-1 min-w-0 overflow-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2.5 px-2 font-semibold text-gray-700 whitespace-nowrap">Company: Operating Brand</th>
                    <th className="text-center py-2.5 px-1 font-semibold text-gray-700 w-8">G</th>
                    <th className="text-center py-2.5 px-1 font-semibold text-gray-700 w-8">R</th>
                    <th className="text-center py-2.5 px-1 font-semibold text-gray-700 w-8">O</th>
                    <th className="text-right py-2.5 px-2 font-semibold text-gray-700">No. Outlets</th>
                    <th className="text-right py-2.5 px-2 font-semibold text-gray-700">FYE</th>
                    <th className="text-right py-2.5 px-2 font-semibold text-gray-700">Rev (RM ’000)</th>
                    <th className="text-right py-2.5 px-2 font-semibold text-gray-700">PAT/(LAT) (RM ’000)</th>
                    <th className="text-right py-2.5 px-2 font-semibold text-gray-700">PAT/(LAT) Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">No financial data available.</td>
                    </tr>
                  ) : (
                    data.map((row, i) => (
                      <tr
                        key={`${row.brand}-${i}`}
                        className={`border-b border-gray-100 hover:bg-gray-50/80 ${
                          row.brand === 'Empire Sushi' ? 'bg-[#fff5f2]' : ''
                        }`}
                      >
                        <td className="py-2 px-2 text-gray-900 font-medium">
                          <span className={row.brand === 'Empire Sushi' ? 'text-[#ff1744] font-semibold' : ''}>
                            {row.company}
                          </span>
                        </td>
                        <td className="text-center py-2 px-1">{row.g ? '√' : ''}</td>
                        <td className="text-center py-2 px-1">{row.r ? '√' : ''}</td>
                        <td className="text-center py-2 px-1">{row.o ? '√' : ''}</td>
                        <td className="text-right py-2 px-2 tabular-nums">{row.outlets}</td>
                        <td className="text-right py-2 px-2 tabular-nums">{row.fye ?? '—'}</td>
                        <td className="text-right py-2 px-2 tabular-nums">
                          {row.revenueRmThousands.toLocaleString()}
                        </td>
                        <td className={`text-right py-2 px-2 tabular-nums ${row.patRmThousands < 0 ? 'text-red-600' : ''}`}>
                          {row.patRmThousands.toLocaleString()}
                        </td>
                        <td className={`text-right py-2 px-2 tabular-nums ${row.patMargin < 0 ? 'text-red-600' : ''}`}>
                          {row.patMargin !== 0 ? (row.patMargin * 100).toFixed(1) + '%' : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Line chart - Rev & PAT, hover shows % margin; click to enlarge */}
          {data.length > 0 && (
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setChartExpanded(true)}
                onKeyDown={(e) => e.key === 'Enter' && setChartExpanded(true)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1 min-h-[280px] hover:shadow-md hover:border-[var(--accent-coral)]/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2"
              >
                <h3 className="font-serif text-sm font-semibold text-[#1a1a1a] mb-2">Rev &amp; PAT (RM ’000)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 4 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="brand"
                      tick={{ fontSize: 9 }}
                      stroke="#999"
                      angle={-40}
                      textAnchor="end"
                      height={64}
                      tickFormatter={(brand) => {
                        const row = data.find((d) => d.brand === brand);
                        if (!row) return brand;
                        const types: string[] = [];
                        if (row.g) types.push('G');
                        if (row.r) types.push('R');
                        if (row.o) types.push('O');
                        return brand + (types.length ? ` (${types.join(',')})` : '');
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 9 }}
                      stroke="#999"
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                      label={{ value: 'Rev', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 9 }}
                      stroke="#999"
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                      label={{ value: 'PAT', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) =>
                        active && payload?.length && label != null ? renderTooltipContent(data, String(label)) : null
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenueRmThousands"
                      name="Rev (RM ’000)"
                      stroke={EMPIRE_RED}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="patRmThousands"
                      name="PAT (RM ’000)"
                      stroke="#5a7a6b"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {/* Brand names + service types (G,R,O) */}
                <div className="mt-2 pt-2 border-t border-gray-100 max-h-24 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Brands &amp; service type</p>
                  <ul className="text-[10px] text-gray-700 space-y-0.5">
                    {data.map((row) => {
                      const types: string[] = [];
                      if (row.g) types.push('G');
                      if (row.r) types.push('R');
                      if (row.o) types.push('O');
                      const tick = types.length ? ` (${types.join(', ')})` : '';
                      return (
                        <li key={row.brand} className={row.brand === 'Empire Sushi' ? 'font-semibold text-[#ff1744]' : ''}>
                          {row.brand}{tick}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
              </div>
            </div>
          )}

          {/* Expanded chart modal */}
          {chartExpanded && data.length > 0 && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setChartExpanded(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Enlarged Rev & PAT chart"
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
                  <h3 className="font-serif text-xl text-[#1a1a1a]">Rev &amp; PAT (RM ’000)</h3>
                  <button
                    type="button"
                    onClick={() => setChartExpanded(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)]"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6" style={{ minHeight: '70vh' }}>
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={data} margin={{ top: 16, right: 24, bottom: 80, left: 24 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#e5e5e5" />
                      <XAxis
                        dataKey="brand"
                        tick={{ fontSize: 11 }}
                        stroke="#999"
                        angle={-40}
                        textAnchor="end"
                        height={72}
                        tickFormatter={(brand) => {
                          const row = data.find((d) => d.brand === brand);
                          if (!row) return brand;
                          const types: string[] = [];
                          if (row.g) types.push('G');
                          if (row.r) types.push('R');
                          if (row.o) types.push('O');
                          return brand + (types.length ? ` (${types.join(',')})` : '');
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11 }}
                        stroke="#999"
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                        label={{ value: 'Rev (RM ’000)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        stroke="#999"
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                        label={{ value: 'PAT (RM ’000)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) =>
                          active && payload?.length && label != null ? renderTooltipContent(data, String(label)) : null
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenueRmThousands"
                        name="Rev (RM ’000)"
                        stroke={EMPIRE_RED}
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="patRmThousands"
                        name="PAT (RM ’000)"
                        stroke="#5a7a6b"
                        strokeWidth={2.5}
                        strokeDasharray="4 2"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex-shrink-0 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Legend</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong className="text-gray-700">G:</strong> Grab-and-Go Outlets</li>
            <li><strong className="text-gray-700">R:</strong> Conveyor Belt Sushi Restaurants and/or Quick-Service Restaurants</li>
            <li><strong className="text-gray-700">O:</strong> Other Formats</li>
            <li><strong className="text-gray-700">PAT/(LAT):</strong> Profit After Tax / (Loss After Tax)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
