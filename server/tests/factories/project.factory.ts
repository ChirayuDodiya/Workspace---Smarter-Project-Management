import prisma from '../../src/prisma/client.js';
import { buildSlug } from '../../src/services/slug.service.js';

export const createProject = async (overrides = {}) => {
  const name = overrides.name || 'Test Project';
  const slug = overrides.slug || (await buildSlug(name));

  return prisma.projects.create({
    data: {
      name,
      slug,
      description: 'Test Project Description',
      status: 'planning',
      start_date: new Date(),
      ...overrides,
    },
  });
};
