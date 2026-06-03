import { successResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { serializeUser } from '../../serializers/user.serializer.js';

const users = asyncHandler(async (req, res) => {
  const usersList = await prisma.users.findMany({
    where: { is_active: true, deleted_at: null },
    select: {
      id: true,
      name: true,
      email: true,
      avatar_url: true,
      role: true,
    },
  });

  const serializedUsers = usersList.map((user) => serializeUser(user));

  return successResponse(res, serializedUsers, 'Users fetched successfully');
});

export { users };
