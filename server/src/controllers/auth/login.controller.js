// POST: /api/v1/auth/login — Returns token + user data

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/token.js';
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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Hash the refresh token before storing in database
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      refresh_token: hashedRefreshToken,
      expires_at: expiresAt,
    },
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const serializedUser = serializeUser(user);

  return successResponse(res, serializedUser, 'User logged in successfully', 200);
});

export { login };
