import { fetchExperiments, fetchExperimentAssignments, fetchEvents, fetchTransactions } from '@/lib/supabase';
import { analyzeExperiment } from '@juicyway/experiments';
import { ExperimentCard } from '@/components/experiment-card';
import { ExperimentChart } from '@/components/experiment-chart';

export const dynamic = 'force-dynamic';

async function getExperimentsData() {
  const experiments = await fetchExperiments();
  const runningExperiments = experiments.filter((e) => e.status === 'running');

  const experimentsWithResults = await Promise.all(
    runningExperiments.map(async (experiment) => {
      const assignments = await fetchExperimentAssignments(experiment.id);
      const events = await fetchEvents();
      const transactions = await fetchTransactions();

      const controlAssignments = assignments.filter((a) => a.variant === 'control');
      const treatmentAssignments = assignments.filter(
        (a) => a.variant === 'treatment' || a.variant !== 'control'
      );

      let controlConversions = 0;
      let treatmentConversions = 0;

      const primaryMetric = experiment.primary_metric;

      if (primaryMetric === 'kyc_completion_rate') {
        const controlUserIds = new Set(controlAssignments.map((a) => a.user_id).filter(Boolean));
        const treatmentUserIds = new Set(treatmentAssignments.map((a) => a.user_id).filter(Boolean));

        controlConversions = events.filter(
          (e) => e.event_name === 'kyc_completed' && controlUserIds.has(e.user_id)
        ).length;

        treatmentConversions = events.filter(
          (e) => e.event_name === 'kyc_completed' && treatmentUserIds.has(e.user_id)
        ).length;
      } else if (primaryMetric === 'transaction_completion_rate') {
        const controlUserIds = new Set(controlAssignments.map((a) => a.user_id).filter(Boolean));
        const treatmentUserIds = new Set(treatmentAssignments.map((a) => a.user_id).filter(Boolean));

        controlConversions = transactions.filter(
          (t) => t.status === 'completed' && controlUserIds.has(t.user_id)
        ).length;

        treatmentConversions = transactions.filter(
          (t) => t.status === 'completed' && treatmentUserIds.has(t.user_id)
        ).length;
      } else {
        const conversionEvents = events.filter((e) => e.event_name === 'transaction_completed');
        const controlUserIds = new Set(controlAssignments.map((a) => a.user_id).filter(Boolean));
        const treatmentUserIds = new Set(treatmentAssignments.map((a) => a.user_id).filter(Boolean));

        controlConversions = conversionEvents.filter((e) => controlUserIds.has(e.user_id)).length;
        treatmentConversions = conversionEvents.filter((e) => treatmentUserIds.has(e.user_id)).length;
      }

      const analysis = analyzeExperiment(
        controlAssignments.length,
        controlConversions,
        treatmentAssignments.length,
        treatmentConversions,
        experiment.minimum_sample_size || 100
      );

      return {
        ...experiment,
        analysis,
        totalUsers: assignments.length,
        controlUsers: controlAssignments.length,
        treatmentUsers: treatmentAssignments.length,
      };
    })
  );

  return {
    experiments: experimentsWithResults,
    totalExperiments: runningExperiments.length,
  };
}

export default async function ExperimentsPage() {
  const data = await getExperimentsData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Experiments Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Real-time A/B test results with statistical analysis and recommendations
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Running Experiments</p>
            <p className="text-3xl font-bold text-gray-900">{data.totalExperiments}</p>
          </div>
        </div>
      </div>

      {/* Framework Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Experimentation Framework</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-blue-900">Statistical Tests</h3>
            <p className="text-blue-700 mt-1">Chi-square for significance, Wilson score for CI</p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Early Stopping</h3>
            <p className="text-blue-700 mt-1">Sequential testing (O'Brien-Fleming)</p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Confidence Level</h3>
            <p className="text-blue-700 mt-1">95% default (α = 0.05)</p>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Metrics</h3>
            <p className="text-blue-700 mt-1">Conversion rates, uplift, p-values</p>
          </div>
        </div>
      </div>

      {/* Experiment Cards */}
      {data.experiments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No running experiments</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create an experiment to start testing variants
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.experiments.map((experiment) => (
            <ExperimentCard key={experiment.id} experiment={experiment} />
          ))}
        </div>
      )}

      {/* Comparison Chart */}
      {data.experiments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Conversion Rate Comparison</h2>
          <ExperimentChart experiments={data.experiments} />
        </div>
      )}

      {/* Best Practices */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-green-900 mb-3">Experimentation Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
          <div>
            <h3 className="font-medium mb-2">Before Launch</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Define hypothesis and success metrics</li>
              <li>Calculate minimum sample size</li>
              <li>Set minimum detectable effect (MDE)</li>
              <li>Ensure random assignment</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">During Experiment</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Monitor sample ratio mismatch</li>
              <li>Check for novelty effects</li>
              <li>Use sequential testing for early stopping</li>
              <li>Track secondary metrics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistical Glossary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Statistical Terms</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-900">P-Value</dt>
            <dd className="text-gray-600 mt-1">
              Probability that results occurred by chance. Lower is better (typically &lt;0.05 is significant).
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Confidence Interval</dt>
            <dd className="text-gray-600 mt-1">
              Range where true uplift likely falls. If includes zero, result is not significant.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Relative Uplift</dt>
            <dd className="text-gray-600 mt-1">
              Percentage change from control. E.g., 10% uplift means treatment converts 10% better.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Sample Size</dt>
            <dd className="text-gray-600 mt-1">
              Number of users needed per variant. Determined by baseline rate, MDE, and desired power.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
