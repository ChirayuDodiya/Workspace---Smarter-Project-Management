import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redis;
try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null;
      }
      return 1000;
    },
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });
} catch (error) {
  console.error('Redis initialization failed:', error);
}

export const getCachedStats = async (slug) => {
  if (!redis) return null;
  try {
    const data = await redis.get(`project:stats:${slug}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis getCachedStats failed:', err.message);
    return null;
  }
};

export const setCachedStats = async (slug, data) => {
  if (!redis) return;
  try {
    // Cache for 24 hours (86400 seconds)
    await redis.setex(`project:stats:${slug}`, 86400, JSON.stringify(data));
  } catch (err) {
    console.error('Redis setCachedStats failed:', err.message);
  }
};

export const invalidateProjectStats = async (slug) => {
  if (!redis) return;
  try {
    await redis.del(`project:stats:${slug}`);
    console.log(`Redis stats cache invalidated for project: ${slug}`);
  } catch (err) {
    console.error('Redis invalidateProjectStats failed:', err.message);
  }
};

export { redis };
