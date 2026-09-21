from langchain_groq import ChatGroq
from config import GROQ_API_KEY

def get_llm():
    if not GROQ_API_KEY:
        print("WARNING: GROQ_API_KEY is not set.")
    
    return ChatGroq(
        temperature=0,
        model_name="openai/gpt-oss-120b",
        api_key=GROQ_API_KEY
    )
