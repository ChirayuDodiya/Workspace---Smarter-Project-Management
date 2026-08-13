import prisma from './src/prisma/client.js';

async function main() {
  await prisma.comments.deleteMany();
  await prisma.activity_logs.deleteMany();
  await prisma.tasks.deleteMany();
  await prisma.team_members.deleteMany();
  await prisma.projects.deleteMany();
  await prisma.users.deleteMany();
  console.log('Truncated all tables.');
  await prisma.$disconnect();
}

main().catch(console.error);
