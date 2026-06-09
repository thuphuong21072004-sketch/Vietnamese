import sys
import os
from pathlib import Path


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

    if len(sys.argv) < 2:
        print("Thiếu đường dẫn tệp âm thanh đầu vào.", file=sys.stderr)
        return 1

    audio_path = Path(sys.argv[1])
    model_name = sys.argv[2] if len(sys.argv) >= 3 else "nguyenvulebinh/wav2vec2-base-vietnamese-250h"

    if not audio_path.exists():
        print(f"Tệp âm thanh không tồn tại: {audio_path}", file=sys.stderr)
        return 1

    try:
        import torch
        import librosa
        from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
    except ImportError as e:
        print(f"Thiếu thư viện: {e}", file=sys.stderr)
        return 1

    try:
        processor = Wav2Vec2Processor.from_pretrained(model_name)
        model = Wav2Vec2ForCTC.from_pretrained(model_name)

        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)
        model.eval()

        speech, _ = librosa.load(str(audio_path), sr=16000, mono=True)

        input_values = processor(
            speech,
            sampling_rate=16000,
            return_tensors="pt",
            padding=True
        ).input_values.to(device)

        with torch.no_grad():
            logits = model(input_values).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = processor.batch_decode(predicted_ids)[0]

        print(transcription)
        return 0

    except Exception as e:
        print(str(e), file=sys.stderr)
        return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
