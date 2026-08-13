// POST: /api/v1/auth/logout — Revoke current token

import crypto from 'crypto';
import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import prisma from '../../prisma/client.js';

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refresh_tokens
      .deleteMany({
        where: { refresh_token: hashed },
      })
      .catch((err) => {
        console.error('Failed to delete refresh token on logout:', err);
      });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return successResponse(res, null, 'User logged out successfully', 200);
});

export { logout };
