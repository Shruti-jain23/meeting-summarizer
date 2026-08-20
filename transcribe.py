import sys
import json
import os

from faster_whisper import WhisperModel

audio_path = sys.argv[1]

model_size = os.environ.get("WHISPER_MODEL", "base")

model = WhisperModel(
    model_size,
    device="cpu",
    compute_type="int8"
)

segments, info = model.transcribe(
    audio_path,
    language="en",
    beam_size=5,
    best_of=5,
    temperature=0,
    vad_filter=True,
    condition_on_previous_text=True,
    initial_prompt=(
        "This is a technical software engineering meeting. "
        "Topics may include React, Next.js, JavaScript, "
        "TypeScript, Firebase, Firestore, APIs, databases, "
        "authentication, real-time listeners, collaboration, "
        "cloud computing, frontend, backend, and system architecture."
    )
)

text = " ".join(
    segment.text.strip()
    for segment in segments
).strip()

print(
    json.dumps(
        {"text": text},
        ensure_ascii=False
    )
)