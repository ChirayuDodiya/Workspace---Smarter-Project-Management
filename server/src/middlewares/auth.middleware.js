import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return errorResponse(res, 'unauthorized access', 401);
    }
    const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decodedToken) {
      req.user = decodedToken;
      next();
    } else {
      return errorResponse(res, 'unauthorized access', 401);
    }
  } catch (error) {
    return errorResponse(res, 'internal server error', 500);
  }
};

export { authMiddleware };
