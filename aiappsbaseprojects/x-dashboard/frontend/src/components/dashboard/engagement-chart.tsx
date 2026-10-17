"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { EngagementPoint } from "@/lib/types";
import { formatCompactNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLOR_LIKES = "#2a78d6";
const COLOR_REPOSTS = "#eb6834";
const COLOR_VIEWS = "#2a78d6";

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Likes &amp; reposts</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "#898781", fontSize: 12 }}
                axisLine={{ stroke: "#c3c2b7" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#898781", fontSize: 12 }}
                tickFormatter={formatCompactNumber}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                labelFormatter={(value) => formatDate(String(value))}
                contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="likes"
                name="Likes"
                stroke={COLOR_LIKES}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="reposts"
                name="Reposts"
                stroke={COLOR_REPOSTS}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Views</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_VIEWS} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLOR_VIEWS} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "#898781", fontSize: 12 }}
                axisLine={{ stroke: "#c3c2b7" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#898781", fontSize: 12 }}
                tickFormatter={formatCompactNumber}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                labelFormatter={(value) => formatDate(String(value))}
                contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9" }}
              />
              <Area
                type="monotone"
                dataKey="views"
                name="Views"
                stroke={COLOR_VIEWS}
                strokeWidth={2}
                fill="url(#viewsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
