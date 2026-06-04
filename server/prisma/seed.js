import { users } from './user.js';
import { projects } from './project.js';
import { tasks } from './task.js';
import { comments } from './comment.js';
import { team_members } from './team_member.js';
import prisma from '../src/prisma/client.js';

async function main() {
  await prisma.users.createMany({ data: users, skipDuplicates: true });
  await prisma.projects.createMany({ data: projects, skipDuplicates: true });
  await prisma.tasks.createMany({ data: tasks, skipDuplicates: true });
  await prisma.comments.createMany({ data: comments, skipDuplicates: true });
  await prisma.team_members.createMany({ data: team_members, skipDuplicates: true });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
