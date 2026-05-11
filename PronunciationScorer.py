from rapidfuzz import fuzz
import unicodedata


class PronunciationScorer:

    # ===== Utils =====
    def remove_accents(self, text):
        return ''.join(
            c for c in unicodedata.normalize('NFD', text)
            if unicodedata.category(c) != 'Mn'
        )

    # ===== So sánh 1 từ =====
    def compare_word(self, user_word, correct_word):
        user_word = user_word.lower().strip()
        correct_word = correct_word.lower().strip()

        # THIẾU từ
        if user_word == "" and correct_word != "":
            return {
                "word": "",
                "expected": correct_word,
                "score": 0,
                "status": "missing",
                "suggestion": f"Bạn bị thiếu từ: '{correct_word}'"
            }

        # THỪA từ
        if user_word != "" and correct_word == "":
            return {
                "word": user_word,
                "expected": "",
                "score": 20,
                "status": "extra",
                "suggestion": f"Từ '{user_word}' không cần thiết"
            }

        # so sánh có dấu
        score_with = fuzz.ratio(user_word, correct_word)

        # so sánh không dấu
        user_no = self.remove_accents(user_word)
        correct_no = self.remove_accents(correct_word)
        score_no = fuzz.ratio(user_no, correct_no)

        # phân loại lỗi
        if score_with == 100:
            status = "correct"
            suggestion = ""
        elif score_no == 100:
            status = "wrong_accent"
            suggestion = f"Sai dấu, nên đọc: '{correct_word}'"
        elif score_no > 70:
            status = "close"
            suggestion = f"Gần đúng, thử lại: '{correct_word}'"
        else:
            status = "wrong"
            suggestion = f"Sai, cần đọc: '{correct_word}'"

        # điểm (phạt dấu)
        final_score = 0.7 * score_with + 0.3 * score_no

        return {
            "word": user_word,
            "expected": correct_word,
            "score": round(final_score, 2),
            "status": status,
            "suggestion": suggestion
        }

    # ===== Alignment thông minh =====
    def align_words(self, user_words, correct_words):
        matched = []
        used = set()

        # match từng từ user với correct tốt nhất
        for uw in user_words:
            best_score = 0
            best_idx = -1

            for i, cw in enumerate(correct_words):
                if i in used:
                    continue

                score = fuzz.ratio(uw, cw)
                if score > best_score:
                    best_score = score
                    best_idx = i

            if best_idx != -1 and best_score > 50:
                used.add(best_idx)
                matched.append((uw, correct_words[best_idx]))
            else:
                matched.append((uw, ""))  # từ thừa

        # thêm từ bị thiếu
        for i, cw in enumerate(correct_words):
            if i not in used:
                matched.append(("", cw))

        return matched

    # ===== Feedback tổng =====
    def get_overall_feedback(self, score):
        if score >= 90:
            return "Phát âm rất tốt"
        elif score >= 75:
            return "Khá tốt nhưng cần cải thiện"
        elif score >= 50:
            return "Trung bình, cần luyện thêm"
        else:
            return "Phát âm chưa tốt"

    # ===== Phân tích cả câu =====
    def analyze_sentence(self, user_text, correct_text):
        user_words = user_text.strip().split()
        correct_words = correct_text.strip().split()

        pairs = self.align_words(user_words, correct_words)

        results = []
        total_score = 0

        for user_word, correct_word in pairs:
            res = self.compare_word(user_word, correct_word)
            results.append(res)
            total_score += res["score"]

        avg_score = total_score / len(pairs) if pairs else 0

        return {
            "sentence_score": round(avg_score, 2),
            "overall_feedback": self.get_overall_feedback(avg_score),
            "details": results
        }

if __name__ == "__main__":
    scorer = PronunciationScorer()

    tests = [
        ("xin chao", "xin chào")
            ]

    import json

    for user, correct in tests:
        print("\n====================")
        print("User:", user)
        print("Correct:", correct)

        result = scorer.analyze_sentence(user, correct)
        print(json.dumps(result, indent=2, ensure_ascii=False))