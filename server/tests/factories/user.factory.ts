import prisma from '../../src/prisma/client.js';
import bcrypt from 'bcryptjs';

export const createUser = async (overrides = {}) => {
  const { password, ...rest } = overrides;
  const passwordPlain = password || 'DeveloperPass@1';
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  return prisma.users.create({
    data: {
      name: 'Test User',
      email:
        overrides.email || `test-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`,
      password: hashedPassword,
      role: 'developer',
      is_active: true,
      ...rest,
    },
  });
};
