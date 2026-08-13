import { createUser } from '../factories/user.factory.js';
import { createProject } from '../factories/project.factory.js';
import { createTask } from '../factories/task.factory.js';

export async function seedDatabase() {
  const admin = await createUser({
    name: 'Admin User',
    email: `admin-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`,
    role: 'admin',
  });

  const manager = await createUser({
    name: 'Manager User',
    email: `manager-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`,
    role: 'manager',
  });

  const developer = await createUser({
    name: 'Developer User',
    email: `developer-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`,
    role: 'developer',
  });

  const project = await createProject({
    name: 'Seed Project',
    owner_id: manager.id,
  });

  const task = await createTask({
    project_id: project.id,
    title: 'Seed Task',
    assigned_to: developer.id,
  });

  return {
    admin,
    manager,
    developer,
    project,
    task,
  };
}
