import express from 'express';
import client from 'prom-client';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const PORT = Number(process.env.PORT || 4100);
const MAX_BODY = Number(process.env.AI_ORCHESTRATOR_MAX_BODY_KB || 2048) * 1024;

const suspiciousTerms = [
  'winner',
  'lottery',
  'bitcoin',
  'urgent',
  'password',
  'bank transfer',
  'viagra',
  'limited offer',
  'wire now',
  'guaranteed return',
  'account suspended'
];

const bulkIndicators = ['mailing list', 'unsubscribe', 'newsletter', 'mass message'];
const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'for', 'with', 'to', 'de', 'la', 'el', 'los', 'las']);

const app = express();
app.use(express.json({ limit: MAX_BODY }));

const DATA_DIR = process.env.AI_DATA_DIR || path.join(process.cwd(), 'data');
const FEEDBACK_FILE = process.env.AI_FEEDBACK_FILE || path.join(DATA_DIR, 'feedback.json');
const MAX_FEEDBACK = Number(process.env.AI_FEEDBACK_MAX_ITEMS || 500);
let feedbackBuffer = [];

async function bootstrapFeedbackStore() {
  try {
    await fs.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
    const existing = await fs.readFile(FEEDBACK_FILE, 'utf-8');
    feedbackBuffer = JSON.parse(existing);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('[ai-orchestrator] No se pudo cargar feedback existente:', error.message);
    }
    feedbackBuffer = [];
  }
}

const feedbackReady = bootstrapFeedbackStore();

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const classificationCounter = new client.Counter({
  name: 'ai_orchestrator_classifications_total',
  help: 'Total de análisis clasificados por categoría',
  labelNames: ['classification']
});

const riskHistogram = new client.Histogram({
  name: 'ai_orchestrator_risk_score',
  help: 'Distribución de puntajes de riesgo calculados',
  labelNames: ['channel'],
  buckets: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]
});

const feedbackCounter = new client.Counter({
  name: 'ai_orchestrator_feedback_total',
  help: 'Cantidad de muestras de feedback registradas',
  labelNames: ['label']
});

register.registerMetric(classificationCounter);
register.registerMetric(riskHistogram);
register.registerMetric(feedbackCounter);

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ');
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function summarise(text, maxSentences = 2) {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) {
    return sentences.join('. ');
  }
  return sentences.slice(0, maxSentences).join('. ');
}

function scoreMessage(payload) {
  const channel = payload.channel || 'email';
  const subject = payload.subject || '';
  const text = `${subject} ${payload.text || ''} ${stripHtml(payload.html || '')}`.trim();
  const lower = text.toLowerCase();
  const words = lower.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  let risk = 0.1;
  const indicators = [];
  const tags = new Set();

  suspiciousTerms.forEach((term) => {
    if (lower.includes(term)) {
      risk += 0.12;
      indicators.push(term);
    }
  });

  bulkIndicators.forEach((term) => {
    if (lower.includes(term)) {
      risk += 0.08;
      tags.add('bulk');
    }
  });

  const recipients = Array.isArray(payload.to) ? payload.to.length : 0;
  if (recipients >= 20) {
    risk += 0.15;
    tags.add('bulk');
  } else if (recipients >= 5) {
    risk += 0.08;
  }

  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  const totalAttachmentSize = attachments.reduce((sum, file) => sum + (file.size || 0), 0);
  if (attachments.length > 3 || totalAttachmentSize > 20 * 1024 * 1024) {
    risk += 0.12;
    tags.add('large_attachments');
  }
  if (attachments.some((file) => /\.(exe|bat|js|scr|ps1)$/i.test(file.name || ''))) {
    risk += 0.25;
    tags.add('executable_attachment');
    indicators.push('executable_attachment');
  }

  if (/http:\/\//.test(lower)) {
    risk += 0.1;
    indicators.push('insecure_link');
  }

  if (subject.toLowerCase().includes('re:') && !lower.includes('>')) {
    risk += 0.05;
    tags.add('thread_spoof');
  }

  risk = Math.min(1, Math.max(0, risk));

  let classification = 'low';
  if (risk >= 0.8) {
    classification = 'high';
  } else if (risk >= 0.5) {
    classification = 'medium';
  }

  const recommendations = [];
  if (classification === 'high') {
    recommendations.push('Revisar manualmente antes de entregar');
  }
  if (tags.has('bulk')) {
    recommendations.push('Aplicar rate-limit y análisis de reputación');
  }
  if (tags.has('executable_attachment')) {
    recommendations.push('Escanear adjuntos con antivirus');
  }

  const summary = summarise(text);

  const keywords = Array.from(
    words.reduce((map, word) => {
      if (!stopWords.has(word) && word.length > 3) {
        map.set(word, (map.get(word) || 0) + 1);
      }
      return map;
    }, new Map())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  classificationCounter.inc({ classification });
  riskHistogram.observe({ channel }, risk);

  return {
    id: crypto.randomUUID(),
    channel,
    risk: Number(risk.toFixed(2)),
    classification,
    indicators,
    tags: Array.from(tags),
    recommendations,
    summary,
    keywords
  };
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/api/analyze', (req, res) => {
  try {
    const payload = req.body || {};
    const result = scoreMessage(payload);
    res.json(result);
  } catch (error) {
    console.error('[ai-orchestrator] analyze error', error.message);
    res.status(400).json({ error: 'Invalid payload' });
  }
});

app.post('/api/summarize', (req, res) => {
  try {
    const text = `${req.body?.subject || ''} ${req.body?.text || ''} ${stripHtml(req.body?.html || '')}`;
    const summary = summarise(text, Number(req.body?.sentences || 2));
    res.json({ summary });
  } catch (error) {
    console.error('[ai-orchestrator] summarize error', error.message);
    res.status(400).json({ error: 'Invalid payload' });
  }
});

app.post('/api/feedback', async (req, res) => {
  await feedbackReady;
  const payload = req.body || {};
  const label = typeof payload.label === 'string' ? payload.label.trim() : '';
  const messageId = typeof payload.messageId === 'string' ? payload.messageId.trim() : crypto.randomUUID();
  if (!label) {
    return res.status(400).json({ error: 'label is required' });
  }
  if (!['low', 'medium', 'high'].includes(label)) {
    return res.status(400).json({ error: 'label must be low, medium or high' });
  }
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';
  const sample = {
    id: messageId,
    label,
    indicators: Array.isArray(payload.indicators) ? payload.indicators.slice(0, 10) : [],
    submittedAt: new Date().toISOString(),
    notes
  };
  feedbackBuffer = [sample, ...feedbackBuffer].slice(0, MAX_FEEDBACK);
  try {
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbackBuffer, null, 2));
  } catch (error) {
    console.error('[ai-orchestrator] No se pudo persistir feedback', error.message);
    return res.status(500).json({ error: 'Unable to persist feedback' });
  }
  feedbackCounter.inc({ label });
  res.status(201).json(sample);
});

app.listen(PORT, () => {
  console.log(`[ai-orchestrator] Listening on :${PORT}`);
});
