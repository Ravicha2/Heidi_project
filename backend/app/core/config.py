import os
from pydantic import BaseModel

class Settings(BaseModel):
    # App
    PROJECT_NAME: str = "Intelligent Voicemail"
    
    # MinIO
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "minio:9000").replace("https://", "").replace("http://", "").rstrip("/")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "admin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "password123")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "voicemails")
    MINIO_USE_SSL: bool = os.getenv("MINIO_USE_SSL", "False").lower() == "true"
    
    # Inngest
    INNGEST_BASE_URL: Optional[str] = os.getenv("INNGEST_BASE_URL")
    INNGEST_DEV: str = os.getenv("INNGEST_DEV", "0")
    INNGEST_SIGNING_KEY: Optional[str] = os.getenv("INNGEST_SIGNING_KEY")
    INNGEST_EVENT_KEY: Optional[str] = os.getenv("INNGEST_EVENT_KEY")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()
