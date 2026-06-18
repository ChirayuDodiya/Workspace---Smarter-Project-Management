import cron from 'node-cron';
import prisma from '../prisma/client.js';

// Schedule cleanup of expired refresh tokens daily at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  console.log('Running cron task: Cleaning up expired refresh tokens...');
  try {
    const result = await prisma.refresh_tokens.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
    console.log(`Cron task completed. Deleted ${result.count} expired refresh tokens.`);
  } catch (error) {
    console.error('Error running expired refresh tokens cleanup cron:', error);
  }
});
