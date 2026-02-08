import os
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribe_audio(file_path: str, local_path: str) -> str:
    """
    Transcribes audio using OpenAI Whisper model.
    """
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Audio file not found: {local_path}")
        
    with open(local_path, "rb") as audio_file:
        transcription = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    return transcription.text
