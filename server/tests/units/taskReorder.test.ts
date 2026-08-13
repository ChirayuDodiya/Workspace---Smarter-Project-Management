import request from 'supertest';
import { app } from '../../src/app.js';
import prisma from '../../src/prisma/client.js';
import { createUser } from '../factories/user.factory.js';
import { createProject } from '../factories/project.factory.js';
import { createTask } from '../factories/task.factory.js';

describe('Unit Test: Task Reordering Logic', () => {
  let developer;
  let developerCookies;
  let project;
  let task1, task2, task3;

  beforeEach(async () => {
    // 1. Create a user
    const password = 'Password123@';
    developer = await createUser({
      email: 'dev@example.com',
      password,
    });

    // 2. Login to get cookies
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: developer.email,
      password,
    });
    developerCookies = loginResponse.headers['set-cookie'];

    // 3. Create a project
    project = await createProject({
      name: 'Reorder Test Project',
      owner_id: developer.id,
    });

    // 4. Create 3 tasks with initial order
    task1 = await createTask({
      project_id: project.id,
      title: 'Task 1',
      sort_order: 0,
    });

    task2 = await createTask({
      project_id: project.id,
      title: 'Task 2',
      sort_order: 1,
    });

    task3 = await createTask({
      project_id: project.id,
      title: 'Task 3',
      sort_order: 2,
    });
  });

  it('should successfully update sort orders via transactional updates', async () => {
    // Reorder task3 -> 0, task1 -> 1, task2 -> 2
    const response = await request(app)
      .post('/api/v1/tasks/reorder')
      .set('Cookie', developerCookies)
      .send([
        { id: task3.id, sort_order: 0 },
        { id: task1.id, sort_order: 1 },
        { id: task2.id, sort_order: 2 },
      ]);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Tasks reordered successfully');

    // Verify database state updates
    const t1 = await prisma.tasks.findUnique({ where: { id: task1.id } });
    const t2 = await prisma.tasks.findUnique({ where: { id: task2.id } });
    const t3 = await prisma.tasks.findUnique({ where: { id: task3.id } });

    expect(t3.sort_order).toBe(0);
    expect(t1.sort_order).toBe(1);
    expect(t2.sort_order).toBe(2);
  });

  it('should return 400 bad request if payload is not an array', async () => {
    const response = await request(app)
      .post('/api/v1/tasks/reorder')
      .set('Cookie', developerCookies)
      .send({ id: task1.id, sort_order: 0 }); // sending object instead of array

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 if item fields fail schema validations', async () => {
    const response = await request(app)
      .post('/api/v1/tasks/reorder')
      .set('Cookie', developerCookies)
      .send([
        { id: 'not-an-integer', sort_order: 0 }, // invalid id format
      ]);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
