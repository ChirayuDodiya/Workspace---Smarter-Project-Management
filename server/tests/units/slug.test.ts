import { buildSlug } from '../../src/services/slug.service.js';
import prisma from '../../src/prisma/client.js';
import { createProject } from '../factories/project.factory.js';
import { createUser } from '../factories/user.factory.js';

describe('Unit Test: buildSlug (Slug Generation & Collision Handling)', () => {
  let owner;

  beforeEach(async () => {
    owner = await createUser({
      email: 'owner@example.com',
    });
  });

  it('should generate a standard lowercase slug if no collision exists', async () => {
    const slug = await buildSlug('My New Project');
    expect(slug).toBe('my-new-project');
  });

  it('should handle special characters and trim text correctly', async () => {
    const slug = await buildSlug('  Project!!! ??? () Name  ');
    expect(slug).toBe('project-name');
  });

  it('should append incremental counter suffix if the slug already exists', async () => {
    // 1. Create a project with slug 'colliding-project'
    await createProject({
      name: 'Colliding Project',
      slug: 'colliding-project',
      owner_id: owner.id,
    });

    // 2. Generate slug for the same name, should conflict and resolve to 'colliding-project-1'
    const slug1 = await buildSlug('Colliding Project');
    expect(slug1).toBe('colliding-project-1');

    // 3. Create the colliding-project-1 to simulate multiple collisions
    await createProject({
      name: 'Colliding Project 1',
      slug: 'colliding-project-1',
      owner_id: owner.id,
    });

    // 4. Generate again, should resolve to 'colliding-project-2'
    const slug2 = await buildSlug('Colliding Project');
    expect(slug2).toBe('colliding-project-2');
  });

  it('should exclude the current project ID when verifying updates to prevent self-collision triggers', async () => {
    // 1. Create a project
    const project = await createProject({
      name: 'Unique Project',
      slug: 'unique-project',
      owner_id: owner.id,
    });

    // 2. Build slug for the same name but exclude this project ID
    const slug = await buildSlug('Unique Project', project.id);

    // It should allow returning the same slug because this project ID is excluded from checks
    expect(slug).toBe('unique-project');
  });
});
