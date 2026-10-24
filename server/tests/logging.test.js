const request = require('supertest');
const app = require('../src/app');

describe('HTTP request and error logging', () => {
  let infoSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs completed requests with method, path, status, and duration', async () => {
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    const log = JSON.parse(infoSpy.mock.calls[0][0]);
    expect(log).toMatchObject({
      level: 'info',
      event: 'http_request',
      method: 'GET',
      path: '/api/health',
      statusCode: 200,
    });
    expect(log.durationMs).toEqual(expect.any(Number));
  });

  it('routes malformed JSON through the global handler without logging request contents', async () => {
    const response = await request(app)
      .post('/api/auth/login?privateValue=query-secret')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Invalid JSON request body');
    const logs = warnSpy.mock.calls.map(([message]) => JSON.parse(message));
    const errorLog = logs.find(({ event }) => event === 'http_error');
    expect(errorLog).toMatchObject({
      level: 'warn',
      event: 'http_error',
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 400,
      error: 'AppError',
    });
    expect(logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'http_request',
          path: '/api/auth/login',
          statusCode: 400,
        }),
      ])
    );
    expect(JSON.stringify(logs)).not.toContain('query-secret');
  });

  it('logs unknown routes through the global error handler', async () => {
    const response = await request(app).get('/api/missing');

    expect(response.statusCode).toBe(404);
    const logs = warnSpy.mock.calls.map(([message]) => JSON.parse(message));
    expect(logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'http_error',
          method: 'GET',
          path: '/api/missing',
          statusCode: 404,
        }),
      ])
    );
  });
});
