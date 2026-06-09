import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { serializeUser } from '../../serializers/user.serializer.js';
import { createActivityLog } from '../../services/activity.service.js';

// GET: /api/v1/users — List active users with optional search filter and pagination
const listUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, per_page = 20 } = req.query;
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(per_page) || 20, 1), 100);

  const where = {
    is_active: true,
    deleted_at: null,
  };

  if (search) {
    where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
  }

  const [total, users] = await Promise.all([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const serialized = users.map((user) => serializeUser(user));
  return paginatedResponse(res, serialized, {
    total_records: total,
    page: pageNumber,
    per_page: pageSize,
    total_pages: Math.ceil(total / pageSize),
  });
});

// PUT: /api/v1/users/:id/role — Update a user's role (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  if (isNaN(targetUserId)) {
    return errorResponse(res, 'Invalid user ID', 400);
  }

  const { role } = req.body;
  const allowedRoles = ['admin', 'manager', 'developer'];
  if (!role || !allowedRoles.includes(role)) {
    return errorResponse(res, 'Invalid role. Must be admin, manager, or developer', 400);
  }

  const targetUser = await prisma.users.findFirst({
    where: {
      id: targetUserId,
      deleted_at: null,
    },
  });

  if (!targetUser) {
    return errorResponse(res, 'User not found', 404);
  }

  if (targetUser.role === role) {
    return successResponse(res, serializeUser(targetUser), 'User role is already set to ' + role);
  }

  const oldRole = targetUser.role;

  const updatedUser = await prisma.users.update({
    where: { id: targetUserId },
    data: { role },
  });

  try {
    await createActivityLog({
      subject_type: 'users',
      subject_id: targetUserId,
      user_id: req.user.id,
      action: 'update_role',
      properties: {
        old_role: oldRole,
        new_role: role,
        user_name: targetUser.name,
        user_email: targetUser.email,
      },
    });
  } catch (logError) {
    console.error('Failed to create activity log for role update:', logError);
  }

  return successResponse(res, serializeUser(updatedUser), 'User role updated successfully');
});

export { listUsers, updateUserRole };
