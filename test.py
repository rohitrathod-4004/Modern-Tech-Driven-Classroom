import wave
import struct

with wave.open("test_audio.wav", "w") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(16000)
    for _ in range(16000 * 3):
        f.writeframes(struct.pack('<h', 0))