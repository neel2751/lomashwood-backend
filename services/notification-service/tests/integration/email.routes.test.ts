import request from 'supertest';
import express from 'express';
import { emailRouter } from '../../app/email/email.routes';
import { EmailService } from '../../app/email/email.service';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../app/email/email.service');

const mockService = {
  send: jest.fn(),
  sendBulk: jest.fn(),
  sendWithTemplate: jest.fn(),
} as unknown as jest.Mocked<EmailService>;

const app = express();
app.use(express.json());
app.use('/v1/email', emailRouter(mockService));

describe('POST /v1/email/send', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful send', async () => {
    mockService.send.mockResolvedValue({ status: NotificationStatus.SENT, messageId: 'msg-1' });

    const res = await request(app)
      .post('/v1/email/send')
      .send({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotificationStatus.SENT);
  });

  it('returns 400 when to is missing', async () => {
    const res = await request(app)
      .post('/v1/email/send')
      .send({ subject: 'Hello', html: '<p>Hi</p>' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when subject is missing', async () => {
    const res = await request(app)
      .post('/v1/email/send')
      .send({ to: 'user@example.com', html: '<p>Hi</p>' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when html is missing', async () => {
    const res = await request(app)
      .post('/v1/email/send')
      .send({ to: 'user@example.com', subject: 'Hello' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when email address is invalid', async () => {
    const res = await request(app)
      .post('/v1/email/send')
      .send({ to: 'not-an-email', subject: 'Hello', html: '<p>Hi</p>' });

    expect(res.status).toBe(400);
  });

  it('returns 502 when provider fails', async () => {
    mockService.send.mockResolvedValue({ status: NotificationStatus.FAILED, error: 'SMTP timeout' });

    const res = await request(app)
      .post('/v1/email/send')
      .send({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' });

    expect(res.status).toBe(502);
  });
});

describe('POST /v1/email/send-bulk', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with results array', async () => {
    const results = [
      { status: NotificationStatus.SENT },
      { status: NotificationStatus.SENT },
    ];
    mockService.sendBulk.mockResolvedValue(results);

    const res = await request(app)
      .post('/v1/email/send-bulk')
      .send({
        emails: [
          { to: 'a@example.com', subject: 'S1', html: '<p>1</p>' },
          { to: 'b@example.com', subject: 'S2', html: '<p>2</p>' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 400 when emails array is empty', async () => {
    const res = await request(app).post('/v1/email/send-bulk').send({ emails: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when emails field is missing', async () => {
    const res = await request(app).post('/v1/email/send-bulk').send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /v1/email/send-template', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when template send succeeds', async () => {
    mockService.sendWithTemplate.mockResolvedValue({ status: NotificationStatus.SENT });

    const res = await request(app)
      .post('/v1/email/send-template')
      .send({ to: 'user@example.com', templateId: 'welcome', variables: { name: 'Jake' } });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotificationStatus.SENT);
  });

  it('returns 400 when templateId is missing', async () => {
    const res = await request(app)
      .post('/v1/email/send-template')
      .send({ to: 'user@example.com', variables: { name: 'Jake' } });

    expect(res.status).toBe(400);
  });

  it('returns 400 when recipient is missing', async () => {
    const res = await request(app)
      .post('/v1/email/send-template')
      .send({ templateId: 'welcome', variables: { name: 'Jake' } });

    expect(res.status).toBe(400);
  });
});