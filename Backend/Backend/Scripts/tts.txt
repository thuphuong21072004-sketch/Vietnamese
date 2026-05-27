import sys
from pathlib import Path

from gtts import gTTS


def main() -> int:
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

    if len(sys.argv) != 2:
        print("Thiếu đường dẫn tệp âm thanh đầu ra.", file=sys.stderr)
        return 1

    text = sys.stdin.read().strip()
    if not text:
        print("Nội dung đọc không được để trống.", file=sys.stderr)
        return 1

    output_path = Path(sys.argv[1])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    gTTS(text=text, lang="vi", tld="com.vn").save(str(output_path))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)