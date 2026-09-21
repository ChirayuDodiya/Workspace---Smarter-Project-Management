import os
import shutil
from fastapi import APIRouter, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
from rq import Queue
from redis import Redis

from config import REDIS_URL
from services.document_service import process_and_store_document
from services.query_service import query_rag

router = APIRouter()
redis_conn = Redis.from_url(REDIS_URL)
task_queue = Queue(connection=redis_conn)

# Import it after redis_conn is defined to avoid circular import issues
from dependencies.rate_limiter import rate_limiter
from fastapi import Depends

class QueryRequest(BaseModel):
    project_id: str
    task_id: Optional[str] = None
    question: str

@router.post("/upload", dependencies=[Depends(rate_limiter)])
async def upload_document(
    project_id: str = Form(...), 
    task_id: Optional[str] = Form(None), 
    file: UploadFile = Form(...)
):
    allowed_extensions = (".pdf", ".txt", ".md", ".docx")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, MD, and DOCX files are supported")
    
    # Create temp directory if not exists
    os.makedirs("temp_uploads", exist_ok=True)
    temp_file_path = f"temp_uploads/{file.filename}"
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Enqueue the background job
        job = task_queue.enqueue(
            process_and_store_document, 
            temp_file_path, 
            project_id, 
            task_id, 
            file.filename,
            job_timeout='1h' # Allow up to 1 hour for massive PDFs
        )
        
        return {
            "message": "Document uploaded and queued for processing",
            "job_id": job.id,
            "status": "processing"
        }
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query", dependencies=[Depends(rate_limiter)])
async def query_document(request: QueryRequest):
    try:
        response = query_rag(request.question, request.project_id, request.task_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    job = task_queue.fetch_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job.id,
        "status": job.get_status(),
        "result": job.result
    }
