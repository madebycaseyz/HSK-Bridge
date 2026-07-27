#!/usr/bin/env python3
"""One-time extract New HSK vocabulary PDFs into src/data/vocab.json."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]

PDFS = [
    (ROOT / "assets/New-HSK-Vocabulary-Level-1.pdf", 1, "1", 300, True),
    (ROOT / "assets/New-HSK-Vocabulary-Level-2.pdf", 2, "2", 200, True),
    (ROOT / "assets/New-HSK-Vocabulary-Level-3.pdf", 3, "3", 500, True),
    (ROOT / "assets/New-HSK-Vocabulary-Level-4.pdf", 4, "4", 1000, True),
    (ROOT / "assets/New-HSK-Vocabulary-Level-5.pdf", 5, "5", 1600, True),
    (ROOT / "assets/New-HSK-Vocabulary-L6.pdf", 6, "6", 1800, True),
    (ROOT / "assets/New-HSK-Vocabulary-Level-7-9.pdf", 7, "7-9", 5600, False),
]

EN_POS = re.compile(
    r"(?i)^(verb|noun|adjective|adverb|pronoun|classifier|measure(?:\s+word)?|"
    r"auxiliary|particle|interjection|preposition|conjunction|numeral|number|"
    r"suffix|prefix|phrase|idiom|onomatopoeia)\b"
)

PINYIN_RE = re.compile(
    r"[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]"
)

POS_TOKEN = (
    r"(?:verb|noun|adjective|adverb|pronoun|classifier|measure(?:\s+word)?|"
    r"auxiliary|particle|interjection|preposition|conjunction|numeral|number|"
    r"suffix|prefix|phrase|idiom|onomatopoeia|"
    r"名|动|形|副|量|介|连|助|代|叹|拟|数|缀)"
)

POS_PREFIX = re.compile(
    rf"(?i)^({POS_TOKEN}(?:\s*[、,]\s*(?:{POS_TOKEN}|\([^)]{{0,24}}\)|（[^）]{{0,24}}）))*)\s*(.*)$"
)

WORD_FIXES = {
    "劳verb": "劳动",
}


def normalize_cjk(s: str) -> str:
    return unicodedata.normalize("NFKC", s).strip()


def is_noise(line: str) -> bool:
    if not line:
        return True
    if line in {
        ">>",
        "NEW HSK VOCABULARY",
        "NO.",
        "WORD",
        "PINYIN",
        "PART OF SPEECH",
        "TRANSLATION",
        "ENTRIES",
        "MandarinBean.com",
    }:
        return True
    if line.startswith(("New HSK Vocabulary", "Access graded", "Access HSK", "⇨")):
        return True
    if re.fullmatch(r"Page \d+", line):
        return True
    if re.fullmatch(r"Level(?: \d+(?: - \d+)?)?", line):
        return True
    return False


def looks_like_pinyin(s: str) -> bool:
    if not s or re.search(r"[\u4e00-\u9fff]", s):
        return False
    return bool(PINYIN_RE.search(s))


def looks_like_hanzi_word(s: str) -> bool:
    s = normalize_cjk(s)
    return bool(s) and len(re.findall(r"[\u4e00-\u9fff]", s)) >= 1


def looks_like_pos_head(s: str) -> bool:
    s = s.strip()
    if not s or re.match(r"(?i)^measure word for\b", s):
        return False
    return bool(POS_PREFIX.match(s))


def looks_like_pos_cont(s: str) -> bool:
    s = s.strip()
    if not s or len(s) > 28:
        return False
    inner = re.fullmatch(r"[（(]([^）)]+)[）)]", s)
    if inner and re.search(POS_TOKEN, inner.group(1), re.I):
        return True
    if re.fullmatch(rf"(?i){POS_TOKEN}[、,]?", s):
        return True
    return False


def split_pos_meaning(block: list[str]) -> tuple[str, str]:
    if not block:
        return "", ""
    pos_parts: list[str] = []
    meaning_parts: list[str] = []
    i = 0
    head = block[0].strip()
    if looks_like_pos_head(head):
        m = POS_PREFIX.match(head)
        assert m
        pos_parts.append(m.group(1).strip().rstrip("、,").strip())
        rest = re.sub(r"^[、,\s]+", "", m.group(2).strip())
        if rest:
            meaning_parts.append(rest)
        i = 1
        while i < len(block) and not meaning_parts and looks_like_pos_cont(block[i]):
            pos_parts.append(block[i].strip().rstrip("、,").strip())
            i += 1
    meaning_parts.extend(block[i:])
    meaning = re.sub(r"\s+", " ", " ".join(meaning_parts)).strip()
    pos = re.sub(r"\s+", " ", " ".join(pos_parts)).strip()
    return pos, meaning


def is_entry_number(lines: list[str], i: int, min_no: int) -> bool:
    if i >= len(lines) or not re.fullmatch(r"\d+", lines[i]):
        return False
    n = int(lines[i])
    if n < min_no:
        return False
    if i + 1 >= len(lines):
        return False
    return looks_like_hanzi_word(lines[i + 1])


def pdf_lines(path: Path) -> list[str]:
    doc = fitz.open(path)
    out: list[str] = []
    for page in doc:
        for raw in page.get_text("text").splitlines():
            line = raw.strip()
            if is_noise(line):
                continue
            out.append(line)
    return out


def find_start(lines: list[str]) -> int:
    for i, line in enumerate(lines):
        if line == "1" and i + 1 < len(lines) and looks_like_hanzi_word(lines[i + 1]):
            return i
    raise RuntimeError("Could not find entry 1")


def extract_pdf(
    path: Path, level_num: int, level_label: str, expected: int, has_translation: bool
) -> list[dict]:
    lines = pdf_lines(path)
    lines = lines[find_start(lines) :]
    entries: list[dict] = []
    i = 0
    next_no = 1

    while i < len(lines):
        if not is_entry_number(lines, i, next_no):
            i += 1
            continue
        no = int(lines[i])
        i += 1
        word = normalize_cjk(lines[i])
        word = WORD_FIXES.get(word, word)
        i += 1

        pinyin = ""
        if i < len(lines) and looks_like_pinyin(lines[i]):
            pinyin = lines[i]
            i += 1

        block: list[str] = []
        while i < len(lines) and not is_entry_number(lines, i, no + 1):
            block.append(lines[i])
            i += 1

        pos, meaning = split_pos_meaning(block)
        if not has_translation:
            meaning = ""

        entries.append(
            {
                "id": f"l{level_label}-{no}",
                "no": no,
                "level": level_num,
                "levelLabel": level_label,
                "characters": word,
                "pinyin": pinyin,
                "partOfSpeech": pos,
                "meaning": meaning,
            }
        )
        next_no = no + 1

    if len(entries) != expected:
        nos = {e["no"] for e in entries}
        missing = [n for n in range(1, expected + 1) if n not in nos]
        raise SystemExit(
            f"{path.name}: got {len(entries)} expected {expected}; missing {missing[:20]}"
        )
    return entries


def main() -> None:
    all_entries: list[dict] = []
    for path, level_num, level_label, expected, has_tr in PDFS:
        entries = extract_pdf(path, level_num, level_label, expected, has_tr)
        print(f"{path.name}: {len(entries)} OK")
        print(f"  sample: {entries[0]}")
        all_entries.extend(entries)

    out = ROOT / "src/data/vocab.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(all_entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(all_entries)} words -> {out}")


if __name__ == "__main__":
    main()
