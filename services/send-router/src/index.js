import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { nanoid } from 'nanoid';

const PORT = process.env.PORT || 4000;
const STORAGE_BACKENDS = (process.env.SEND_ROUTER_STORAGE || '').split(',').filter(Boolean);
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const channelHandlers = {
  email: async (payload) => {
    console.log(`[send-router] email handler placeholder`, payload);
    return { id: nanoid(), status: 'queued', channel: 'email' };
  },
  matrix: async (payload) => {
    console.log(`[send-router] matrix handler placeholder`, payload);
    return { id: nanoid(), status: 'queued', channel: 'matrix' };
  },
  webhook: async (payload) => {
    if (!payload.to?.length) throw new Error('Webhook destination missing');
    const target = payload.to[0];
    await axios.post(target, payload.body ?? payload, { timeout: 5000 });
    return { id: nanoid(), status: 'sent', channel: 'webhook' };
  },
  storage: async (payload) => {
    console.log(`[send-router] storage handler placeholder`, payload.metadata);
    return { id: nanoid(), status: 'stored', channel: 'storage' };
  }
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', channels: Object.keys(channelHandlers) });
});

app.post('/api/send', upload.any(), async (req, res) => {
  try {
    const { channel, to, subject, text, html } = req.body;
    if (!channelHandlers[channel]) {
      return res.status(400).json({ error: `Unsupported channel: ${channel}` });
    }
    const attachments = (req.files || []).map((file) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer.toString('base64')
    }));

    const response = await channelHandlers[channel]({
      to: Array.isArray(to) ? to : [to].filter(Boolean),
      subject,
      text,
      html,
      attachments,
      metadata: {
        requestId: req.headers['x-request-id'] || nanoid(),
        receivedAt: new Date().toISOString(),
        storageBackends: STORAGE_BACKENDS
      }
    });

    res.json(response);
  } catch (error) {
    console.error('[send-router] failed to deliver', error.message);
    res.status(500).json({ error: 'Failed to deliver message' });
  }
});

app.listen(PORT, () => {
  console.log(`[send-router] listening on port ${PORT}`);
});
