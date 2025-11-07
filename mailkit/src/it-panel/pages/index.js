import { useState, useEffect } from 'react';

const API_BASE_URL = '/api'; // Use a relative path to be proxied by Caddy

const MetricCard = ({ title, value, status = 'none' }) => {
  const statusColors = {
    none: 'bg-white',
    ok: 'bg-green-50',
    warning: 'bg-yellow-50',
    error: 'bg-red-50',
  };
  return (
    <div className={`${statusColors[status]} p-6 rounded-lg shadow-md`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
};

const ITPanel = () => {
  const [health, setHealth] = useState(null);
  const [backups, setBackups] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      // Reset loading state for visual feedback on refresh
      setIsLoading(true);
      const [healthRes, backupsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/it/health`),
        fetch(`${API_BASE_URL}/it/backups`),
      ]);
      if (!healthRes.ok) throw new Error('Failed to fetch health metrics');
      if (!backupsRes.ok) throw new Error('Failed to fetch backup status');

      const healthData = await healthRes.json();
      const backupsData = await backupsRes.json();

      setHealth(healthData);
      setBackups(backupsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">IT Panel</h1>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Modo de Demostración</p>
          <p>Este panel está funcionando con una API de simulación. Las métricas mostradas son datos de ejemplo y no reflejan el estado real del sistema.</p>
        </div>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        {isLoading && !health && (
          <div className="text-center text-gray-500">Loading initial data...</div>
        )}

        {/* Health Metrics */}
        <section>
          <h2 className="text-xl font-semibold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="System Status" value={health?.status.toUpperCase()} status={health?.status} />
            <MetricCard title="Uptime" value={health?.uptime} />
            <MetricCard title="SMTP Queue" value={health?.smtpQueue} status={health?.smtpQueue > 5 ? 'warning' : 'ok'} />
            <MetricCard title="JMAP Requests (last min)" value={health?.jmapRequests} />
            <MetricCard title="CPU Usage" value={health?.cpuUsage} />
            <MetricCard title="Memory Usage" value={health?.memoryUsage} />
          </div>
        </section>

        {/* Backup Status */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Backup Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Last Backup" value={backups ? new Date(backups.lastBackup).toLocaleString() : 'N/A'} />
            <MetricCard title="Backup Status" value={backups?.status.toUpperCase()} status={backups?.status === 'success' ? 'ok' : 'error'} />
            <MetricCard title="Backup Size" value={backups?.size} />
            <MetricCard title="Next Scheduled Backup" value={backups ? new Date(backups.nextBackup).toLocaleString() : 'N/A'} />
          </div>
        </section>

      </main>
    </div>
  );
};

ITPanel.auth = true;
export default ITPanel;
