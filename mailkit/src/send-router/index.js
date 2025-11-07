const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// --- Configuración del Transporte SMTP ---
// Estas variables deben provenir de variables de entorno
const smtpConfig = {
  host: "stalwart", // El nombre del servicio de Docker
  port: 587, // Puerto de sumisión
  secure: false, // TLS se iniciará con STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // No rechazar certificados autofirmados en un entorno de laboratorio
    rejectUnauthorized: false
  }
};

const transporter = nodemailer.createTransport(smtpConfig);


// --- Channel Handlers ---

const handleEmail = async (payload) => {
  console.log('--- Handling Email Channel (Real) ---');
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_USER}" <${process.env.SMTP_USER}>`,
      to: payload.to.join(', '),
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    console.log('Email sent successfully:', info.messageId);
    return { status: 'success', messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('SMTP Error: ' + error.message);
  }
};

const handleMatrix = (payload) => {
  console.log('--- Handling Matrix Channel (Simulated) ---');
  console.log(`Simulating sending Matrix message to: ${payload.to[0]}`);
  return { status: 'simulated', message: 'Matrix message not sent.' };
};

const handleWebhook = (payload) => {
  console.log('--- Handling Webhook Channel (Simulated) ---');
  console.log(`Simulating POSTing to webhook URL: ${payload.to[0]}`);
  return { status: 'simulated', message: 'Webhook not sent.' };
};

const channelHandlers = {
  email: handleEmail,
  matrix: handleMatrix,
  webhook: handleWebhook,
};

// --- API Endpoint ---

app.post('/api/send', async (req, res) => {
  const { channel, to } = req.body;

  if (!channel || !to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ error: '`channel` and `to` are required.' });
  }

  if (!channelHandlers[channel]) {
    return res.status(400).json({ error: `Invalid channel '${channel}'.` });
  }

  try {
    const result = await channelHandlers[channel](req.body);
    res.status(202).json({
      message: `Request processed for channel '${channel}'.`,
      details: result,
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to process request for channel '${channel}'.`,
      details: error.message,
    });
  }
});


// ... (resto del archivo sin cambios)
