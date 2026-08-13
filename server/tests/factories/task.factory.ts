import prisma from '../../src/prisma/client.js';

export const createTask = async (overrides = {}) => {
  if (!overrides.project_id) {
    throw new Error('project_id is required to create a task');
  }

  return prisma.tasks.create({
    data: {
      title: 'Test Task',
      description: 'Test Task Description',
      status: 'todo',
      priority: 'medium',
      ...overrides,
    },
  });
};
