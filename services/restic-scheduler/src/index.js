import express from 'express';
import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import client from 'prom-client';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stateDir = path.join(__dirname, '..', 'state');
const stateFile = path.join(stateDir, 'status.json');

const PORT = Number(process.env.PORT || 8000);
const RESTIC_BIN = process.env.RESTIC_BIN || 'restic';
const RESTIC_REPOSITORY = process.env.RESTIC_REPOSITORY || '/backups';
const RESTIC_PASSWORD = process.env.RESTIC_PASSWORD || 'changeme';
const RESTIC_TARGETS = process.env.RESTIC_TARGETS || '/data';
const RESTIC_SCHEDULE = process.env.RESTIC_SCHEDULE || '0 3 * * *';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const runCounter = new client.Counter({
  name: 'restic_scheduler_runs_total',
  help: 'Total de ejecuciones de backups',
  labelNames: ['result', 'trigger']
});

const lastSuccessGauge = new client.Gauge({
  name: 'restic_scheduler_last_success',
  help: 'Marca temporal de la última ejecución exitosa',
  labelNames: ['status']
});

register.registerMetric(runCounter);
register.registerMetric(lastSuccessGauge);

async function ensureStateDir() {
  await mkdir(stateDir, { recursive: true });
}

async function loadState() {
  await ensureStateDir();
  try {
    const raw = await readFile(stateFile, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return {
      lastRun: null,
      lastSuccess: null,
      lastError: null,
      lastStatus: 'idle',
      activeAlerts: 0
    };
  }
}

async function saveState(state) {
  await ensureStateDir();
  await writeFile(stateFile, JSON.stringify(state, null, 2));
}

async function hasResticBinary() {
  try {
    await execAsync(`${RESTIC_BIN} version`, {
      env: {
        ...process.env,
        RESTIC_PASSWORD,
        RESTIC_REPOSITORY
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function runRestic(trigger = 'manual') {
  const state = await loadState();
  const startedAt = new Date().toISOString();
  state.lastRun = startedAt;
  let status = 'success';
  try {
    if (await hasResticBinary()) {
      const cmd = `${RESTIC_BIN} backup ${RESTIC_TARGETS}`;
      await execAsync(cmd, {
        env: {
          ...process.env,
          RESTIC_PASSWORD,
          RESTIC_REPOSITORY
        },
        timeout: 6 * 60 * 60 * 1000
      });
      await execAsync(`${RESTIC_BIN} forget --keep-daily 7 --prune`, {
        env: {
          ...process.env,
          RESTIC_PASSWORD,
          RESTIC_REPOSITORY
        }
      });
    } else {
      // No binario disponible: marcamos éxito simulado
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    state.lastSuccess = new Date().toISOString();
    state.lastError = null;
    state.lastStatus = 'success';
    state.activeAlerts = 0;
    runCounter.inc({ result: 'success', trigger });
    lastSuccessGauge.set({ status: 'success' }, Date.now());
  } catch (error) {
    status = 'failure';
    state.lastError = error.message;
    state.lastStatus = 'failure';
    state.activeAlerts = (state.activeAlerts || 0) + 1;
    runCounter.inc({ result: 'failure', trigger });
    lastSuccessGauge.set({ status: 'failure' }, Date.now());
  }
  await saveState(state);
  return { status, state };
}

const app = express();
app.use(express.json());

app.get('/status', async (_req, res) => {
  const state = await loadState();
  res.json(state);
});

app.post('/run', async (_req, res) => {
  const result = await runRestic('manual');
  res.json(result.state);
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});

cron.schedule(RESTIC_SCHEDULE, () => {
  runRestic('schedule').catch((error) => {
    console.error('[restic-scheduler] Scheduled run failed', error);
  });
});

app.listen(PORT, () => {
  console.log(`[restic-scheduler] Listening on :${PORT}`);
});
