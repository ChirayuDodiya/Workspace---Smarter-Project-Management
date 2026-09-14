import os
import shutil
from fastapi import FastAPI, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_qdrant import Qdrant
from langchain_groq import ChatGroq
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
import qdrant_client.http.exceptions

from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="RAG Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Qdrant configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "task_documents"

# Initialize Qdrant Client
client = QdrantClient(url=QDRANT_URL)

# Ensure collection exists
try:
    client.get_collection(COLLECTION_NAME)
except qdrant_client.http.exceptions.UnexpectedResponse:
    # Collection does not exist, create it
    # all-MiniLM-L6-v2 produces 384-dimensional vectors
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

# Initialize Embeddings
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Initialize Vector Store
vector_store = Qdrant(
    client=client,
    collection_name=COLLECTION_NAME,
    embeddings=embeddings,
)

# Initialize LLM
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("WARNING: GROQ_API_KEY is not set.")

llm = ChatGroq(
    temperature=0,
    model_name="openai/gpt-oss-120b",
    groq_api_key=groq_api_key
)

class QueryRequest(BaseModel):
    task_id: str
    question: str

@app.post("/upload")
async def upload_document(task_id: str = Form(...), file: UploadFile = Form(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Load and parse the PDF
        loader = PyPDFLoader(temp_file_path)
        documents = loader.load()
        
        # Add task_id to metadata
        for doc in documents:
            doc.metadata["task_id"] = task_id
            
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)
        
        # Store in Qdrant
        vector_store.add_documents(chunks)
        
        return {"message": "Document processed and stored successfully", "chunks_count": len(chunks)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/query")
async def query_document(request: QueryRequest):
    try:
        from qdrant_client.http import models as rest
        # Create a retriever that filters by task_id
        # Qdrant langchain stores metadata directly in payload by default unless payload_payload_key is specified.
        retriever = vector_store.as_retriever(
            search_kwargs={
                "filter": rest.Filter(
                    must=[
                        rest.FieldCondition(
                            key="metadata.task_id", 
                            match=rest.MatchValue(value=request.task_id)
                        )
                    ]
                )
            }
        )

        
        system_prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer the question. "
            "If you don't know the answer, say that you don't know. "
            "Use three sentences maximum and keep the answer concise."
            "\n\n"
            "{context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])
        
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)
        
        response = rag_chain.invoke({"input": request.question})
        
        return {"answer": response["answer"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def health_check():
    return {"status": "ok"}
