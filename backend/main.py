import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router
from app.inngest_client import inngest_client, process_voicemail
import inngest.fast_api
from app.db.session import engine, Base

# Logging
logging.basicConfig(level=logging.INFO)

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(api_router, prefix="/api")

# Serve Inngest
inngest.fast_api.serve(app, inngest_client, [process_voicemail])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
