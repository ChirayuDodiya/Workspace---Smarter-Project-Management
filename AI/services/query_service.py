from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client.http import models as rest
from dependencies.vectorstore import init_vector_store
from dependencies.llm import get_llm

def query_rag(question: str, project_id: str, task_id: str = None):
    vector_store = init_vector_store()
    llm = get_llm()
    
    # Build dynamic filters based on project and task
    must_conditions = [
        rest.FieldCondition(
            key="metadata.project_id", 
            match=rest.MatchValue(value=str(project_id))
        )
    ]
    
    if task_id:
        must_conditions.append(
            rest.FieldCondition(
                key="metadata.task_id", 
                match=rest.MatchValue(value=str(task_id))
            )
        )
        
    retriever = vector_store.as_retriever(
        search_kwargs={
            "filter": rest.Filter(must=must_conditions)
        }
    )

    system_prompt = (
        "You are an AI assistant for a project management tool. "
        "Use the following pieces of retrieved context from uploaded project/task files to answer the user's question. "
        "If you don't know the answer, just say that you don't know. "
        "Keep the answer concise and helpful. your response will be shown as whatsapp chat dimention so format message in that way. "
        "Don't use any special characters in the answer."
        "\n\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])
    
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    response = rag_chain.invoke({"input": question})
    
    return {"answer": response["answer"]}
