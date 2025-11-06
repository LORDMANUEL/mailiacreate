import express from 'express';
import multer from 'multer';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { Queue, Worker, QueueEvents, QueueScheduler } from 'bullmq';
import client from 'prom-client';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const PORT = Number(process.env.PORT || 4000);
const QUEUE_NAME = process.env.SEND_ROUTER_QUEUE || 'send-router-jobs';
const REDIS_HOST = process.env.SEND_ROUTER_REDIS_HOST || 'send-router-redis';
const REDIS_PORT = Number(process.env.SEND_ROUTER_REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.SEND_ROUTER_REDIS_PASSWORD || undefined;
const MAX_ATTEMPTS = Number(process.env.SEND_ROUTER_MAX_ATTEMPTS || 5);
const BACKOFF_DELAY = Number(process.env.SEND_ROUTER_BACKOFF_MS || 3000);
const CONCURRENCY = Number(process.env.SEND_ROUTER_CONCURRENCY || 4);
const STORAGE_BACKENDS = (process.env.SEND_ROUTER_STORAGE || '').split(',').filter(Boolean);
const SMTP_FROM = process.env.SEND_ROUTER_SMTP_FROM || 'no-reply@mail.example.com';
const AI_URL = process.env.SEND_ROUTER_AI_URL || '';
const AI_THRESHOLD = Number(process.env.SEND_ROUTER_AI_THRESHOLD || 0.75);
const AI_ENFORCE = process.env.SEND_ROUTER_AI_ENFORCE === 'true';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.SEND_ROUTER_MAX_ATTACHMENT || 25) * 1024 * 1024 }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const enqueueCounter = new client.Counter({
  name: 'send_router_jobs_enqueued_total',
  help: 'Total de trabajos encolados por canal',
  labelNames: ['channel']
});
const completedCounter = new client.Counter({
  name: 'send_router_jobs_completed_total',
  help: 'Total de trabajos completados por canal',
  labelNames: ['channel', 'status']
});
const failedCounter = new client.Counter({
  name: 'send_router_jobs_failed_total',
  help: 'Total de trabajos fallidos por canal',
  labelNames: ['channel']
});
const queueGauge = new client.Gauge({
  name: 'send_router_queue_jobs',
  help: 'Cantidad de trabajos en la cola por estado',
  labelNames: ['state']
});
const processingGauge = new client.Gauge({
  name: 'send_router_jobs_processing',
  help: 'Trabajos actualmente en proceso',
  labelNames: ['channel']
});
const aiRiskGauge = new client.Gauge({
  name: 'send_router_ai_last_risk',
  help: 'Último puntaje de riesgo devuelto por IA',
  labelNames: ['channel']
});

register.registerMetric(enqueueCounter);
register.registerMetric(completedCounter);
register.registerMetric(failedCounter);
register.registerMetric(queueGauge);
register.registerMetric(processingGauge);
register.registerMetric(aiRiskGauge);

const redisConnection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD
};

const queue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: MAX_ATTEMPTS,
    backoff: { type: 'exponential', delay: BACKOFF_DELAY },
    removeOnComplete: 200,
    removeOnFail: 1000
  }
});

const queueScheduler = new QueueScheduler(QUEUE_NAME, { connection: redisConnection });
queueScheduler.waitUntilReady().catch((error) => {
  console.error('[send-router] queue scheduler unavailable', error.message);
});

const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection });
queueEvents.on('error', (error) => {
  console.error('[send-router] queue event error', error.message);
});
queueEvents.waitUntilReady().catch((error) => {
  console.error('[send-router] queue events unavailable', error.message);
});

let mailer;
if (process.env.SEND_ROUTER_SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SEND_ROUTER_SMTP_HOST,
    port: Number(process.env.SEND_ROUTER_SMTP_PORT || 587),
    secure: process.env.SEND_ROUTER_SMTP_SECURE === 'true',
    auth: process.env.SEND_ROUTER_SMTP_USER
      ? {
          user: process.env.SEND_ROUTER_SMTP_USER,
          pass: process.env.SEND_ROUTER_SMTP_PASSWORD || ''
        }
      : undefined,
    tls: {
      rejectUnauthorized: process.env.SEND_ROUTER_SMTP_TLS_STRICT === 'true'
    }
  });
}

const s3Enabled = Boolean(
  process.env.SEND_ROUTER_S3_BUCKET &&
    process.env.SEND_ROUTER_S3_ACCESS_KEY &&
    process.env.SEND_ROUTER_S3_SECRET_KEY &&
    process.env.SEND_ROUTER_S3_ENDPOINT
);

function hmac(key, string) {
  return crypto.createHmac('sha256', key).update(string).digest();
}

