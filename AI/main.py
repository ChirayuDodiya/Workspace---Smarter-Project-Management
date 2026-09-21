from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.rag_router import router as rag_router

app = FastAPI(title="Project Manager AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag_router, prefix="/api/v1/ai", tags=["AI"])

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "AI RAG Backend"}
