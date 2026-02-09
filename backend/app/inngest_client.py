import inngest
import os
import tempfile
from minio import Minio
from app.core.config import settings
from app.services.transcription import transcribe_audio
from app.services.intelligence import intelligence_service
from app.db.storage import db

# Define Client
inngest_client = inngest.Inngest(
    app_id="voicemail-app",
    # is_production=settings.INNGEST_DEV != "1",
)

# MinIO Client (for downloading during processing)
minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_USE_SSL
)

@inngest_client.create_function(
    fn_id="process_voicemail",
    trigger=inngest.TriggerEvent(event="voicemail/received"),
)
async def process_voicemail(ctx, step=None):
    if step is None and hasattr(ctx, "step"):
        step = ctx.step
    """
    Durable workflow:
    1. Download audio from MinIO
    2. Transcribe (Whisper)
    3. Analyze (LangGraph + LLM)
    4. Update DB
    """
    file_id = ctx.event.data["file_id"]
    file_path = ctx.event.data["file_path"] # e.g. "uuid.wav"
    
    # --- Step 1: Download & Transcribe ---
    # We wrap this in step.run to memoize the transcript
    async def run_transcription():
        # Create a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            try:
                minio_client.fget_object(
                    settings.MINIO_BUCKET,
                    file_path,
                    tmp.name
                )
                # Call Whisper Service
                return await transcribe_audio(file_path, tmp.name)
            finally:
                # Cleanup
                if os.path.exists(tmp.name):
                    os.unlink(tmp.name)

    transcript = await step.run("transcribe_audio", run_transcription)
    
    analysis = await step.run("analyze_intent_urgency", lambda: intelligence_service.analyze_transcript(transcript))
    
    # --- Step 3: Determine Booking URL ---
    from app.services.calendly import calendly_service
    
    treatment_mode = analysis.get("treatment_mode", "Telehealth")
    booking_url = calendly_service.get_base_url(treatment_mode)
    
    # --- Step 4: Update Database ---
    async def update_state():
        # Flatten analysis for simpler DB structure or keep nested
        db.update_voicemail(file_id, {
            "transcript": transcript,
            "status": "COMPLETED",
            "urgency": analysis.get("urgency", "GREEN"),
            "category": analysis.get("intent", "Unknown"),
            "analysis": {
                **analysis,
                "booking_url": booking_url # Context-aware URL
            }
        })
        return "Updated"

    await step.run("update_db", update_state)

    return {"status": "success", "transcript_snippet": transcript[:50], "analysis": analysis}
