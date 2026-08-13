import prisma from './src/prisma/client.js';

async function test() {
  const stats1 = await prisma.tasks.getProjectSummaryStats(1);
  console.log('Stats 1:', stats1.total_hours);

  await prisma.tasks.create({
    data: {
      project_id: 1,
      title: 'Test Task',
      status: 'done',
      actual_hours: 10
    }
  });

  const stats2 = await prisma.tasks.getProjectSummaryStats(1);
  console.log('Stats 2:', stats2.total_hours);

  await prisma.$disconnect();
}

test().catch(console.error);
