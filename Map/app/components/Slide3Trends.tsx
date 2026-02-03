"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TREND_DATA } from "@/lib/data";

export function Slide3Trends({ isActive = true }: { isActive?: boolean }) {
  return (
    <section
      className={`slide flex min-h-screen w-full flex-col items-center justify-center bg-white px-6 py-16 md:px-12 ${!isActive ? "slide-inactive" : ""}`}
    >
      <div className="w-full max-w-4xl">
        <h2
          className="mb-2 text-center text-2xl font-semibold text-[#171717] md:text-3xl"
          style={{ fontFamily: "var(--font-serif-jp), Georgia, serif" }}
        >
          Sushi Trend Analytics
        </h2>
        <p className="mb-8 text-center text-sm text-[#171717]/60">
          Search interest index (mock data)
        </p>

        <div className="rounded-2xl bg-[#fafafa] p-4 shadow-sm md:p-6">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#737373" }}
                axisLine={{ stroke: "#e5e5e5" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#737373" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#171717" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span className="text-[#525252]">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="premium"
                name="Premium sushi"
                stroke="#171717"
                strokeWidth={2}
                dot={{ fill: "#171717", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="mass"
                name="Mass-market sushi"
                stroke="#e8a598"
                strokeWidth={2}
                dot={{ fill: "#e8a598", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-8 space-y-2 text-sm text-[#171717]/80 md:max-w-2xl md:mx-auto">
          <li className="flex gap-2">
            <span className="text-[#e8a598]">•</span>
            Premium sushi interest shows slower but more stable growth.
          </li>
          <li className="flex gap-2">
            <span className="text-[#e8a598]">•</span>
            Mass-market sushi trends are more volatile.
          </li>
        </ul>
      </div>
    </section>
  );
}
