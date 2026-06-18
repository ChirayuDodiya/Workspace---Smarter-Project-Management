import { errorResponse } from '../utils/response.js';

const UserPolicy = {
  canChangeRole(req, res, next) {
    const user = req.user;
    const targetUserId = parseInt(req.params.id, 10);

    if (targetUserId === user?.id) {
      return errorResponse(res, 'You cannot change your own role.', 400);
    }

    if (user?.role === 'admin') {
      return next();
    }

    return errorResponse(res, 'Forbidden: Only administrators can change user roles', 403);
  },

  canDelete(req, res, next) {
    const user = req.user;
    const targetUserId = parseInt(req.params.id, 10);

    if (targetUserId === user?.id) {
      return errorResponse(res, 'You cannot deactivate your own account.', 400);
    }

    if (user?.role === 'admin') {
      return next();
    }

    return errorResponse(res, 'Forbidden: Only administrators can delete users', 403);
  },

  canRestore(req, res, next) {
    const user = req.user;

    if (user?.role === 'admin') {
      return next();
    }

    return errorResponse(res, 'Forbidden: Only administrators can restore users', 403);
  },

  canToggleActive(req, res, next) {
    const user = req.user;
    const targetUserId = parseInt(req.params.id, 10);

    if (targetUserId === user?.id) {
      return errorResponse(res, 'You cannot activate or deactivate your own account.', 400);
    }

    if (user?.role === 'admin') {
      return next();
    }

    return errorResponse(
      res,
      'Forbidden: Only administrators can activate or deactivate users',
      403
    );
  },
};

export { UserPolicy };
