import { useState, useEffect } from 'react';

const MetricCard = ({ title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
};

const ITPanel = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refrescar cada 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Panel de TI (Métricas Reales)</h1>
          <button onClick={fetchMetrics} disabled={isLoading} className="...">
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p className="font-bold">Sistema Integrado</p>
          <p>Mostrando métricas en tiempo real desde Prometheus.</p>
        </div>

        {error && <div className="bg-red-100 ...">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Sesiones SMTP (Total)" value={metrics?.smtp_sessions_total || 'Loading...'} />
          <MetricCard title="Peticiones JMAP (Total)" value={metrics?.jmap_requests_total || 'Loading...'} />
          <MetricCard title="Uso de CPU (Stalwart)" value={metrics?.cpu_usage ? `${parseFloat(metrics.cpu_usage).toFixed(2)} %` : 'Loading...'} />
          <MetricCard title="Uso de Memoria (Stalwart)" value={metrics?.memory_usage || 'Loading...'} />
        </div>
      </main>
    </div>
  );
};

ITPanel.auth = true;
export default ITPanel;
