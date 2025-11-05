import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface LineChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  height?: number;
  width?: string | number;
}

export default function LineChartImpl({ data, height = 300, width = '100%' }: LineChartProps) {
  const normalizedWidth: number | `${number}%` | undefined =
    typeof width === 'string'
      ? width.endsWith('%')
        ? (width as `${number}%`)
        : (`${parseInt(width, 10)}%` as `${number}%`)
      : width;
  return (
    <ResponsiveContainer width={normalizedWidth} height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
      </LineChart>
    </ResponsiveContainer>
  );
}
