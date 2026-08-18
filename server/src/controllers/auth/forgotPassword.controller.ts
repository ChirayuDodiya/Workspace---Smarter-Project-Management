import crypto from 'crypto';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendForgotPasswordEmail } from '../../services/mail.service.js';
import { redis } from '../../services/redis.service.js';

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.users.findUnique({
    where: { email, deleted_at: null },
  });

  if (!user) {
    return successResponse(res, null, 'If that email address is in our database, we will send you an email to reset your password.', 200);
  }

  if (!user.is_active) {
    return errorResponse(res, 'User is not active', 401);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  if (redis) {
    await redis.setex(`reset_token:${email}`, 600, hashedToken);
  } else {
    return errorResponse(res, 'Redis service is unavailable', 500);
  }
  
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  try {
    await sendForgotPasswordEmail(email, resetLink);
  } catch (error) {
    if (redis) {
      await redis.del(`reset_token:${email}`);
    }
    return errorResponse(res, 'Failed to send password reset email', 500);
  }

  return successResponse(res, null, 'If that email address is in our database, we will send you an email to reset your password.', 200);
});

export { forgotPassword };
