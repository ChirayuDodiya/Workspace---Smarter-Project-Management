import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/token.js';

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return errorResponse(res, 'unauthorized access', 401);
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as import('../../types/auth.js').DecodedToken;

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const record = await prisma.refresh_tokens.findFirst({
      where: {
        refresh_token: hashedRefresh,
      },
    });

    if (!record || record.user_id !== decodedRefresh.id) {
      return errorResponse(res, 'unauthorized access', 401);
    }

    if (record.expires_at < new Date()) {
      await prisma.refresh_tokens.deleteMany({
        where: { user_id: decodedRefresh.id },
      });
      return errorResponse(res, 'unauthorized access', 401);
    }

    const user = await prisma.users.findFirst({
      where: { id: record.user_id, deleted_at: null },
    });

    if (!user || !user.is_active) {
      return errorResponse(res, 'unauthorized access', 401);
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const newHashedRefresh = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refresh_tokens.update({
      where: { id: record.id },
      data: {
        refresh_token: newHashedRefresh,
        expires_at: expiresAt,
      },
    });

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, null, 'Access token refreshed successfully', 200);
  } catch (err) {
    return errorResponse(res, 'unauthorized access', 401);
  }
});

export { refresh };
