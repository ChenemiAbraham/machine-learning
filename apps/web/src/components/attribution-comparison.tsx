'use client';

import { AttributionSummary } from '@juicyway/attribution';

export function AttributionComparison({ comparison }: { comparison: Record<string, AttributionSummary> }) {
  const topChannels = extractTopChannels(comparison);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Attribution Comparison</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channel
              </th>
              {Object.keys(comparison).map((model) => (
                <th
                  key={model}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {model.replace('_', '-')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topChannels.map((channel) => (
              <tr key={channel} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {channel}
                </td>
                {Object.entries(comparison).map(([model, summary]) => {
                  const result = summary.results.find((r) => r.source === channel);
                  const credit = result?.credit || 0;
                  const percentage = (credit / summary.totalConversions) * 100;

                  return (
                    <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{credit.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="mt-1 w-24 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          * Values represent conversion credits attributed to each channel under different models.
          Higher values indicate stronger contribution to conversions.
        </p>
      </div>
    </div>
  );
}

function extractTopChannels(comparison: Record<string, AttributionSummary>): string[] {
  const channelSet = new Set<string>();

  Object.values(comparison).forEach((summary) => {
    summary.results.slice(0, 5).forEach((result) => {
      channelSet.add(result.source);
    });
  });

  return Array.from(channelSet);
}
