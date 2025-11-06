import http from 'node:http';
import { spawn } from 'node:child_process';
import * as Sentry from '@sentry/node';

const PORT = Number(process.env.SYNTHETIC_EXPORTER_PORT || 8090);
const HOST = process.env.SYNTHETIC_EXPORTER_HOST || '0.0.0.0';
const TARGET_HOST = process.env.SYNTHETIC_TARGET_HOST || '';
const INTERVAL = Number(process.env.SYNTHETIC_INTERVAL_SECONDS || 300) * 1000;
const SCRIPT_PATH = process.env.SYNTHETIC_SCRIPT_PATH || '/app/synthetic-checks.sh';
const EXTRA_ARGS = process.env.SYNTHETIC_EXTRA_ARGS || '';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1)
  });
}

if (!TARGET_HOST) {
  // eslint-disable-next-line no-console
  console.warn('SYNTHETIC_TARGET_HOST is not defined; exporter will remain idle.');
}

const state = {
  lastRun: null,
  status: 'unknown',
  results: [],
  failures: 0
};

function runChecks() {
  if (!TARGET_HOST) {
    return;
  }
  const args = ['--host', TARGET_HOST, '--json'];
  if (EXTRA_ARGS) {
    for (const token of EXTRA_ARGS.split(' ')) {
      if (token) {
        args.push(token);
      }
    }
  }
  const child = spawn('bash', [SCRIPT_PATH, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.on('close', (code) => {
    state.lastRun = new Date().toISOString();
    if (code !== 0) {
      state.status = 'error';
      state.results = [];
      state.failures += 1;
      // eslint-disable-next-line no-console
      console.error(`synthetic-checks failed (${code}): ${stderr.trim()}`);
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage('synthetic-checks failed', {
          level: 'error',
          extra: { code, stderr: stderr.trim() }
        });
      }
    } else {
      try {
        const parsed = JSON.parse(stdout || '{}');
        state.status = parsed.status || 'unknown';
        state.results = Array.isArray(parsed.results) ? parsed.results : [];
      } catch (error) {
        state.status = 'error';
        state.results = [];
        state.failures += 1;
        // eslint-disable-next-line no-console
        console.error(`Unable to parse synthetic output: ${error.message}`);
        if (process.env.SENTRY_DSN) {
          Sentry.captureException(error);
        }
      }
    }
  });
}

setInterval(runChecks, INTERVAL).unref();
runChecks();

function renderMetrics() {
  const lines = [];
  const overall = state.status === 'ok' ? 1 : state.status === 'warn' ? 0.5 : 0;
  lines.push('# HELP synthetic_overall_status Synthetic health status (1 ok, 0.5 warn, 0 error)');
  lines.push('# TYPE synthetic_overall_status gauge');
  lines.push(`synthetic_overall_status ${overall}`);
  lines.push('# HELP synthetic_last_run_timestamp_seconds Last successful synthetic execution timestamp');
  lines.push('# TYPE synthetic_last_run_timestamp_seconds gauge');
  const ts = state.lastRun ? Math.floor(new Date(state.lastRun).getTime() / 1000) : 0;
  lines.push(`synthetic_last_run_timestamp_seconds ${ts}`);
  lines.push('# HELP synthetic_failures_total Total number of synthetic execution failures');
  lines.push('# TYPE synthetic_failures_total counter');
  lines.push(`synthetic_failures_total ${state.failures}`);
  lines.push('# HELP synthetic_check_status Individual check status (1 ok, 0.5 warn, 0 error)');
  lines.push('# TYPE synthetic_check_status gauge');
  for (const result of state.results) {
    const status = result.status === 'ok' ? 1 : result.status === 'warn' ? 0.5 : 0;
    const name = result.name?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
    const target = result.target?.replace(/"/g, '') || '';
    lines.push(`synthetic_check_status{check="${name}",target="${target}"} ${status}`);
  }
  return `${lines.join('\n')}\n`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/metrics') {
    const body = renderMetrics();
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    res.end(body);
    return;
  }
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: state.status,
        lastRun: state.lastRun,
        failures: state.failures
      })
    );
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

if (process.env.SENTRY_DSN) {
  process.on('unhandledRejection', (error) => {
    Sentry.captureException(error);
  });
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error);
  });
}

server.on('error', (error) => {
  console.error('[synthetic-exporter] server error', error.message);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Synthetic exporter listening on ${HOST}:${PORT}`);
});
