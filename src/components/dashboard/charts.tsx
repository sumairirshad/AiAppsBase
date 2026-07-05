'use client'

import * as React from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const axis = { fontSize: 12, tickLine: false, axisLine: false, stroke: 'hsl(var(--muted-foreground))' }

function ChartTooltip({ active, payload, label, prefix = '' }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      {label && <div className="mb-1 font-medium text-foreground">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-medium text-foreground">{prefix}{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueAreaChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => `$${v / 1000}k`} />
        <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ stroke: 'hsl(var(--border))' }} />
        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function SalesBarChart({ data }: { data: { month: string; sales: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
        <Bar dataKey="sales" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const DONUT_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="!w-auto flex-1">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-medium">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SpendAreaChart({ data }: { data: { month: string; spent: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ stroke: 'hsl(var(--border))' }} />
        <Area type="monotone" dataKey="spent" stroke="hsl(var(--chart-2))" strokeWidth={2.5} fill="url(#spend)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
