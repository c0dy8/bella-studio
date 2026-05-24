from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from rag_service import process_chat_message

app = FastAPI(title="Bella Studio AI Backend")

class ChatRequest(BaseModel):
    message: str
    user_id: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/webhook/chat", response_model=ChatResponse)
async def chat_webhook(request: ChatRequest):
    try:
        reply = await process_chat_message(request.message, request.user_id)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
