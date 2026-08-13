import request from 'supertest';
import { app } from '../../src/app.js';
import prisma from '../../src/prisma/client.js';
import { createUser } from '../factories/user.factory.js';
import { createProject } from '../factories/project.factory.js';
import { createTask } from '../factories/task.factory.js';

describe('Feature Test: Task Status Transition Validation', () => {
  let manager;
  let managerCookies;
  let project;
  let task;

  beforeEach(async () => {
    // 1. Create a manager
    const password = 'Password123@';
    manager = await createUser({
      email: 'manager@example.com',
      password,
      role: 'manager',
    });

    // 2. Login manager to get cookies
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: manager.email,
      password,
    });
    managerCookies = loginResponse.headers['set-cookie'];

    // 3. Create a project and task
    project = await createProject({
      name: 'Transition Test Project',
      owner_id: manager.id,
    });

    task = await createTask({
      project_id: project.id,
      title: 'Transition Test Task',
      status: 'todo',
      estimated_hours: 5.0,
    });
  });

  describe('Allowed Status Transitions', () => {
    it('should allow todo -> in_progress transition', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Cookie', managerCookies)
        .send({
          status: 'in_progress',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');

      // Assert database state
      const taskInDb = await prisma.tasks.findUnique({ where: { id: task.id } });
      expect(taskInDb.status).toBe('in_progress');
    });

    it('should allow in_progress -> in_review transition', async () => {
      // Manually set task status to in_progress first
      await prisma.tasks.update({
        where: { id: task.id },
        data: { status: 'in_progress' },
      });

      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Cookie', managerCookies)
        .send({
          status: 'in_review',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_review');

      // Assert database state
      const taskInDb = await prisma.tasks.findUnique({ where: { id: task.id } });
      expect(taskInDb.status).toBe('in_review');
    });

    it('should allow in_review -> done transition if actual_hours is provided', async () => {
      // Manually set task status to in_review first
      await prisma.tasks.update({
        where: { id: task.id },
        data: { status: 'in_review' },
      });

      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Cookie', managerCookies)
        .send({
          status: 'done',
          actual_hours: 4.5,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('done');
      expect(Number(response.body.data.actual_hours)).toBe(4.5);

      // Assert database state
      const taskInDb = await prisma.tasks.findUnique({ where: { id: task.id } });
      expect(taskInDb.status).toBe('done');
    });

    it('should allow backward status transitions (e.g. in_review -> in_progress)', async () => {
      // Manually set task status to in_review first
      await prisma.tasks.update({
        where: { id: task.id },
        data: { status: 'in_review' },
      });

      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Cookie', managerCookies)
        .send({
          status: 'in_progress',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');

      // Assert database state
      const taskInDb = await prisma.tasks.findUnique({ where: { id: task.id } });
      expect(taskInDb.status).toBe('in_progress');
    });
  });

  describe('Disallowed Status Transitions', () => {
    it('should return 422 for disallowed jump from todo -> in_review', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Cookie', managerCookies)
        .send({
          status: 'in_review',
        });

      expect(response.statusCode).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid status transition');

      // Assert database state remains unchanged
      const taskInDb = await prisma.tasks.findUnique({ where: { id: task.id } });
      expect(taskInDb.status).toBe('todo');
    });

    it('should return 422 for disallowed jump from todo -> done', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Cookie', managerCookies)
        .send({
          status: 'done',
          actual_hours: 4.5,
        });

      expect(response.statusCode).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid status transition');

      // Assert database state remains unchanged
      const taskInDb = await prisma.tasks.findUnique({ where: { id: task.id } });
      expect(taskInDb.status).toBe('todo');
    });

    it('should return 422 for disallowed jump from in_progress -> done', async () => {
      // Manually set task status to in_progress first
      await prisma.tasks.update({
        where: { id: task.id },
        data: { status: 'in_progress' },
      });

      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Cookie', managerCookies)
        .send({
          status: 'done',
          actual_hours: 4.5,
        });

      expect(response.statusCode).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid status transition');

      // Assert database state remains unchanged
      const taskInDb = await prisma.tasks.findUnique({ where: { id: task.id } });
      expect(taskInDb.status).toBe('in_progress');
    });
  });
});
