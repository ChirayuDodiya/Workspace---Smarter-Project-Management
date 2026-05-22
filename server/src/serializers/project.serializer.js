import { serializeUser } from './user.serializer.js';
import { serializeTask } from './task.serializer.js';

const serializeProject = (project) => {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    owner: project.users ? serializeUser(project.users) : null,
    start_date: project.start_date,
    end_date: project.end_date,
    budget: project.budget,
    tasks: project.tasks ? project.tasks.map((task) => serializeTask(task)) : [],
    task_count: project.tasks?.length || 0,
    created_at: project.createdAt,
  };
};

export { serializeProject };
