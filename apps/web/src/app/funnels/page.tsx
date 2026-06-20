export default function FunnelsPage() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversion Funnels</h1>
        <p className="mt-1 text-gray-600">
          Analyze drop-off rates at each stage of the user journey
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-900">
          🚧 Funnel analysis coming soon with DuckDB integration
        </p>
        <p className="text-sm text-blue-700 mt-2">
          Will show: Install → Signup → KYC → First Transaction → Repeat User
        </p>
      </div>
    </div>
  );
}
