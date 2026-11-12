"""Validate a bracketed TOEFL C-test and render an offline practice page."""
import argparse
import base64
import html
import json
from pathlib import Path
import re


ASSETS = Path(__file__).resolve().parents[1] / "assets"
LETTER = r"[^\W\d_]"
PART = rf"{LETTER}+(?:\[[A-Za-z]+\])?"
WORD = re.compile(rf"{PART}(?:[-'’]{PART})*")
GAP = re.compile(r"\[([A-Za-z]+)\]")


def render_passage(source):
    if re.search(r"\n\s*\n", source.strip()):
        raise ValueError("Use one paragraph.")
    passage = " ".join(source.split())
    if not passage.endswith((".", "!", "?")):
        raise ValueError("End the passage with terminal punctuation.")
    sentences = re.split(r"(?<=[.!?])\s+", passage)
    if len(sentences) < 4 or any("[" in line or "]" in line for line in [sentences[0], *sentences[-2:]]):
        raise ValueError("Keep the opening sentence and at least two closing sentences intact.")
    words = list(WORD.finditer(passage))
    if not 75 <= len(words) <= 85:
        raise ValueError(f"Expected 75–85 words, found {len(words)}.")
    if len(GAP.findall(passage)) != 10 or "[" in GAP.sub("", passage) or "]" in GAP.sub("", passage):
        raise ValueError("Use exactly ten [letter] suffixes and no other brackets.")
    if not GAP.search(sentences[1]):
        raise ValueError("Start gapping in the second sentence.")

    fragments = []
    answers = []
    used = set()
    cursor = 0
    previous_position = -2
    for position, match in enumerate(words):
        token = match.group()
        gaps = list(GAP.finditer(token))
        if not gaps:
            continue
        if len(gaps) != 1 or match.start() and passage[match.start() - 1].isalnum():
            raise ValueError(f"Invalid gap inside {token!r}.")
        gap = gaps[0]
        if gap.end() != len(token) or match.end() < len(passage) and passage[match.end()].isalnum():
            raise ValueError(f"Bracketed letters must finish the whole word: {token!r}.")
        if position - previous_position < 2:
            raise ValueError("Leave at least one intact word after each gapped word.")
        previous_position = position
        suffix = gap.group(1)
        prefix = token[:gap.start()]
        whole = prefix + suffix
        word_length = sum(letter.isalpha() for letter in whole)
        if 3 <= word_length <= 4 and len(suffix) != 2:
            raise ValueError(f"Gap exactly two final letters in {whole!r}.")
        if word_length > 4 and len(suffix) < 3:
            raise ValueError(f"Gap at least three final letters in {whole!r}.")
        if whole.casefold() in used:
            raise ValueError(f"Repeated gapped word: {whole}.")
        used.add(whole.casefold())
        answers.append({"suffix": suffix, "word": whole})
        label = html.escape(f"Blank {len(answers)}. Missing letters after {prefix}", quote=True)
        fragments.append(html.escape(passage[cursor:match.start()]))
        fragments.append(
            f'<span class="cloze-word">{html.escape(prefix)}'
            f'<input aria-label="{label}" type="text" class="blank-input" style="--blank-length:{len(suffix)}" '
            f'maxlength="{len(suffix)}" autocomplete="off" autocapitalize="none" spellcheck="false">'
            '</span>'
        )
        cursor = match.end()
    if len(answers) != 10:
        raise ValueError("Every gap needs a visible letter prefix in the same word.")
    fragments.append(html.escape(passage[cursor:]))
    return "".join(fragments), answers, len(words)


def image_data(name):
    data = base64.b64encode((ASSETS / name).read_bytes()).decode("ascii")
    return "data:image/png;base64," + data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("passage", type=Path, help="UTF-8 plain text containing one bracketed passage")
    parser.add_argument("output", type=Path, help="path for the standalone HTML")
    args = parser.parse_args()
    if args.passage.resolve() == args.output.resolve():
        parser.error("The input and output must be different files.")
    try:
        passage_html, answers, count = render_passage(args.passage.read_text(encoding="utf-8-sig"))
    except ValueError as error:
        parser.error(str(error))
    values = {
        "PASSAGE": passage_html,
        "ANSWER_DATA": json.dumps(answers, ensure_ascii=True).replace("<", r"\u003c"),
        "AVATAR": image_data("avatar.png"),
    }
    template = (ASSETS / "practice.html").read_text(encoding="utf-8")
    page = re.sub(r"@@([A-Z_]+)@@", lambda match: values[match.group(1)], template)
    args.output.write_text(page, encoding="utf-8")
    print(f"Rendered {count} words and {len(answers)} gaps to {args.output}")


if __name__ == "__main__":
    main()
