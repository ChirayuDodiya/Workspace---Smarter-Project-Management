import { users } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      user?: users;
      project?: import('@prisma/client').projects;
      task?: import('@prisma/client').tasks;
    }
  }
}
