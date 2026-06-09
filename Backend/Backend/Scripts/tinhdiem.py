import re
import unicodedata
import difflib


def normalize_text(text: str) -> str:
    text = text.casefold()

    text = re.sub(
        r'[.,!?;:"()\[\]{}\-]',
        ' ',
        text
    )

    text = re.sub(r'\s+', ' ', text)

    return text.strip()


def remove_diacritics(text: str) -> str:
    text = text.replace('đ', 'd')
    text = text.replace('Đ', 'D')

    normalized = unicodedata.normalize(
        'NFD',
        text
    )

    return ''.join(
        c for c in normalized
        if unicodedata.category(c) != 'Mn'
    )


def levenshtein(a: str, b: str) -> int:

    n = len(a)
    m = len(b)

    dp = [[0] * (m + 1)
          for _ in range(n + 1)]

    for i in range(n + 1):
        dp[i][0] = i

    for j in range(m + 1):
        dp[0][j] = j

    for i in range(1, n + 1):
        for j in range(1, m + 1):

            cost = (
                0
                if a[i - 1] == b[j - 1]
                else 1
            )

            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )

    return dp[n][m]


def classify_word(expected: str,
                  actual: str):

    if expected == actual:
        return 100, "correct"

    exp_plain = remove_diacritics(expected)
    act_plain = remove_diacritics(actual)

    if exp_plain == act_plain:

        if actual.isascii():
            return 80, "missing_diacritic"

        return 95, "accent_error"

    distance = levenshtein(
        exp_plain,
        act_plain
    )

    if distance == 1:
        return 70, "character_error"

    if distance == 2:
        return 50, "character_error"

    return 0, "wrong_word"


def score_text(reference: str,
               transcript: str):

    reference = normalize_text(reference)
    transcript = normalize_text(transcript)

    ref_words = reference.split()
    hyp_words = transcript.split()

    matcher = difflib.SequenceMatcher(
        None,
        ref_words,
        hyp_words
    )

    scores = []

    errors = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():

        if tag == "equal":

            for word in ref_words[i1:i2]:

                scores.append(100)

        elif tag == "delete":

            for word in ref_words[i1:i2]:

                scores.append(0)

                errors.append({
                    "type": "missing_word",
                    "expected": word
                })

        elif tag == "insert":

            for word in hyp_words[j1:j2]:

                scores.append(0)

                errors.append({
                    "type": "extra_word",
                    "actual": word
                })

        elif tag == "replace":

            ref_chunk = ref_words[i1:i2]
            hyp_chunk = hyp_words[j1:j2]

            pair_count = min(
                len(ref_chunk),
                len(hyp_chunk)
            )

            for idx in range(pair_count):

                expected = ref_chunk[idx]
                actual = hyp_chunk[idx]

                word_score, error_type = (
                    classify_word(
                        expected,
                        actual
                    )
                )

                scores.append(word_score)

                if error_type != "correct":

                    errors.append({
                        "type": error_type,
                        "expected": expected,
                        "actual": actual,
                        "score": word_score
                    })

            if len(ref_chunk) > pair_count:

                for word in ref_chunk[pair_count:]:

                    scores.append(0)

                    errors.append({
                        "type": "missing_word",
                        "expected": word
                    })

            if len(hyp_chunk) > pair_count:

                for word in hyp_chunk[pair_count:]:

                    scores.append(0)

                    errors.append({
                        "type": "extra_word",
                        "actual": word
                    })

    final_score = (
        round(sum(scores) / len(scores), 2)
        if scores
        else 0
    )

    return {
        "score": final_score,
        "errors": errors
    }


# TEST

result = score_text(
    "Hôm nay trời rất đẹp",
    "Hôm nay troi dep dep"
)

print(result)