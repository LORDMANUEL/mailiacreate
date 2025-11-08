import axios from 'axios';

const PROMETHEUS_URL = 'http://prometheus:9090';

// Función auxiliar para construir y ejecutar consultas PromQL
const queryPrometheus = async (query) => {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query },
    });
    return response.data.data.result[0]?.value[1] || 'N/A';
  } catch (error) {
    console.error(`Prometheus query failed for "${query}":`, error.message);
    return 'Error';
  }
};

export default async function handler(req, res) {
  // En una app real, verificaríamos la sesión del usuario aquí

  try {
    const metrics = {
      smtp_sessions_total: await queryPrometheus('sum(stalwart_smtp_sessions_total)'),
      jmap_requests_total: await queryPrometheus('sum(stalwart_jmap_requests_total)'),
      cpu_usage: await queryPrometheus('sum(rate(process_cpu_seconds_total{job="stalwart"}[1m])) * 100'),
      memory_usage: await queryPrometheus('process_resident_memory_bytes{job="stalwart"}'),
    };

    // Formatear la memoria a MB para una mejor lectura
    if (metrics.memory_usage && metrics.memory_usage !== 'N/A') {
      metrics.memory_usage = `${(metrics.memory_usage / 1024 / 1024).toFixed(2)} MB`;
    }

    res.status(200).json(metrics);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics from Prometheus' });
  }
}
