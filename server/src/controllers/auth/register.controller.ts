// POST: /api/v1/auth/register — Send OTP for registration

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { redis } from '../../services/redis.service.js';
import { sendSignupOTPEmail } from '../../services/mail.service.js';

const register = asyncHandler(async (req, res) => {
  const { name, email, password, password_confirmation } = req.body;

  if (password !== password_confirmation) {
    return errorResponse(res, 'Password and confirm password do not match', 400);
  }
  
  const existingUser = await prisma.users.findUnique({ where: { email } });
  
  if (existingUser) {
    return errorResponse(res, 'Email already registered', 409);
  }

  if (!redis) {
    return errorResponse(res, 'Redis service is unavailable', 500);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  
  const registrationData = {
    name,
    email,
    password: hashedPassword,
    otp: hashedOtp,
    attempts: 0,
  };
  
  await redis.setex(`signup_otp:${email}`, 600, JSON.stringify(registrationData));
  
  try {
    await sendSignupOTPEmail(email, otp);
  } catch (error) {
    await redis.del(`signup_otp:${email}`);
    return errorResponse(res, 'Failed to send OTP email. Please try again.', 500);
  }

  return successResponse(res, null, 'OTP sent successfully. Please check your email.', 200);
});

export { register };
