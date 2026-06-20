'use client';

import { AttributionSummary } from '@juicyway/attribution';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AttributionChart({ comparison }: { comparison: Record<string, AttributionSummary> }) {
  const chartData = prepareChartData(comparison);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="channel" />
          <YAxis label={{ value: 'Attribution Credit', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="first_touch" fill="#ef4444" name="First Touch" />
          <Bar dataKey="last_touch" fill="#f59e0b" name="Last Touch" />
          <Bar dataKey="linear" fill="#10b981" name="Linear" />
          <Bar dataKey="time_decay" fill="#3b82f6" name="Time Decay" />
          <Bar dataKey="position_based" fill="#8b5cf6" name="Position Based" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function prepareChartData(comparison: Record<string, AttributionSummary>) {
  const channelMap = new Map<string, any>();

  Object.entries(comparison).forEach(([model, summary]) => {
    summary.results.slice(0, 8).forEach((result) => {
      if (!channelMap.has(result.source)) {
        channelMap.set(result.source, {
          channel: result.source,
          first_touch: 0,
          last_touch: 0,
          linear: 0,
          time_decay: 0,
          position_based: 0,
        });
      }

      const entry = channelMap.get(result.source)!;
      const modelKey = model as string;

      if (modelKey === 'first_touch') entry.first_touch = result.credit;
      else if (modelKey === 'last_touch') entry.last_touch = result.credit;
      else if (modelKey === 'linear') entry.linear = result.credit;
      else if (modelKey === 'time_decay') entry.time_decay = result.credit;
      else if (modelKey === 'position_based') entry.position_based = result.credit;
    });
  });

  return Array.from(channelMap.values()).sort((a, b) => {
    const sumA = a.first_touch + a.last_touch + a.linear + a.time_decay + a.position_based;
    const sumB = b.first_touch + b.last_touch + b.linear + b.time_decay + b.position_based;
    return sumB - sumA;
  });
}
