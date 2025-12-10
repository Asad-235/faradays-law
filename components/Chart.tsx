import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DataPoint {
  time: number;
  flux: number;
  emf: number;
}

interface ChartProps {
  data: DataPoint[];
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-slate-50 rounded-lg p-2 border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-2 pl-2">Real-time Data</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="time" 
            tick={false} 
            label={{ value: 'Time', position: 'insideBottomRight', offset: 0 }} 
          />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Flux (Φ)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'EMF (ε)', angle: 90, position: 'insideRight' }} />
          <Tooltip 
            labelFormatter={(label) => `t: ${label}`}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="flux" stroke="#8884d8" strokeWidth={2} dot={false} name="Magnetic Flux" isAnimationActive={false} />
          <Line yAxisId="right" type="monotone" dataKey="emf" stroke="#82ca9d" strokeWidth={2} dot={false} name="Induced EMF" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
