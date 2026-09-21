import os
from dotenv import load_dotenv
from pathlib import Path

# Load from the root workspace .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
# Fallback
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET", "")

# Qdrant collection name
COLLECTION_NAME = "workspace_documents"
