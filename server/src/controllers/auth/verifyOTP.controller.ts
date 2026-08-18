import crypto from 'crypto';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { redis } from '../../services/redis.service.js';

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return errorResponse(res, 'Email and OTP are required', 400);
  }

  if (!redis) {
    return errorResponse(res, 'Redis service is unavailable', 500);
  }
  
  const storedDataStr = await redis.get(`signup_otp:${email}`);

  if (!storedDataStr) {
    return errorResponse(res, 'OTP expired or not found. Please register again.', 400);
  }

  const storedData = JSON.parse(storedDataStr);
  
  if (storedData.attempts >= 3) {
    await redis.del(`signup_otp:${email}`);
    return errorResponse(res, 'Maximum OTP attempts reached. Please register again.', 400);
  }

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  if (hashedOtp !== storedData.otp) {
    storedData.attempts = (storedData.attempts || 0) + 1;
    
    if (storedData.attempts >= 3) {
      await redis.del(`signup_otp:${email}`);
      return errorResponse(res, 'Maximum OTP attempts reached. Please register again.', 400);
    }

    const ttl = await redis.ttl(`signup_otp:${email}`);
    if (ttl > 0) {
      await redis.set(`signup_otp:${email}`, JSON.stringify(storedData), 'EX', ttl);
    }

    return errorResponse(res, `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`, 400);
  }
  
  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) {
    return errorResponse(res, 'Email already registered', 409);
  }

  await prisma.users.create({
    data: {
      name: storedData.name,
      email: storedData.email,
      password: storedData.password,
    },
  });

  await redis.del(`signup_otp:${email}`);

  return successResponse(res, null, 'User verified and created successfully', 201);
});

export { verifyOTP };
