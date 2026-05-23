'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface BarSeries {
  dataKey: string;
  label: string;
  color: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  series: BarSeries[];
  xAxisKey: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

export function BarChart({
  data,
  series,
  xAxisKey,
  height = 240,
  showLegend = true,
  showGrid = true,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(0 0% 100%)',
            border: '1px solid hsl(220 13% 91%)',
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: 'hsl(220 14% 96%)' }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'hsl(220 9% 38%)' }}
            iconType="square"
            iconSize={10}
          />
        )}
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label}
            fill={s.color}
            radius={[3, 3, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
