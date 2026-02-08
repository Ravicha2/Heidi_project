from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from app.core.config import settings
from app.db.storage import db
from app.inngest_client import inngest_client
import inngest
import uuid
import uuid as uuid_lib
from minio import Minio
from datetime import datetime

router = APIRouter()

# MinIO Client (for Uploads)
minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_USE_SSL
)

@router.post("/voicemails")
async def create_voicemail(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.wav"
    
    # Ensure bucket exists
    if not minio_client.bucket_exists(settings.MINIO_BUCKET):
        minio_client.make_bucket(settings.MINIO_BUCKET)
    
    # Stream upload
    try:
        minio_client.put_object(
            settings.MINIO_BUCKET, 
            filename, 
            file.file, 
            length=-1, 
            part_size=10*1024*1024
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")
    
    # Initial DB Record
    db.save_voicemail({
        "id": file_id,
        "status": "PROCESSING",
        "file_path": filename,
        "created_at": str(datetime.now()),
        "transcript": None,
        "urgency": None,
        "category": None
    })
    
    # Trigger Inngest Event
    await inngest_client.send(
        inngest.Event(
            name="voicemail/received", 
            data={"file_id": file_id, "file_path": filename}
        )
    )
    
    return {"id": file_id, "status": "queued"}

@router.get("/voicemails/audio/{file_path}")
async def get_voicemail_audio(file_path: str):
    try:
        # Get object from MinIO
        response = minio_client.get_object(settings.MINIO_BUCKET, file_path)
        
        # Generator to stream the file content
        def iterfile():
            try:
                for chunk in response.stream(1024*1024):
                    yield chunk
            finally:
                response.close()
                response.release_conn()

        return StreamingResponse(iterfile(), media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Audio file not found")

@router.get("/voicemails")
async def list_voicemails():
    data = db.list_voicemails()
    # Sort by Urgency (Red first)
    urgency_map = {"RED": 0, "YELLOW": 1, "GREEN": 2, None: 3}
    # SQLAlchemy objects use dot notation, not .get()
    sorted_data = sorted(data, key=lambda x: urgency_map.get(x.urgency, 3))
    return sorted_data
