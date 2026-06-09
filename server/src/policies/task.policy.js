import { errorResponse } from '../utils/response.js';
import prisma from '../prisma/client.js';

const TaskPolicy = {
  async canCreate(req, res, next) {
    try {
      const user = req.user;
      const project = req.project;

      if (!project) {
        return errorResponse(res, 'Project context not loaded', 400);
      }

      if (user?.role === 'admin') {
        return next();
      }

      if (project.owner_id === user?.id) {
        return next();
      }

      const teamMember = await prisma.team_members.findFirst({
        where: {
          project_id: project.id,
          user_id: user.id,
          deleted_at: null,
        },
      });

      if (teamMember) {
        return next();
      }

      return errorResponse(res, 'You are not authorized to create a task in this project.', 403);
    } catch (error) {
      console.error('Error in TaskPolicy.canCreate:', error);
      return errorResponse(res, 'Internal server error during authorization check.', 500);
    }
  },

  canUpdate(req, res, next) {
    const user = req.user;
    const project = req.project;

    if (user?.role === 'admin' || project?.owner_id === user?.id) {
      return next();
    }

    return errorResponse(res, 'You are not authorized to update this task.', 403);
  },

  canDelete(req, res, next) {
    const user = req.user;

    if (user?.role === 'admin') {
      return next();
    }

    return errorResponse(res, 'You are not authorized to delete this task.', 403);
  },

  canChangeStatus(req, res, next) {
    const user = req.user;
    const task = req.task;

    if (user?.role === 'admin' || user?.role === 'manager' || task?.assigned_to === user?.id) {
      return next();
    }

    return errorResponse(res, 'You are not authorized to change the status of this task.', 403);
  },

  canAssign(req, res, next) {
    const user = req.user;
    const project = req.project;

    if (user?.role === 'admin' || project?.owner_id === user?.id) {
      return next();
    }

    return errorResponse(res, 'You are not authorized to assign this task.', 403);
  },
};

export { TaskPolicy };
