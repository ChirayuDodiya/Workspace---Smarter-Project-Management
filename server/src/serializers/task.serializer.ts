import { serializeUser } from './user.serializer.js';

const serializeTask = (task: any, projectOwnerId: number | null = null) => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigned_to: task.users ? serializeUser(task.users) : null,
    due_date: task.due_date,
    estimated_hours: task.estimated_hours,
    actual_hours: task.actual_hours,
    sort_order: task.sort_order,
    created_at: task.created_at,
    project_owner_id: projectOwnerId || task.projects?.owner_id || null,
  };
};

export { serializeTask };
