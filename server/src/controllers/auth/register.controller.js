// POST: /api/v1/auth/register — Register with name, email, password, password_confirmation

import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const register = asyncHandler(async (req, res) => {
  const { name, email, password, password_confirmation } = req.body;
  email = email.trim().toLowerCase();

  if (!name || !email || !password || !password_confirmation) {
    return errorResponse(res, 'All fields are required', 400);
  }

  if (password !== password_confirmation) {
    return errorResponse(res, 'password and password_confirmation does not match', 400);
  }

  const existingUser = await prisma.users.findUnique({ where: { email } });

  if (existingUser) {
    return errorResponse(res, 'Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return successResponse(res, null, 'user created successfully', 201);
});

export { register };
