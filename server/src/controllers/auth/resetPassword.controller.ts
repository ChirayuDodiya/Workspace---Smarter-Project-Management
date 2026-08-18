import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { redis } from '../../services/redis.service.js';

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    return errorResponse(res, 'Email, token, and password are required', 400);
  }

  if (!redis) {
    return errorResponse(res, 'Redis service is unavailable', 500);
  }
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const storedHashedToken = await redis.get(`reset_token:${email}`);

  if (!storedHashedToken || storedHashedToken !== hashedToken) {
    return errorResponse(res, 'Invalid or expired password reset token', 400);
  }

  const user = await prisma.users.findUnique({
    where: { email, deleted_at: null },
  });

  if (!user || !user.is_active) {
    return errorResponse(res, 'User not found or is inactive', 404);
  }
  
  const newHashedPassword = await bcrypt.hash(password, 12);
  
  await prisma.users.update({
    where: { id: user.id },
    data: { password: newHashedPassword },
  });
  
  await prisma.refresh_tokens.deleteMany({
    where: { user_id: user.id },
  });

  await redis.del(`reset_token:${email}`);

  return successResponse(res, null, 'Password has been successfully reset', 200);
});

export { resetPassword };
