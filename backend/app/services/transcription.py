import os
from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribe_audio(file_path: str, temp_file_path: str) -> str:
    """
    Transcribes audio using OpenAI Whisper.
    Note: In a real docker environment, we would download the file from MinIO to a temp path first.
    For this prototype, we assume the file is accessible or downloaded to 'temp_file_path'.
    """
    if not settings.OPENAI_API_KEY:
        return "[MOCK] OpenAI Key missing. Transcription skipped."

    try:
        with open(temp_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        return transcript.text
    except Exception as e:
        print(f"Transcription error: {e}")
        return f"[ERROR] Transcription failed: {str(e)}"
