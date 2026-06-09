"""
Persistent ASR server — loads Wav2Vec2 model once, serves HTTP requests.
Run: python asr_server.py [port]   (default port 5200)
"""
import sys
import os
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
os.environ["PYTHONUTF8"] = "1"

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5200
MODEL_NAME = sys.argv[2] if len(sys.argv) > 2 else "nguyenvulebinh/wav2vec2-base-vietnamese-250h"

print(f"[ASR] Loading model: {MODEL_NAME}", flush=True)

import torch
import librosa
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
from flask import Flask, request, jsonify

processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

print(f"[ASR] Model loaded on {device}. Listening on port {PORT}", flush=True)

app = Flask(__name__)

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file"}), 400

    audio_file = request.files["audio"]
    suffix = Path(audio_file.filename or "audio.wav").suffix or ".wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        audio_file.save(f.name)
        temp_path = f.name

    try:
        speech, _ = librosa.load(temp_path, sr=16000, mono=True)
        input_values = processor(
            speech, sampling_rate=16000, return_tensors="pt", padding=True
        ).input_values.to(device)

        with torch.no_grad():
            logits = model(input_values).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        text = processor.batch_decode(predicted_ids)[0]
        return jsonify({"text": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            pass

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=False)
