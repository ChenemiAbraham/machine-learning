'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ExperimentChart({ experiments }: { experiments: any[] }) {
  const chartData = experiments.map((exp) => ({
    name: exp.name.replace(/_/g, ' '),
    control: (exp.analysis.control.conversionRate * 100).toFixed(2),
    treatment: (exp.analysis.treatment.conversionRate * 100).toFixed(2),
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="control" fill="#94a3b8" name="Control" />
          <Bar dataKey="treatment" fill="#22c55e" name="Treatment" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
