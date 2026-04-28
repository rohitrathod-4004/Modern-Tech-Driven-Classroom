import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager
from model_loader import load_model
from routes import router
import os
from dotenv import load_dotenv

# Load environment variables (.env)
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model once
    load_model()
    yield
    # Shutdown: Clean up if needed
    pass

app = FastAPI(
    title="Whisper Transcription Service",
    description="Microservice for high-speed audio transcription using faster-whisper",
    lifespan=lifespan
)

# Register routes
app.include_router(router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": os.getenv("WHISPER_MODEL", "base")}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
