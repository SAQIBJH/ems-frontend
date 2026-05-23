'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface HorizontalBarChartProps {
  data: DataItem[];
  height?: number;
  color?: string;
}

export function HorizontalBarChart({
  data,
  height = 220,
  color = 'hsl(222 80% 52%)',
}: HorizontalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11, fill: 'hsl(220 9% 38%)' }}
          axisLine={false}
          tickLine={false}
          width={96}
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
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
