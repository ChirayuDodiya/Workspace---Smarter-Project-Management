import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';
import prisma from '../prisma/client.js';

import { Request, Response, NextFunction } from 'express';
import { DecodedToken } from '../types/auth.js';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return errorResponse(res, 'unauthorized access', 401);
  }

  try {
    const decodedAccess = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string) as DecodedToken;

    const user = await prisma.users.findFirst({
      where: { id: decodedAccess.id, deleted_at: null },
    });

    if (!user || !user.is_active) {
      return errorResponse(res, 'unauthorized access', 401);
    }

    req.user = user;
    return next();
  } catch (err) {
    return errorResponse(res, 'unauthorized access', 401);
  }
};

export { authMiddleware };
