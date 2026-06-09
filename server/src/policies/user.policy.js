import { errorResponse } from '../utils/response.js';

const UserPolicy = {
  canChangeRole(req, res, next) {
    const user = req.user;

    if (user?.role === 'admin') {
      return next();
    }

    return errorResponse(res, 'Forbidden: Only administrators can change user roles', 403);
  },
};

export { UserPolicy };
