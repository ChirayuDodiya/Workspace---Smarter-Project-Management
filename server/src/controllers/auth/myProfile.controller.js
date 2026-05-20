// GET: /api/v1/auth/me — Get authenticated user profile

import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { serializeUser } from '../../serializers/user.serializer.js';

const myProfile = asyncHandler(async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  const serializedUser = serializeUser(user);

  return successResponse(res, serializedUser, 'User profile fetched successfully', 200);
});

export { myProfile };
