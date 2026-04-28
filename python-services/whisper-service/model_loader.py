import os
import logging
from faster_whisper import WhisperModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("whisper-service")

# Global variable to hold the model instance
whisper_model = None

def load_model():
    """
    Initializes the Whisper model once at startup.
    Always uses CPU with int8 for stability (CUDA disabled).
    """
    global whisper_model
    model_name = os.getenv("WHISPER_MODEL", "base")

    logger.info(f"Loading Whisper model: {model_name}")
    logger.info("Using CPU for Whisper inference (CUDA disabled for stability)")

    whisper_model = WhisperModel(
        model_name,
        device="cpu",
        compute_type="int8"
    )

    logger.info(f"Model '{model_name}' loaded successfully on CPU.")

def get_model():
    """Accessor for the global model instance."""
    return whisper_model
