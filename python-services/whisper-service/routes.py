import time
import os
import logging
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from faster_whisper import WhisperModel
from model_loader import get_model
from typing import Optional

router = APIRouter()
logger = logging.getLogger("whisper-service")

# 10MB File Size Limit
MAX_FILE_SIZE = 10 * 1024 * 1024

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en")
):
    """
    Receives a WAV file, saves to a unique temp file, transcribes
    using faster-whisper, and cleans up.
    """
    model_name = os.getenv("WHISPER_MODEL", "base")
    request_id = str(uuid.uuid4())[:8]
    temp_file_path = f"temp_{request_id}_{file.filename}"

    logger.info(f"[{request_id}] Received transcription request for: {file.filename} (Model: {model_name}, Language: {language})")

    # 1. Check file size before processing
    try:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > MAX_FILE_SIZE:
            logger.warning(f"[{request_id}] File too large: {file_size} bytes")
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

        logger.info(f"[{request_id}] File size: {file_size / 1024:.2f} KB")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        logger.error(f"[{request_id}] Error checking file size: {str(e)}")
        raise HTTPException(status_code=500, detail="Error reading file metadata")

    # 2. Validation
    if not file.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only WAV files are supported")

    model = get_model()
    if model is None:
        logger.error(f"[{request_id}] Model is not initialized")
        raise HTTPException(status_code=503, detail="Model not initialized")

    start_time = time.time()

    try:
        # 3. Save to temporary file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. Attempt GPU transcription
        try:
            logger.info(f"[{request_id}] Starting transcription (GPU) language={language}")
            segments_gen, info = model.transcribe(
                temp_file_path,
                beam_size=5,
                vad_filter=True,
                language=language
            )
        except Exception as e:
            if "cublas" in str(e).lower() or "cuda" in str(e).lower():
                logger.info(f"[{request_id}] CUDA inference failed, switching to CPU model")
                cpu_model = WhisperModel(
                    model_name,
                    device="cpu",
                    compute_type="int8"
                )
                logger.info(f"[{request_id}] Using CPU fallback for transcription")
                segments_gen, info = cpu_model.transcribe(
                    temp_file_path,
                    beam_size=5,
                    vad_filter=True,
                    language=language
                )
            else:
                raise e

        # 5. Collect segments
        segments = []
        full_text = []

        for s in segments_gen:
            segments.append({
                "text": s.text.strip(),
                "start": round(s.start, 2),
                "end": round(s.end, 2)
            })
            full_text.append(s.text.strip())

        # 6. Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f"[{request_id}] Transcription complete. Latency: {latency_ms}ms")

        return {
            "text": " ".join(full_text),
            "segments": segments,
            "latency_ms": latency_ms
        }

    except Exception as e:
        logger.error(f"[{request_id}] Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        # 7. Ensure cleanup of temp file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as cleanup_err:
                logger.error(f"[{request_id}] Failed to delete temp file: {str(cleanup_err)}")
