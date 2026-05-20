// POST: /api/v1/auth/logout — Revoke current token

import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return successResponse(res, null, 'User logged out successfully', 200);
});

export { logout };
