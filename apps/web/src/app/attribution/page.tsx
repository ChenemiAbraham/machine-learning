import { fetchUsers, fetchSessions } from '@/lib/supabase';
import {
  compareAttributionModels,
  buildTouchpointsFromEvents,
  ConversionData,
  AttributionModel,
} from '@juicyway/attribution';
import { AttributionChart } from '@/components/attribution-chart';
import { AttributionComparison } from '@/components/attribution-comparison';

export const dynamic = 'force-dynamic';

async function getAttributionData() {
  const [users, sessions] = await Promise.all([fetchUsers(), fetchSessions()]);

  const convertedUsers = users.filter((u) => u.kyc_status === 'completed');

  const conversions: ConversionData[] = convertedUsers.map((user) => {
    const userSessions = sessions.filter((s) => s.user_id === user.id);

    const touchpoints = userSessions.map((session) => ({
      timestamp: new Date(session.first_event_at),
      source: session.utm_source || 'direct',
      medium: session.utm_medium || 'none',
      campaign: session.utm_campaign || 'none',
      sessionId: session.session_id,
      eventId: session.id,
    }));

    return {
      userId: user.id,
      conversionTimestamp: new Date(user.kyc_completed_at || user.created_at),
      touchpoints,
    };
  }).filter((c) => c.touchpoints.length > 0);

  const comparison = compareAttributionModels(conversions);

  return {
    conversions: conversions.length,
    totalTouchpoints: conversions.reduce((sum, c) => sum + c.touchpoints.length, 0),
    avgTouchpoints: conversions.length > 0
      ? conversions.reduce((sum, c) => sum + c.touchpoints.length, 0) / conversions.length
      : 0,
    comparison,
  };
}

export default async function AttributionPage() {
  const data = await getAttributionData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Multi-Touch Attribution</h1>
            <p className="mt-1 text-gray-600">
              Compare 5 attribution models to understand which channels drive conversions
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Conversions Analyzed</p>
            <p className="text-3xl font-bold text-gray-900">{data.conversions}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Total Touchpoints</p>
            <p className="text-2xl font-bold text-gray-900">{data.totalTouchpoints}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Touchpoints per Conversion</p>
            <p className="text-2xl font-bold text-gray-900">{data.avgTouchpoints.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Attribution Models</p>
            <p className="text-2xl font-bold text-gray-900">5</p>
          </div>
        </div>
      </div>

      {/* Model Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Understanding Attribution Models</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-blue-900">First-Touch</h3>
            <p className="text-blue-700 mt-1">100% credit to first interaction (awareness)</p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Last-Touch</h3>
            <p className="text-blue-700 mt-1">100% credit to final interaction (conversion)</p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Linear</h3>
            <p className="text-blue-700 mt-1">Equal credit across all touchpoints</p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Time-Decay</h3>
            <p className="text-blue-700 mt-1">More credit to recent interactions (7-day half-life)</p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Position-Based</h3>
            <p className="text-blue-700 mt-1">40% first, 40% last, 20% middle (U-shaped)</p>
          </div>
        </div>
      </div>

      {/* Attribution Comparison */}
      <AttributionComparison comparison={data.comparison} />

      {/* Model Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(data.comparison).map(([model, summary]) => (
          <div key={model} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {model.replace('_', '-')} Attribution
            </h3>

            <div className="space-y-3">
              {summary.results.slice(0, 5).map((result, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{result.source}</p>
                      <p className="text-xs text-gray-500">{result.medium}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {result.credit.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{result.touchpointCount} touches</p>
                  </div>
                </div>
              ))}
            </div>

            {summary.results.length > 5 && (
              <p className="mt-4 text-xs text-gray-500 text-center">
                +{summary.results.length - 5} more channels
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Visual Comparison Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Channel Credit by Model</h2>
        <AttributionChart comparison={data.comparison} />
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
        <div className="space-y-4">
          {generateInsights(data.comparison).map((insight, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-primary-500 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-green-900 mb-3">Recommendations</h2>
        <ul className="space-y-2 text-sm text-green-800">
          <li className="flex items-start">
            <span className="mr-2">→</span>
            <span>
              Use <strong>Time-Decay</strong> for budget allocation (values recent interactions)
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">→</span>
            <span>
              Use <strong>First-Touch</strong> to understand awareness channels
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">→</span>
            <span>
              Use <strong>Position-Based</strong> for balanced view of journey
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">→</span>
            <span>
              Compare models monthly to identify shifts in user behavior
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function generateInsights(comparison: any): string[] {
  const insights: string[] = [];

  const firstTouch = comparison[AttributionModel.FIRST_TOUCH];
  const lastTouch = comparison[AttributionModel.LAST_TOUCH];
  const timeDecay = comparison[AttributionModel.TIME_DECAY];

  if (firstTouch.results[0]) {
    insights.push(
      `${firstTouch.results[0].source} is the top awareness channel (first-touch model)`
    );
  }

  if (lastTouch.results[0]) {
    insights.push(
      `${lastTouch.results[0].source} drives most final conversions (last-touch model)`
    );
  }

  if (timeDecay.results[0]) {
    insights.push(
      `${timeDecay.results[0].source} has the highest weighted contribution (time-decay model)`
    );
  }

  const avgTouchpoints = firstTouch.averageTouchpointsPerConversion;
  if (avgTouchpoints > 3) {
    insights.push(
      `Users typically interact ${avgTouchpoints.toFixed(1)} times before converting - multi-touch attribution is crucial`
    );
  }

  return insights;
}
