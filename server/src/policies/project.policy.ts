import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

const ProjectPolicy = {
  canCreate(req: Request, res: Response, next: NextFunction) {
    const user = req.user;

    if (user?.role === 'admin' || user?.role === 'manager') {
      return next();
    }

    return errorResponse(res, 'You are not authorized to create a project.', 403);
  },

  canUpdate(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    const project = req.project;

    if (user?.role === 'admin' || project?.owner_id === user?.id) {
      return next();
    }

    return errorResponse(res, 'You are not authorized to update this project.', 403);
  },

  canDelete(req: Request, res: Response, next: NextFunction) {
    const user = req.user;

    if (user?.role === 'admin') {
      return next();
    }

    return errorResponse(res, 'You are not authorized to delete this project.', 403);
  },
};

export { ProjectPolicy };
