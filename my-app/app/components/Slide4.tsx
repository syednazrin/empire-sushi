'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const EMPIRE_RED = '#ff1744';
const OTHER_COLORS: { [key: string]: string } = {
  'Sushi Jiro': '#9b7a8a',
  'Sushi King': '#8a9b6b',
  'Sushi Mentai': '#6b9b8a',
  'Nippon Sushi': '#9b8a6b',
  'Sushi Plus': '#8a7a9b',
  'Family Mart': '#a88b9c',
  'Sushi Zanmai': '#7a9ba8',
};

export default function Slide4() {
  const [data, setData] = useState<Record<string, string | number>[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/search-by-stores')
      .then((r) => r.json())
      .then((body) => {
        setData(body.data || []);
        setStores(body.stores || []);
      })
      .catch(() => {
        setData([]);
        setStores([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const avgByStore = useMemo(() => {
    const out: Record<string, number> = {};
    stores.forEach((store) => {
      const values = data.map((row) => Number(row[store])).filter((n) => !isNaN(n));
      out[store] = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    });
    return out;
  }, [data, stores]);

  if (loading) {
    return (
      <section className="slide relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-cream)]">
        <p className="text-gray-600">Loading search trends...</p>
      </section>
    );
  }

  return (
    <section className="slide relative min-h-screen w-full bg-[var(--bg-cream)] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-3">
          <h2 className="font-serif text-2xl text-[#1a1a1a] tracking-tight">Search by store</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            This data is from Google Trends — relative search interest over time (Malaysia).
          </p>
        </div>

        {stores.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {stores.map((store) => {
              const isEmpire = store === 'Empire Sushi';
              const color = isEmpire ? EMPIRE_RED : (OTHER_COLORS[store] || '#888');
              const avg = avgByStore[store] ?? 0;
              return (
                <div
                  key={store}
                  className="bg-white rounded-xl px-2.5 py-1.5 shadow-sm border border-gray-100 flex flex-row items-center gap-2 min-w-0"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-800 truncate block" title={store}>
                      {store}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: isEmpire ? EMPIRE_RED : undefined }}>
                      {avg}
                    </span>
                    <span className="text-[10px] text-gray-500"> avg</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {data.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No trend data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={data} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#999"
                  tickFormatter={(v) => {
                    const d = String(v);
                    return d.length >= 10 ? d.slice(0, 7) : d;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#999"
                  label={{ value: 'Interest', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip
                  labelFormatter={(v) => v}
                  formatter={(value: number | undefined, name: string) => [value ?? 0, name]}
                />
                <Legend />
                {stores.map((store) => {
                  const isEmpire = store === 'Empire Sushi';
                  const stroke = isEmpire ? EMPIRE_RED : (OTHER_COLORS[store] || '#888');
                  const strokeOpacity = isEmpire ? 1 : 0.75;
                  const strokeWidth = isEmpire ? 2.5 : 1.5;
                  return (
                    <Line
                      key={store}
                      type="monotone"
                      dataKey={store}
                      name={store}
                      stroke={stroke}
                      strokeOpacity={strokeOpacity}
                      strokeWidth={strokeWidth}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
