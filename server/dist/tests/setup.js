import 'dotenv/config';
import prisma from '../src/prisma/client.js';
import { redis } from '../src/services/redis.service.js';
beforeEach(async () => {
    // Truncate tables in proper dependency order to avoid foreign key constraint violations
    await prisma.comments.deleteMany();
    await prisma.activity_logs.deleteMany();
    await prisma.tasks.deleteMany();
    await prisma.team_members.deleteMany();
    await prisma.refresh_tokens.deleteMany();
    await prisma.projects.deleteMany();
    await prisma.users.deleteMany();
});
afterAll(async () => {
    //close Prisma and Redis connections
    await prisma.$disconnect();
    if (redis) {
        redis.disconnect();
    }
});
