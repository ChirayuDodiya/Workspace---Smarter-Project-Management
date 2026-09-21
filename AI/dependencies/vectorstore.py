from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
import qdrant_client.http.exceptions
from langchain_qdrant import QdrantVectorStore

from config import QDRANT_URL, COLLECTION_NAME
from dependencies.embeddings import get_embeddings

def get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)

def init_vector_store() -> QdrantVectorStore:
    client = get_qdrant_client()
    try:
        client.get_collection(COLLECTION_NAME)
    except qdrant_client.http.exceptions.UnexpectedResponse:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
    
    embeddings = get_embeddings()
    return QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=embeddings,
    )
