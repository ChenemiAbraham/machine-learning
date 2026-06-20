export default function DemoPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Interactive Demo</h1>
        <p className="mt-1 text-gray-600">
          Experience the full user journey with live event tracking, attribution, and experiments
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-12 h-12 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Interactive Demo Coming Soon</h2>
          <p className="mt-2 text-gray-600">
            This page will feature a simulated user journey where you can:
          </p>
          <ul className="mt-4 text-left space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Track events in real-time as you navigate</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Get assigned to experiment variants</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Complete a mock KYC flow</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Simulate a transaction</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>See attribution calculated live</span>
            </li>
          </ul>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>For now</strong>, explore the Attribution and Experiments dashboards using the demo
              dataset with 1,000 users and 50,000+ events.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/attribution"
          className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-semibold text-gray-900">View Attribution</h3>
          <p className="mt-2 text-sm text-gray-600">
            Compare 5 attribution models on real conversion data
          </p>
        </a>
        <a
          href="/experiments"
          className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-semibold text-gray-900">View Experiments</h3>
          <p className="mt-2 text-sm text-gray-600">
            See live A/B test results with statistical analysis
          </p>
        </a>
        <a
          href="/"
          className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-semibold text-gray-900">Overview Dashboard</h3>
          <p className="mt-2 text-sm text-gray-600">
            See key metrics and system architecture
          </p>
        </a>
      </div>
    </div>
  );
}
