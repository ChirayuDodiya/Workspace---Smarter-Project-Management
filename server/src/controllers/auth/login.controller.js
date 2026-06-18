// POST: /api/v1/auth/login — Returns token + user data

import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generateAccessToken } from '../../utils/token.js';
import { serializeUser } from '../../serializers/user.serializer.js';

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.users.findUnique({
    where: { email, deleted_at: null },
  });

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  if (!user.is_active) {
    return errorResponse(res, 'User is not active', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return errorResponse(res, 'Invalid password', 401);
  }

  const token = generateAccessToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const serializedUser = serializeUser(user);

  return successResponse(res, serializedUser, 'User logged in successfully', 200);
});

export { login };
