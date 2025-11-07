const request = require('supertest');
const app = require('./index'); // Import the Express app
const nodemailer = require('nodemailer');

// --- Mock de Nodemailer ---
// Simula el transporte de nodemailer para evitar llamadas de red reales en las pruebas.
const sendMailMock = jest.fn((mailOptions, callback) => {
  callback(null, { messageId: 'mock-message-id' });
});

jest.mock('nodemailer');
nodemailer.createTransport.mockReturnValue({
  sendMail: sendMailMock,
});


describe('Send-Router API', () => {

  beforeEach(() => {
    // Limpia los mocks antes de cada prueba
    sendMailMock.mockClear();
    nodemailer.createTransport.mockClear();
  });

  describe('POST /api/send', () => {

    it('should return 400 if channel is missing', async () => {
      // ... (sin cambios)
    });

    it('should call the email handler and succeed', async () => {
      const payload = {
        channel: 'email',
        to: ['test@example.com'],
        subject: 'Test Email',
        text: 'This is a test.',
      };
      const res = await request(app)
        .post('/api/send')
        .send(payload);

      expect(res.statusCode).toEqual(202);
      expect(res.body.details.status).toEqual('success');
      expect(res.body.details.messageId).toEqual('mock-message-id');

      // Verificar que el transporte de nodemailer fue llamado correctamente
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email',
        }),
        expect.any(Function)
      );
    });

    // ... (otras pruebas sin cambios)

  });

  describe('GET /health', () => {
    // ... (sin cambios)
  });

});
