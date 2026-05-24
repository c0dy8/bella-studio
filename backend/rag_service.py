import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Inicializar Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Se necesita service role o anon con permisos

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

async def process_chat_message(message: str, user_id: str) -> str:
    """
    Flujo RAG a implementar:
    1. Convierte 'message' a embedding usando OpenAI
    2. Busca en supabase.table('knowledge_base').rpc('match_documents', {...})
    3. Pasa el contexto al LLM vía LangChain
    4. Retorna la respuesta generada
    """
    if not supabase:
        return "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env"
    
    # TODO: Implementar integración de LangChain + OpenAI + pgvector
    # Retornamos un mensaje base por ahora para probar la conexión con n8n
    return f"Recibí tu mensaje: '{message}'. ¡Pronto conectaremos el motor de IA!"
