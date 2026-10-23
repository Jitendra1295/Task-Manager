const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Task = require('../src/models/Task');
const User = require('../src/models/User');
const { connectDB, disconnectDB } = require('../src/config/db');

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/task_manager_task_auth_test';

let userToken;
let otherUserToken;

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
  await Task.deleteMany({});
  await User.deleteMany({});

  // Create Primary User
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Primary User',
      email: 'primary@example.com',
      password: 'password123',
    });
  userToken = userRes.body.token;

  // Create Secondary User for ownership testing
  const otherRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
    });
  otherUserToken = otherRes.body.token;
});

afterAll(async () => {
  await Task.deleteMany({});
  await User.deleteMany({});
  await disconnectDB();
});

describe('Task REST API Endpoints with Authentication', () => {
  let createdTaskId;

  describe('POST /api/tasks', () => {
    it('should reject unauthenticated task creation with 401', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Unauthenticated Task' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should create a new task with valid token', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Learn AWS Deployments',
          description: 'Deploy Express to EC2 and React to S3',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.title).toBe('Learn AWS Deployments');
      expect(res.body.data.status).toBe('pending');

      createdTaskId = res.body.data._id;
    });

    it('should return 400 when title is missing or empty', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/title is required/i);
    });
  });

  describe('GET /api/tasks', () => {
    it('should only return tasks owned by the authenticated user', async () => {
      // Create task for other user
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: "Other User's Secret Task" });

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Must only contain Primary User's task
      expect(res.body.data.every((t) => t.title !== "Other User's Secret Task")).toBe(true);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should reject update if user does not own the task (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/do not have permission/i);
    });

    it('should update task when owner makes the request', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Learn AWS Deployments (Updated)',
          status: 'completed',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Learn AWS Deployments (Updated)');
      expect(res.body.data.status).toBe('completed');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should reject delete if user does not own the task (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should delete task when owner makes the request', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });
  });
});
