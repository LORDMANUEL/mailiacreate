const request = require('supertest');
const app = require('./index');
const nodemailer = require('nodemailer');
const axios = require('axios');

// --- Mocks ---
jest.mock('nodemailer');
jest.mock('axios');

const sendMailMock = jest.fn((options, callback) => callback(null, { messageId: 'mock-id' }));
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

describe('Send-Router API', () => {

  beforeEach(() => {
    sendMailMock.mockClear();
    axios.put.mockClear();
    axios.post.mockClear();
    // Configura mocks por defecto para que las pruebas pasen
    axios.put.mockResolvedValue({ data: { event_id: 'mock-event-id' } });
    axios.post.mockResolvedValue({ data: { status: 'ok' } });
  });

  // ... (pruebas existentes para 'email' y validación)

  it('should call the matrix handler and succeed', async () => {
    const payload = { channel: 'matrix', to: ['!roomid:server'], text: 'Hello' };
    const res = await request(app).post('/api/send').send(payload);

    expect(res.statusCode).toEqual(202);
    expect(res.body.details.status).toEqual('success');
    expect(axios.put).toHaveBeenCalledTimes(1);
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/_matrix/client/v3/rooms/'),
      expect.objectContaining({ body: 'Hello' }),
      expect.any(Object)
    );
  });

  it('should call the webhook handler and succeed', async () => {
    const payload = { channel: 'webhook', to: ['https://example.com/hook'], message: 'data' };
    const res = await request(app).post('/api/send').send(payload);

    expect(res.statusCode).toEqual(202);
    expect(res.body.details.status).toEqual('success');
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith('https://example.com/hook', payload);
  });

  it('should handle Matrix API errors', async () => {
    axios.put.mockRejectedValue(new Error('Matrix network error'));
    const payload = { channel: 'matrix', to: ['!room:server'], text: 'fail' };
    const res = await request(app).post('/api/send').send(payload);

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Failed to process request');
  });

});