async function uploadToObjectStorage({ bucket, key, body, contentType }) {
  const endpoint = new URL(process.env.SEND_ROUTER_S3_ENDPOINT);
  const region = process.env.SEND_ROUTER_S3_REGION || 'us-east-1';
  const accessKey = process.env.SEND_ROUTER_S3_ACCESS_KEY;
  const secretKey = process.env.SEND_ROUTER_S3_SECRET_KEY;
  const forcePathStyle = process.env.SEND_ROUTER_S3_FORCE_PATH_STYLE === 'true';
  const service = 's3';
  const method = 'PUT';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const host = forcePathStyle ? endpoint.host : `${bucket}.${endpoint.host}`;
  const path = forcePathStyle ? `/${bucket}/${encodeURI(key)}` : `/${encodeURI(key)}`;
  const hashedPayload = crypto.createHash('sha256').update(body).digest('hex');
  const canonicalHeaders = `host:${host}\n` + `x-amz-content-sha256:${hashedPayload}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
    crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    'Content-Type': contentType || 'application/octet-stream',
    'Content-Length': body.length,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': hashedPayload,
    Authorization: authorization
  };

  const requestOptions = {
    protocol: endpoint.protocol,
    hostname: host,
    port: endpoint.port || (endpoint.protocol === 'https:' ? 443 : 80),
    method,
    path,
    headers
  };

  const transport = endpoint.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(requestOptions, (response) => {
      if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        resolve();
      } else {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk.toString();
        });
        response.on('end', () => {
          reject(new Error(`S3 upload failed: ${response.statusCode} ${data}`));
        });
      }
    });
    req.on('error', (error) => reject(error));
    req.write(body);
    req.end();
  });
}

async function refreshQueueMetrics() {
  try {
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    Object.entries(counts).forEach(([state, count]) => {
      queueGauge.set({ state }, count || 0);
    });
  } catch (error) {
    console.error('[send-router] metrics refresh error', error.message);
  }
}

function normalizeAttachments(req) {
  if (req.files && req.files.length > 0) {
    return req.files.map((file) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      content: file.buffer.toString('base64')
    }));
  }
  if (req.body.attachments) {
    try {
      const parsed = typeof req.body.attachments === 'string' ? JSON.parse(req.body.attachments) : req.body.attachments;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          name: item.name,
          mimeType: item.mimeType || item.contentType,
          size: item.size || Buffer.byteLength(item.content || item.base64 || '', 'base64'),
          content: item.content || item.base64
        }));
      }
    } catch (error) {
      console.warn('[send-router] unable to parse attachments payload', error.message);
    }
  }
  return [];
}

async function runAiPrecheck(payload) {
  if (!AI_URL) return null;
  try {
    const response = await axios.post(
      `${AI_URL.replace(/\/$/, '')}/api/analyze`,
      {
        channel: payload.channel,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments: payload.attachments
      },
      { timeout: Number(process.env.SEND_ROUTER_AI_TIMEOUT || 4000) }
    );
    const risk = Number(response.data?.risk ?? 0);
    aiRiskGauge.set({ channel: payload.channel }, risk);
    if (AI_ENFORCE && risk >= AI_THRESHOLD) {
      throw new Error(`AI precheck blocked delivery. risk=${risk}`);
    }
    return response.data;
  } catch (error) {
    if (AI_ENFORCE) {
      throw error;
    }
    console.warn('[send-router] AI precheck failed, continuing', error.message);
    return null;
  }
}

async function handleEmail(job) {
  if (!mailer) {
    throw new Error('SMTP transport no configurado');
  }
  const { to, subject, text, html, attachments } = job.data.payload;
  const message = {
    from: job.data.payload.from || SMTP_FROM,
    to: to.join(', '),
    subject,
    text,
    html,
    attachments: attachments.map((attachment) => ({
      filename: attachment.name,
      content: Buffer.from(attachment.content, 'base64'),
      contentType: attachment.mimeType
    }))
  };
  const info = await mailer.sendMail(message);
  return {
    channel: 'email',
    status: 'sent',
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected
  };
}

async function resolveMatrixRoom(recipient) {
  const homeserver = process.env.SEND_ROUTER_MATRIX_HOMESERVER || 'https://matrix.example.com';
  const token = process.env.SEND_ROUTER_MATRIX_ACCESS_TOKEN;
  if (!token) throw new Error('Token Matrix no configurado');
  const headers = { Authorization: `Bearer ${token}` };
  if (recipient.startsWith('!')) {
    return recipient;
  }
  if (recipient.startsWith('#')) {
    const response = await axios.get(
      `${homeserver.replace(/\/$/, '')}/_matrix/client/v3/directory/room/${encodeURIComponent(recipient)}`,
      { headers, timeout: 5000 }
    );
    return response.data?.room_id;
  }
  throw new Error('Formato de destino Matrix no soportado (usa !room o #alias)');
}

async function handleMatrix(job) {
  const { to, text, html } = job.data.payload;
  if (!to.length) {
    throw new Error('Destino Matrix requerido');
  }
  const roomId = await resolveMatrixRoom(to[0]);
  const homeserver = process.env.SEND_ROUTER_MATRIX_HOMESERVER || 'https://matrix.example.com';
  const token = process.env.SEND_ROUTER_MATRIX_ACCESS_TOKEN;
  const body = text || html?.replace(/<[^>]+>/g, ' ').trim();
  const txnId = nanoid();
  await axios.put(
    `${homeserver.replace(/\/$/, '')}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`,
    {
      msgtype: 'm.text',
      body: body || '(sin contenido)',
      format: html ? 'org.matrix.custom.html' : undefined,
      formatted_body: html || undefined
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 7000
    }
  );
  return {
    channel: 'matrix',
    status: 'sent',
    roomId,
    transactionId: txnId
  };
}

async function handleWebhook(job) {
  const { to, metadata, ...rest } = job.data.payload;
  if (!to.length) throw new Error('Destino webhook requerido');
  const target = to[0];
  const headers = {};
  if (process.env.SEND_ROUTER_WEBHOOK_TOKEN) {
    headers['x-send-router-token'] = process.env.SEND_ROUTER_WEBHOOK_TOKEN;
  }
  await axios.post(target, { ...rest, metadata }, { headers, timeout: 5000 });
  return { channel: 'webhook', status: 'sent', target };
}

async function handleStorage(job) {
  if (!s3Enabled) {
    throw new Error('Backend de almacenamiento no configurado');
  }
  const bucket = process.env.SEND_ROUTER_S3_BUCKET;
  const prefix = process.env.SEND_ROUTER_S3_PREFIX || 'send-router';
  const stored = [];
  for (const attachment of job.data.payload.attachments) {
    const key = `${prefix}/${job.id}/${attachment.name}`;
    const body = Buffer.from(attachment.content, 'base64');
    await uploadToObjectStorage({
      bucket,
      key,
      body,
      contentType: attachment.mimeType
    });
    stored.push({ bucket, key, size: attachment.size });
  }
  return { channel: 'storage', status: 'stored', objects: stored };
}

const channelHandlers = {
  email: handleEmail,
  matrix: handleMatrix,
  webhook: handleWebhook,
  storage: handleStorage
};

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const handler = channelHandlers[job.data.channel];
    if (!handler) {
      throw new Error(`Canal no soportado: ${job.data.channel}`);
    }
    return handler(job);
  },
  {
    connection: redisConnection,
    concurrency: CONCURRENCY
  }
);

worker.on('active', (job) => {
  processingGauge.inc({ channel: job.data.channel });
});

worker.on('completed', (job, result) => {
  processingGauge.dec({ channel: job.data.channel });
  completedCounter.inc({ channel: job.data.channel, status: result?.status || 'unknown' });
});

worker.on('failed', (job, error) => {
  processingGauge.dec({ channel: job.data.channel });
  failedCounter.inc({ channel: job.data.channel });
  console.error('[send-router] job failed', job.id, error.message);
});

worker.on('error', (error) => {
  console.error('[send-router] worker error', error.message);
});

async function enqueueJob(payload) {
  enqueueCounter.inc({ channel: payload.channel });
  const job = await queue.add('send', payload);
  return job;
}

app.get('/health', async (_req, res) => {
  await refreshQueueMetrics();
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  res.json({
    status: 'ok',
    queue: counts,
    channels: Object.keys(channelHandlers),
    storageBackends: STORAGE_BACKENDS
  });
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = await queue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  const state = await job.getState();
  const response = {
    id: job.id,
    state,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    returnValue: job.returnvalue
  };
  res.json(response);
});

app.get('/metrics', async (_req, res) => {
  await refreshQueueMetrics();
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/api/send', upload.any(), async (req, res) => {
  try {
    const toArray = Array.isArray(req.body.to) ? req.body.to : [req.body.to].filter(Boolean);
    if (!req.body.channel) {
      return res.status(400).json({ error: 'Campo channel requerido' });
    }
    if (!channelHandlers[req.body.channel]) {
      return res.status(400).json({ error: `Canal no soportado: ${req.body.channel}` });
    }
    const payload = {
      channel: req.body.channel,
      to: toArray,
      subject: req.body.subject,
      text: req.body.text,
      html: req.body.html,
      attachments: normalizeAttachments(req),
      metadata: {
        requestId: req.headers['x-request-id'] || nanoid(),
        receivedAt: new Date().toISOString(),
        storageBackends: STORAGE_BACKENDS
      },
      from: req.body.from
    };

    const aiResult = await runAiPrecheck(payload);

    const job = await enqueueJob({ channel: payload.channel, payload });
    res.status(202).json({ id: job.id, status: 'queued', analysis: aiResult });
  } catch (error) {
    console.error('[send-router] failed to enqueue job', error.message);
    res.status(500).json({ error: error.message || 'Failed to enqueue job' });
  }
});

app.post('/api/hooks/alerts', async (req, res) => {
  try {
    const alerts = req.body?.alerts || [];
    alerts.forEach((alert) => {
      console.log('[send-router] alert received', {
        status: alert.status,
        name: alert.labels?.alertname,
        severity: alert.labels?.severity
      });
    });
    res.json({ received: alerts.length });
  } catch (error) {
    console.error('[send-router] failed to record alert', error.message);
    res.status(500).json({ error: 'Failed to record alert' });
  }
});

app.listen(PORT, () => {
  console.log(`[send-router] listening on port ${PORT}`);
});
