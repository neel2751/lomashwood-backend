import request from 'supertest';
import express from 'express';
import { templateRouter } from '../../app/templates/template.routes';
import { TemplateService } from '../../app/templates/template.service';
import { TemplateChannel } from '../../app/templates/template.types';

jest.mock('../../app/templates/template.service');

const mockService = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findByName: jest.fn(),
  render: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<TemplateService>;

const app = express();
app.use(express.json());
app.use('/v1/templates', templateRouter(mockService));

describe('GET /v1/templates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with all templates', async () => {
    const templates = [{ id: 'tpl-1' }, { id: 'tpl-2' }];
    mockService.findAll.mockResolvedValue(templates);

    const res = await request(app).get('/v1/templates');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /v1/templates/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with template', async () => {
    const template = { id: 'tpl-1', name: 'welcome-email', channel: TemplateChannel.EMAIL };
    mockService.findById.mockResolvedValue(template);

    const res = await request(app).get('/v1/templates/tpl-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('tpl-1');
  });

  it('returns 404 when not found', async () => {
    mockService.findById.mockResolvedValue(null);

    const res = await request(app).get('/v1/templates/missing');

    expect(res.status).toBe(404);
  });
});

describe('POST /v1/templates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 on successful creation', async () => {
    const payload = {
      name: 'booking-confirmation',
      channel: TemplateChannel.EMAIL,
      subject: 'Booking Confirmed',
      body: '<p>Hi {{name}}</p>',
    };
    const created = { id: 'tpl-1', ...payload };
    mockService.create.mockResolvedValue(created);

    const res = await request(app).post('/v1/templates').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('tpl-1');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/v1/templates')
      .send({ channel: TemplateChannel.EMAIL, subject: 'Hello', body: '<p>Hi</p>' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when channel is invalid', async () => {
    const res = await request(app)
      .post('/v1/templates')
      .send({ name: 'test', channel: 'PIGEON', subject: 'Hello', body: '<p>Hi</p>' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app)
      .post('/v1/templates')
      .send({ name: 'test', channel: TemplateChannel.SMS, subject: 'Hello' });

    expect(res.status).toBe(400);
  });
});

describe('POST /v1/templates/render', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with rendered template', async () => {
    mockService.render.mockResolvedValue({ subject: 'Welcome Jake', body: '<p>Hello Jake</p>' });

    const res = await request(app)
      .post('/v1/templates/render')
      .send({ templateName: 'welcome-email', variables: { name: 'Jake' } });

    expect(res.status).toBe(200);
    expect(res.body.data.subject).toBe('Welcome Jake');
  });

  it('returns 400 when templateName is missing', async () => {
    const res = await request(app)
      .post('/v1/templates/render')
      .send({ variables: { name: 'Jake' } });

    expect(res.status).toBe(400);
  });

  it('returns 404 when template does not exist', async () => {
    mockService.render.mockRejectedValue({ statusCode: 404, message: 'Template not found' });

    const res = await request(app)
      .post('/v1/templates/render')
      .send({ templateName: 'missing', variables: {} });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/templates/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful update', async () => {
    const updated = { id: 'tpl-1', body: '<p>Updated</p>' };
    mockService.update.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/v1/templates/tpl-1')
      .send({ body: '<p>Updated</p>' });

    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe('<p>Updated</p>');
  });

  it('returns 400 when request body is empty', async () => {
    const res = await request(app).patch('/v1/templates/tpl-1').send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/templates/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 204 on successful delete', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/v1/templates/tpl-1');

    expect(res.status).toBe(204);
  });

  it('returns 500 when service throws', async () => {
    mockService.delete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/v1/templates/tpl-1');

    expect(res.status).toBe(500);
  });
});