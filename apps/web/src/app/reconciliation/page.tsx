import { fetchReconciliationReports } from '@/lib/supabase';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function ReconciliationPage() {
  const reports = await fetchReconciliationReports();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Reconciliation</h1>
        <p className="mt-1 text-gray-600">
          Monitor data quality between transactional and analytics systems
        </p>
      </div>

      {/* Challenge #1 Explainer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          Challenge #1: Reconcile Discrepancies
        </h2>
        <p className="text-blue-800 mb-4">
          <strong>Problem:</strong> Backend transactional data doesn't match analytics events, causing trust issues.
        </p>
        <p className="text-blue-800">
          <strong>Solution:</strong> Dual-write pattern with automated daily reconciliation. Alerts trigger when variance exceeds 1%.
        </p>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Reconciliation Reports</h2>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No reconciliation reports yet</p>
            <p className="text-sm text-gray-400 mt-1">Reports are generated daily</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discrepancy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(report.report_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {report.entity_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.source_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.target_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          report.discrepancy_count === 0
                            ? 'text-green-600 font-medium'
                            : 'text-yellow-600 font-medium'
                        }
                      >
                        {report.discrepancy_count} ({report.discrepancy_percentage?.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Architecture */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold mr-3">
              1
            </div>
            <div>
              <p className="font-medium">Dual-Write Pattern</p>
              <p className="text-gray-600 mt-1">
                Every transaction writes to both the transactions table (source of truth) AND fires
                an event to the events table.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold mr-3">
              2
            </div>
            <div>
              <p className="font-medium">Daily Reconciliation Job</p>
              <p className="text-gray-600 mt-1">
                Automated job compares counts and amounts between transactional DB and analytics
                events. Runs every morning for previous day's data.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold mr-3">
              3
            </div>
            <div>
              <p className="font-medium">Alert Threshold</p>
              <p className="text-gray-600 mt-1">
                If discrepancy exceeds 1%, status changes to "warning" or "critical". Slack/email
                alerts notify the team for investigation.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold mr-3">
              4
            </div>
            <div>
              <p className="font-medium">Drill-Down Analysis</p>
              <p className="text-gray-600 mt-1">
                Sample discrepancies are logged with transaction IDs for investigation. DuckDB
                queries enable root cause analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-green-900 mb-3">Business Impact</h2>
        <ul className="space-y-2 text-sm text-green-800">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              <strong>Trust in data:</strong> Leadership can confidently make decisions knowing
              analytics matches transactions
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              <strong>Early detection:</strong> Catch instrumentation bugs within 24 hours instead
              of weeks
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              <strong>Audit trail:</strong> Immutable event log in R2 provides compliance-ready
              audit trail
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              <strong>Root cause analysis:</strong> Sample discrepancies enable debugging without
              searching entire dataset
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const colors = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  };

  const color = status ? colors[status as keyof typeof colors] : 'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status || 'unknown'}
    </span>
  );
}
