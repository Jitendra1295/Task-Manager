const request = require('supertest');
jest.mock('../src/services/email.service', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' }),
}));

const app = require('../src/app');
const User = require('../src/models/User');
const { connectDB, disconnectDB } = require('../src/config/db');
const { sendWelcomeEmail } = require('../src/services/email.service');

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/task_manager_auth_test';

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
  await User.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await disconnectDB();
});

describe('Authentication REST API Endpoints', () => {
  let authToken;

  it('POST /api/auth/register should register a new user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jeet Patel',
        email: 'jeet@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('jeet@example.com');
    expect(res.body.user.name).toBe('Jeet Patel');
    expect(res.body.user.password).toBeUndefined(); // Password hash must never leak
    expect(sendWelcomeEmail).toHaveBeenCalledWith('jeet@example.com', 'Jeet Patel');

    authToken = res.body.token;
  });

  it('POST /api/auth/register should succeed when the welcome email fails', async () => {
    sendWelcomeEmail.mockRejectedValueOnce(new Error('SES unavailable'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Email Failure User',
          email: 'email-failure@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('email-failure@example.com');
      expect(errorSpy).toHaveBeenCalledWith('SES welcome email failed:', {
        name: 'Error',
        message: 'SES unavailable',
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('POST /api/auth/register should reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jeet Patel Duplicate',
        email: 'jeet@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('POST /api/auth/login should authenticate valid user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jeet@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('jeet@example.com');
  });

  it('POST /api/auth/login should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jeet@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('GET /api/auth/me should return user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('jeet@example.com');
  });

  it('GET /api/auth/me should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no token provided/i);
  });
});
