import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const changePassword = asyncHandler(async (req, res) => {
  const { old_password, password } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  if (!old_password || !password) {
    return errorResponse(res, 'Both old password and new password are required', 400);
  }

  const user = await prisma.users.findUnique({
    where: { id: userId, deleted_at: null },
  });

  if (!user || !user.is_active) {
    return errorResponse(res, 'User not found or is inactive', 404);
  }
  
  const isMatch = await bcrypt.compare(old_password, user.password);
  if (!isMatch) {
    return errorResponse(res, 'Incorrect old password', 400);
  }
  
  const newHashedPassword = await bcrypt.hash(password, 12);
  
  await prisma.users.update({
    where: { id: user.id },
    data: { password: newHashedPassword },
  });
  
  await prisma.refresh_tokens.deleteMany({
    where: { user_id: user.id },
  });

  return successResponse(res, null, 'Password has been successfully changed', 200);
});

export { changePassword };
