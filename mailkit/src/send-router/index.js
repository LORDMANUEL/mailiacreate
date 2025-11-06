const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// --- Channel Handlers (Simulated) ---

const handleEmail = (payload) => {
  console.log('--- Handling Email Channel ---');
  console.log(`Simulating sending email to: ${payload.to.join(', ')}`);
  console.log(`Subject: ${payload.subject}`);
  console.log('Nodemailer would be used here in a real implementation.');
  console.log('---------------------------\n');
  return { status: 'success', message: `Email delivery simulated for ${payload.to.length} recipients.` };
};

const handleMatrix = (payload) => {
  console.log('--- Handling Matrix Channel ---');
  console.log(`Simulating sending Matrix message to room/user: ${payload.to[0]}`);
  console.log(`Message: ${payload.text}`);
  console.log('Axios would be used to call the Matrix client-server API here.');
  console.log('---------------------------\n');
  return { status: 'success', message: `Matrix message simulation sent to ${payload.to[0]}.` };
};

const handleWebhook = (payload) => {
  console.log('--- Handling Webhook Channel ---');
  console.log(`Simulating POSTing to webhook URL: ${payload.to[0]}`);
  console.log('Axios would be used to send the webhook here.');
  console.log('----------------------------\n');
  return { status: 'success', message: `Webhook simulation sent to ${payload.to[0]}.` };
};

const channelHandlers = {
  email: handleEmail,
  matrix: handleMatrix,
  webhook: handleWebhook,
};

// --- API Endpoint ---

app.post('/api/send', (req, res) => {
  const { channel, to, subject, text, html, attachments } = req.body;

  // Basic validation
  if (!channel || !to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ error: '`channel` and a non-empty `to` array are required.' });
  }

  if (!channelHandlers[channel]) {
    return res.status(400).json({ error: `Invalid channel '${channel}'. Supported channels are: ${Object.keys(channelHandlers).join(', ')}.` });
  }

  // Route to the appropriate handler
  const result = channelHandlers[channel](req.body);

  res.status(202).json({
    message: `Request accepted for channel '${channel}'.`,
    details: result,
  });
});

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Send-Router service listening at http://localhost:${port}`);
  });
}

module.exports = app; // Export for testing
