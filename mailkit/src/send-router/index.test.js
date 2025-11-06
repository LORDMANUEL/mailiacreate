const request = require('supertest');
const app = require('./index'); // Import the Express app

describe('Send-Router API', () => {

  describe('POST /api/send', () => {

    it('should return 400 if channel is missing', async () => {
      const res = await request(app)
        .post('/api/send')
        .send({ to: ['test@example.com'] });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('`channel` and a non-empty `to` array are required.');
    });

    it('should return 400 if to is missing or empty', async () => {
      const res1 = await request(app)
        .post('/api/send')
        .send({ channel: 'email' });
      expect(res1.statusCode).toEqual(400);

      const res2 = await request(app)
        .post('/api/send')
        .send({ channel: 'email', to: [] });
      expect(res2.statusCode).toEqual(400);
    });

    it('should return 400 for an invalid channel', async () => {
      const res = await request(app)
        .post('/api/send')
        .send({ channel: 'sms', to: ['+1234567890'] });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain("Invalid channel 'sms'");
    });

    it('should return 202 and route to the email handler', async () => {
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
      expect(res.body.message).toEqual("Request accepted for channel 'email'.");
      expect(res.body.details.status).toEqual('success');
    });

    it('should return 202 and route to the matrix handler', async () => {
        const payload = {
          channel: 'matrix',
          to: ['@user:matrix.org'],
          text: 'Hello from the test suite!',
        };
        const res = await request(app)
          .post('/api/send')
          .send(payload);
        expect(res.statusCode).toEqual(202);
        expect(res.body.message).toEqual("Request accepted for channel 'matrix'.");
        expect(res.body.details.status).toEqual('success');
      });

      it('should return 202 and route to the webhook handler', async () => {
        const payload = {
          channel: 'webhook',
          to: ['https://example.com/webhook'],
          data: { message: 'Hello webhook!' },
        };
        const res = await request(app)
          .post('/api/send')
          .send(payload);
        expect(res.statusCode).toEqual(202);
        expect(res.body.message).toEqual("Request accepted for channel 'webhook'.");
        expect(res.body.details.status).toEqual('success');
      });
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ok');
    });
  });

});
