from fastapi import Request, HTTPException
import time
from routers.rag_router import redis_conn

from config import JWT_ACCESS_SECRET
import jwt

async def rate_limiter(req: Request):
    try:
        identifier = "unknown"
        # Try to get user ID from JWT cookie
        token = req.cookies.get("accessToken")
        
        if not token or not JWT_ACCESS_SECRET:
            raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid token")
            
        try:
            payload = jwt.decode(token, JWT_ACCESS_SECRET, algorithms=["HS256"])
            if "id" not in payload:
                raise HTTPException(status_code=401, detail="Unauthorized: Invalid token payload")
                
            identifier = f"user:{payload['id']}"
            limit = 6  # 6 AI requests per minute for authenticated users
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

        key = f"ai_ratelimit:{identifier}"

        current = redis_conn.incr(key)
        
        if current == 1:
            redis_conn.expire(key, 60)
        else:
            ttl = redis_conn.ttl(key)
            if ttl == -1:
                redis_conn.expire(key, 60)

        if current > limit:
            raise HTTPException(
                status_code=429, 
                detail="Too many requests. Please try again later."
            )
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Rate limiting error: {e}")
        # Fallback if Redis is down
        pass
