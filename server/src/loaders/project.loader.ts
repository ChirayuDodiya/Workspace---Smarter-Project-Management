import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import prisma from '../prisma/client.js';

const loadProjectBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  if (!slug) {
    return errorResponse(res, 'Project slug is required', 400);
  }

  const project = await prisma.projects.findFirst({
    where: {
      slug: req.params.slug as string,
      deleted_at: null,
    },
  });

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  req.project = project;
  next();
};

export { loadProjectBySlug };
