const prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
const lokiUrl = process.env.LOKI_URL || 'http://loki:3100';
const resticUrl = process.env.RESTIC_STATUS_URL || 'http://restic-scheduler:8000/status';

export async function queryPrometheus(expr: string) {
  const response = await fetch(`${prometheusUrl}/api/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ query: expr })
  });
  if (!response.ok) {
    throw new Error(`Prometheus error: ${response.status}`);
  }
  const data = await response.json();
  return data.data?.result ?? [];
}

export async function rangePrometheus(expr: string, minutes = 60) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - minutes * 60;
  const response = await fetch(
    `${prometheusUrl}/api/v1/query_range?query=${encodeURIComponent(expr)}&start=${start}&end=${end}&step=60`
  );
  if (!response.ok) {
    throw new Error(`Prometheus error: ${response.status}`);
  }
  const data = await response.json();
  return data.data?.result ?? [];
}

export async function queryLoki(limit = 20) {
  const params = new URLSearchParams({
    query: '{level=~"error|warning"}',
    limit: limit.toString()
  });
  const response = await fetch(`${lokiUrl}/loki/api/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!response.ok) {
    throw new Error(`Loki error: ${response.status}`);
  }
  const data = await response.json();
  return data.data?.result ?? [];
}

export async function fetchResticStatus() {
  const response = await fetch(resticUrl);
  if (!response.ok) {
    throw new Error(`Restic scheduler error: ${response.status}`);
  }
  return response.json();
}
