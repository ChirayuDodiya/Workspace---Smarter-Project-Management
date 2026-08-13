import { errorResponse } from '../utils/response.js';
import prisma from '../prisma/client.js';
const loadTaskAndProject = async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return errorResponse(res, 'Task ID is required', 400);
    }
    const taskId = Number(id);
    if (Number.isNaN(taskId)) {
        return errorResponse(res, 'Invalid task ID', 400);
    }
    const task = await prisma.tasks.findFirst({
        where: { id: taskId, deleted_at: null },
        include: { users: true },
    });
    if (!task) {
        return errorResponse(res, 'Task not found', 404);
    }
    const project = await prisma.projects.findFirst({
        where: { id: task.project_id, deleted_at: null },
    });
    if (!project) {
        return errorResponse(res, 'Project not found', 404);
    }
    req.task = task;
    req.project = project;
    next();
};
export { loadTaskAndProject };
