import jwt from 'jsonwebtoken';
import { redis } from '../services/redis.service.js';
import { errorResponse } from '../utils/response.js';

export const rateLimiterMiddleware = async (req, res, next) => {
  if (!redis || redis.status !== 'ready') {
    return next();
  }

  try {
    let identifier;
    let limit;
    let isGuest = true;

    const token = req.cookies?.accessToken;
    if (token) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decodedToken && decodedToken.id) {
          identifier = `user:${decodedToken.id}`;
          limit = 100;
          isGuest = false;
        }
      } catch (jwtErr) {
        // Invalid or expired token - fallback to guest
      }
    }

    if (isGuest) {
      identifier = `ip:${req.ip}`;
      limit = 20;
    }

    const key = `ratelimit:${identifier}`;

    const current = await redis.incr(key);
    let ttl;

    if (current === 1) {
      await redis.expire(key, 60);
      ttl = 60;
    } else {
      ttl = await redis.ttl(key);
      if (ttl === -1) {
        await redis.expire(key, 60);
        ttl = 60;
      }
    }

    const remaining = Math.max(0, limit - current);
    const resetTime = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : 0);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (current > limit) {
      return errorResponse(res, 'Too many requests. Please try again later.', 429);
    }

    next();
  } catch (error) {
    console.error('Rate limiting middleware error:', error);
    // fallback on any internal rate limiter error
    next();
  }
};

export default rateLimiterMiddleware;
