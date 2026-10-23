const request = require('supertest');
const app = require('../src/app');

describe('Health and System Endpoints', () => {
  it('GET /api/health should return 200 with system diagnostics', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('status');
    expect(res.body).toHaveProperty('system');
  });

  it('GET /api/nonexistent should return 404 with structured error', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('status', 'fail');
    expect(res.body.message).toMatch(/Cannot find GET \/api\/nonexistent/);
  });

  it('Responses should include Helmet security headers', async () => {
    const res = await request(app).get('/api/health');

    // Helmet sets X-Content-Type-Options: nosniff
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    // Helmet removes X-Powered-By
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
