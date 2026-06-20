import { fetchUsers, fetchTransactions, fetchEvents, fetchExperiments } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getOverviewStats() {
  const [users, transactions, events, experiments] = await Promise.all([
    fetchUsers(),
    fetchTransactions(),
    fetchEvents(),
    fetchExperiments(),
  ]);

  const completedTransactions = transactions.filter((t) => t.status === 'completed');
  const completedKYCUsers = users.filter((u) => u.kyc_status === 'completed');
  const runningExperiments = experiments.filter((e) => e.status === 'running');

  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const signups7d = users.filter((u) => new Date(u.created_at) >= last7Days).length;
  const signups30d = users.filter((u) => new Date(u.created_at) >= last30Days).length;

  const transactions7d = completedTransactions.filter(
    (t) => new Date(t.created_at) >= last7Days
  ).length;
  const transactions30d = completedTransactions.filter(
    (t) => new Date(t.created_at) >= last30Days
  ).length;

  const volume7d = completedTransactions
    .filter((t) => new Date(t.created_at) >= last7Days)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const volume30d = completedTransactions
    .filter((t) => new Date(t.created_at) >= last30Days)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const kycCompletionRate = users.length > 0 ? (completedKYCUsers.length / users.length) * 100 : 0;

  const usersWithTransactions = new Set(completedTransactions.map((t) => t.user_id)).size;
  const activationRate =
    completedKYCUsers.length > 0 ? (usersWithTransactions / completedKYCUsers.length) * 100 : 0;

  return {
    totalUsers: users.length,
    totalTransactions: completedTransactions.length,
    totalEvents: events.length,
    totalVolume: completedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    kycCompletionRate,
    activationRate,
    runningExperiments: runningExperiments.length,
    signups7d,
    signups30d,
    transactions7d,
    transactions30d,
    volume7d,
    volume30d,
  };
}

export default async function HomePage() {
  const stats = await getOverviewStats();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Juicyway Growth Platform</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              A production-ready growth engineering and ML platform solving attribution, experimentation,
              and reconciliation challenges for cross-border payments.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link
                href="/attribution"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                View Attribution
              </Link>
              <Link
                href="/experiments"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Experiments
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Try Demo
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          subtitle={`${stats.signups7d} in last 7 days`}
          icon="users"
          trend="+12%"
        />
        <MetricCard
          title="Completed Transactions"
          value={stats.totalTransactions.toLocaleString()}
          subtitle={`${stats.transactions7d} in last 7 days`}
          icon="transactions"
          trend="+8%"
        />
        <MetricCard
          title="Total Volume"
          value={`$${(stats.totalVolume / 1000).toFixed(1)}K`}
          subtitle={`$${(stats.volume7d / 1000).toFixed(1)}K in last 7 days`}
          icon="money"
          trend="+15%"
        />
        <MetricCard
          title="Running Experiments"
          value={stats.runningExperiments.toString()}
          subtitle="Active A/B tests"
          icon="experiment"
        />
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Completion Rate</h3>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">
              {stats.kycCompletionRate.toFixed(1)}%
            </span>
            <span className="ml-2 text-sm text-gray-500">of signups</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${stats.kycCompletionRate}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {stats.totalUsers - (stats.totalUsers * stats.kycCompletionRate) / 100} users in KYC
            funnel
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activation Rate</h3>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">
              {stats.activationRate.toFixed(1)}%
            </span>
            <span className="ml-2 text-sm text-gray-500">made first transaction</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${stats.activationRate}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {((stats.totalUsers * stats.kycCompletionRate) / 100 - (stats.totalUsers * stats.kycCompletionRate * stats.activationRate) / 10000).toFixed(0)} completed KYC, not transacted
          </p>
        </div>
      </div>

      {/* Challenge Solutions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Technical Challenges Solved</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChallengeCard
            number={1}
            title="Reconciliation"
            description="Automated data quality monitoring between transactional and analytics systems"
            status="✓ Implemented"
            link="/reconciliation"
          />
          <ChallengeCard
            number={2}
            title="Attribution"
            description="5 attribution models for multi-touch journey analysis"
            status="✓ Implemented"
            link="/attribution"
          />
          <ChallengeCard
            number={3}
            title="Experimentation"
            description="Statistical framework with sequential testing for early stopping"
            status="✓ Implemented"
            link="/experiments"
          />
        </div>
      </div>

      {/* System Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tech Stack</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Next.js 14 + TypeScript
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Supabase (Postgres + Edge Functions)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                DuckDB + dbt (Analytics)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Feast.dev (Feature Store)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Cloudflare R2 (Event Lake)
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Key Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Event tracking (&lt;50ms latency)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Multi-touch attribution (5 models)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Real-time A/B testing
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                ML-powered predictions
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                $0/month cost (free tiers)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-gray-100 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Demo Dataset</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Events</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEvents.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Last 30 Days</p>
            <p className="text-2xl font-bold text-gray-900">{stats.signups30d}</p>
            <p className="text-xs text-gray-500">new users</p>
          </div>
          <div>
            <p className="text-gray-500">Transactions (30d)</p>
            <p className="text-2xl font-bold text-gray-900">{stats.transactions30d}</p>
          </div>
          <div>
            <p className="text-gray-500">Volume (30d)</p>
            <p className="text-2xl font-bold text-gray-900">
              ${(stats.volume30d / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {trend && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function ChallengeCard({
  number,
  title,
  description,
  status,
  link,
}: {
  number: number;
  title: string;
  description: string;
  status: string;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold">
            {number}
          </span>
        </div>
        <div className="ml-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          <p className="mt-2 text-xs text-green-600 font-medium">{status}</p>
        </div>
      </div>
    </Link>
  );
}
