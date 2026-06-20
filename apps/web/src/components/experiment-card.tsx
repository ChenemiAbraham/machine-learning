'use client';

import { ExperimentResult } from '@juicyway/experiments';

interface ExperimentWithAnalysis {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  primary_metric: string;
  analysis: ExperimentResult;
  totalUsers: number;
  controlUsers: number;
  treatmentUsers: number;
}

export function ExperimentCard({ experiment }: { experiment: ExperimentWithAnalysis }) {
  const { analysis } = experiment;
  const { control, treatment, statistical, recommendation } = analysis;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'ship_treatment':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ship_control':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'continue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'ship_treatment':
        return '✓';
      case 'ship_control':
        return '✗';
      case 'continue':
        return '⏳';
      default:
        return '?';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{experiment.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{experiment.description}</p>
            {experiment.hypothesis && (
              <p className="text-xs text-gray-500 mt-2 italic">
                <strong>Hypothesis:</strong> {experiment.hypothesis}
              </p>
            )}
          </div>
          <div
            className={`px-3 py-1 rounded-full border ${getRecommendationColor(recommendation)} font-medium text-sm`}
          >
            {getRecommendationIcon(recommendation)} {recommendation.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Control */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Control</h4>
              <span className="text-xs text-gray-500">{control.users} users</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {(control.conversionRate * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">{control.conversions} conversions</p>
          </div>

          {/* Treatment */}
          <div className="border border-primary-200 rounded-lg p-4 bg-primary-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Treatment</h4>
              <span className="text-xs text-gray-500">{treatment.users} users</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {(treatment.conversionRate * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">{treatment.conversions} conversions</p>
          </div>

          {/* Uplift */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Relative Uplift</h4>
              {statistical.isSignificant && (
                <span className="text-xs font-medium text-green-600">Significant</span>
              )}
            </div>
            <div
              className={`text-3xl font-bold ${
                statistical.relativeUplift > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {statistical.relativeUplift > 0 ? '+' : ''}
              {(statistical.relativeUplift * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(statistical.absoluteUplift * 100).toFixed(2)}pp absolute
            </p>
          </div>
        </div>

        {/* Statistical Details */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Statistical Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">P-Value</p>
              <p className="font-medium text-gray-900">{statistical.pValue.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-gray-500">Confidence</p>
              <p className="font-medium text-gray-900">
                {(statistical.confidenceLevel * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500">CI Range</p>
              <p className="font-medium text-gray-900">
                [{(statistical.confidenceInterval.lower * 100).toFixed(1)}%,{' '}
                {(statistical.confidenceInterval.upper * 100).toFixed(1)}%]
              </p>
            </div>
            <div>
              <p className="text-gray-500">Sample Size</p>
              <p className="font-medium text-gray-900">
                {statistical.sampleSizeReached ? (
                  <span className="text-green-600">✓ Reached</span>
                ) : (
                  <span className="text-yellow-600">⏳ Collecting</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress to minimum sample size</span>
            <span>
              {Math.min(
                ((control.users / statistical.minimumSampleSize) * 100).toFixed(0),
                '100'
              )}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{
                width: `${Math.min((control.users / statistical.minimumSampleSize) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{analysis.summary}</p>
        </div>
      </div>
    </div>
  );
}
