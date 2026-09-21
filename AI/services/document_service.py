import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dependencies.vectorstore import init_vector_store

def process_and_store_document(file_path: str, project_id: str, task_id: str, original_filename: str):
    try:
        print(f"Processing {original_filename} for Project {project_id}, Task {task_id}")
        
        ext = original_filename.lower().split('.')[-1]
        
        if ext == 'pdf':
            loader = PyPDFLoader(file_path)
        elif ext in ['txt', 'md']:
            loader = TextLoader(file_path, encoding='utf-8')
        elif ext == 'docx':
            loader = Docx2txtLoader(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
            
        documents = loader.load()
        
        for doc in documents:
            doc.metadata["project_id"] = str(project_id)
            if task_id:
                doc.metadata["task_id"] = str(task_id)
            doc.metadata["source_file"] = original_filename
            
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)
        
        # Inject filename into EVERY chunk's text so semantic search can match queries by filename
        for chunk in chunks:
            chunk.page_content = f"Source Document: {original_filename}\n\n{chunk.page_content}"
        
        vector_store = init_vector_store()
        vector_store.add_documents(chunks)
        
        print(f"Successfully processed and stored {len(chunks)} chunks.")
        return {"status": "success", "chunks": len(chunks)}
    except Exception as e:
        print(f"Error processing document: {e}")
        raise e
    finally:
        # Cleanup temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
