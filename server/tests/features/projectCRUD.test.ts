import request from 'supertest';
import { app } from '../../src/app.js';
import prisma from '../../src/prisma/client.js';
import { createUser } from '../factories/user.factory.js';
import { createProject } from '../factories/project.factory.js';

describe('Feature Test: Project CRUD and Authorization Checks', () => {
  let admin, manager, developer;
  let adminCookies, managerCookies, developerCookies;

  beforeEach(async () => {
    // 1. Create users with different roles
    const password = 'Password123@';

    admin = await createUser({
      email: 'admin@example.com',
      password,
      role: 'admin',
    });

    manager = await createUser({
      email: 'manager@example.com',
      password,
      role: 'manager',
    });

    developer = await createUser({
      email: 'developer@example.com',
      password,
      role: 'developer',
    });

    // 2. Login each user to obtain session cookies
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: admin.email,
      password,
    });
    adminCookies = adminLogin.headers['set-cookie'];

    const managerLogin = await request(app).post('/api/v1/auth/login').send({
      email: manager.email,
      password,
    });
    managerCookies = managerLogin.headers['set-cookie'];

    const developerLogin = await request(app).post('/api/v1/auth/login').send({
      email: developer.email,
      password,
    });
    developerCookies = developerLogin.headers['set-cookie'];
  });

  describe('Project Creation Authorization', () => {
    it('should allow a manager to create a project', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Cookie', managerCookies)
        .send({
          name: 'Manager Project',
          description: 'A project created by a manager',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Manager Project');

      // Assert database state
      const projectInDb = await prisma.projects.findFirst({
        where: { name: 'Manager Project' },
      });
      expect(projectInDb).not.toBeNull();
      expect(projectInDb.owner_id).toBe(manager.id);
    });

    it('should deny a developer from creating a project', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Cookie', developerCookies)
        .send({
          name: 'Developer Project',
          description: 'A project created by a developer',
        });

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are not authorized to create a project.');

      // Assert database state (should not exist)
      const projectInDb = await prisma.projects.findFirst({
        where: { name: 'Developer Project' },
      });
      expect(projectInDb).toBeNull();
    });
  });

  describe('Project Show & Update & Delete Authorization', () => {
    let project;

    beforeEach(async () => {
      // Create a project owned by the manager
      project = await createProject({
        name: 'Target Project',
        owner_id: manager.id,
      });
    });

    it('should allow any authenticated user to view project details', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project.slug}`)
        .set('Cookie', developerCookies);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe('Target Project');
    });

    it('should allow the manager owner to update the project', async () => {
      const response = await request(app)
        .put(`/api/v1/projects/${project.slug}`)
        .set('Cookie', managerCookies)
        .send({
          name: 'Updated Target Project',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Target Project');

      // Assert database state
      const projectInDb = await prisma.projects.findUnique({
        where: { id: project.id },
      });
      expect(projectInDb.name).toBe('Updated Target Project');
    });

    it('should deny non-owner developer from updating the project', async () => {
      const response = await request(app)
        .put(`/api/v1/projects/${project.slug}`)
        .set('Cookie', developerCookies)
        .send({
          name: 'Developer Changed Name',
        });

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);

      // Assert database state (remains unchanged)
      const projectInDb = await prisma.projects.findUnique({
        where: { id: project.id },
      });
      expect(projectInDb.name).toBe('Target Project');
    });

    it('should deny a manager from deleting the project', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${project.slug}`)
        .set('Cookie', managerCookies);

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);

      // Assert database state (not soft deleted)
      const projectInDb = await prisma.projects.findUnique({
        where: { id: project.id },
      });
      expect(projectInDb.deleted_at).toBeNull();
    });

    it('should allow an admin to delete (soft delete) the project', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${project.slug}`)
        .set('Cookie', adminCookies);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);

      // Assert database state (soft deleted)
      const projectInDb = await prisma.projects.findFirst({
        where: { id: project.id },
      });
      expect(projectInDb.deleted_at).not.toBeNull();
    });
  });
});
