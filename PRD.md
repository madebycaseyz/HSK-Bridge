# HSK Deck — Product Requirements

## Objective

Build a web app that helps students prepare for the HSK test using flashcards.

## How a flashcard works

- **Front:** Chinese character(s).
- **Back (after tap/click flip):** pinyin and meaning.
- **Actions (always available on front and back):**
  1. **Review again**
  2. **I know it well**
- **Navigation:** Next and back arrow buttons let the user move through the deck without rating.

## Levels and decks

- Levels **1–9**. Every level works the same way; only the vocabulary content differs.
- **No learning sets in v1.** Each level has three decks:
  1. **Main deck** — all words for that level, in list order.
  2. **Know-it-well deck** — words the user marked “I know it well” for that level.
  3. **Review-again deck** — words the user marked “Review again” for that level.

### Main deck progress

- The app saves where the user left off in the main deck and resumes at that word on the next visit.

### Rating behavior

- Rating a word (**Know it well** or **Review again**) adds it to the matching deck for that level.
- The word **stays in the main deck**. Know-it-well and review-again are extra decks the user can open; they do not remove words from the main list.
- **Latest rating wins:** a word is in at most one of know-it-well or review-again. Re-rating moves it to the new deck and removes it from the other.
- After a rating, the session **auto-advances** to the next card.
- Next/back arrows work without rating; resume position still tracks the card the user is on.

### Studying know / review decks

- Same flip UI, rating buttons, and next/back arrows.
- Re-rating moves the word to the other rated deck and removes it from the current one (same latest-wins rule).

### Study entry

User picks a level, then chooses which deck to study: main, know-it-well, or review-again.

## Vocabulary data

- **Phase 1:** Ship a small sample of Level 1 and Level 2 words so the study flow can be built and tested.
- **Phase 2:** Replace/expand with the full vocabulary list for all levels.
- Full list format: words grouped by level; within a level, keep the given order for the main deck.

## Platform and persistence (v1)

- **Platform:** Web-first (browser app). Keep domain logic (decks, ratings, resume position) separate from UI so a later native/app wrap or UI port is feasible.
- **Persistence:** Local only on the device/browser (`localStorage` / IndexedDB).
- **Accounts:** Not in v1. Accounts and cloud sync can be added later without redesigning the study model.

## Build plan (ABDCE)

Work in slices, then wire them together. Suggested order: **A → C → D → B → E**.

| Slice | What it delivers |
|-------|------------------|
| **A. Data model + word bank** | Card schema; sample HSK words for levels 1–2; structure ready for full list upload later |
| **B. Browse / select** | Pick level → pick deck (main / know / review) → start or resume |
| **C. Study session UI** | Flip card; show pinyin and meaning; two rating buttons; next/back |
| **D. Progress / decks** | Persist last position in main deck; add words into know-it-well and review-again decks |
| **E. Polish / ship** | Empty states, mobile-friendly layout, deploy the web app |
