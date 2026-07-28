import { useEffect, useState } from 'react'
import { getLevelLabel } from '../data/words'
import type { DeckKind, Rating, Word } from '../domain/types'

type StudySessionProps = {
  level: number
  deck: DeckKind
  words: Word[]
  index: number
  complete: boolean
  onBack: () => void
  onFlipNavigate: (delta: number) => void
  onRate: (rating: Rating) => void
  onRestart: () => void
}

const deckTitles: Record<DeckKind, string> = {
  main: 'Main deck',
  know: 'I know it well',
  review: 'Review again',
}

function displayLabel(label: string): string {
  return label === '7-9' ? '7–9' : label
}

export function StudySession({
  level,
  deck,
  words,
  index,
  complete,
  onBack,
  onFlipNavigate,
  onRate,
  onRestart,
}: StudySessionProps) {
  const [flipped, setFlipped] = useState(false)
  const word = words[index]
  const levelLabel = displayLabel(getLevelLabel(level))

  useEffect(() => {
    setFlipped(false)
  }, [word?.id, index])

  if (complete) {
    return (
      <div className="page">
        <button type="button" className="text-back" onClick={onBack}>
          ← Decks
        </button>
        <div className="empty-state">
          <h1 className="brand">Deck complete</h1>
          <p className="lede">
            You’ve reached the end of {deckTitles[deck].toLowerCase()} for HSK {levelLabel}.
          </p>
          <div className="done-actions">
            <button type="button" className="rate-btn know" onClick={onRestart}>
              Start from beginning
            </button>
            <button type="button" className="secondary-btn" onClick={onBack}>
              Back to decks
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (words.length === 0 || !word) {
    return (
      <div className="page">
        <button type="button" className="text-back" onClick={onBack}>
          ← Decks
        </button>
        <div className="empty-state">
          <h1 className="brand">Nothing here yet</h1>
          <p className="lede">
            {deck === 'know' || deck === 'review'
              ? 'Rate words from the main deck to fill this list.'
              : 'No vocabulary loaded for this level.'}
          </p>
        </div>
      </div>
    )
  }

  const meaningText = word.meaning.trim() ? word.meaning : '—'
  const atEnd = index >= words.length - 1

  return (
    <div className="page study">
      <div className="study-top">
        <button type="button" className="text-back" onClick={onBack}>
          ← Decks
        </button>
        <p className="study-meta">
          HSK {levelLabel} · {deckTitles[deck]} · {index + 1}/{words.length}
        </p>
      </div>

      <button
        type="button"
        className={`flashcard ${flipped ? 'is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show character' : 'Show pinyin and meaning'}
      >
        <div className="flashcard-face flashcard-front">
          <span className="hanzi">{word.characters}</span>
          <span className="tap-hint">Tap to flip</span>
        </div>
        <div className="flashcard-face flashcard-back">
          <span className="pinyin">{word.pinyin}</span>
          <span className="meaning">{meaningText}</span>
          {word.partOfSpeech ? (
            <span className="pos">{word.partOfSpeech}</span>
          ) : null}
        </div>
      </button>

      <div className="controls">
        <div className="nav-row">
          <button
            type="button"
            className="nav-btn"
            onClick={() => onFlipNavigate(-1)}
            disabled={index <= 0}
            aria-label="Previous card"
          >
            ←
          </button>
          <button
            type="button"
            className="nav-btn"
            onClick={() => onFlipNavigate(1)}
            disabled={atEnd}
            aria-label="Next card"
          >
            →
          </button>
        </div>

        <div className="rate-row">
          <button
            type="button"
            className="rate-btn review"
            onClick={(e) => {
              e.stopPropagation()
              onRate('review')
            }}
          >
            Review again
          </button>
          <button
            type="button"
            className="rate-btn know"
            onClick={(e) => {
              e.stopPropagation()
              onRate('know')
            }}
          >
            I know it well
          </button>
        </div>
      </div>
    </div>
  )
}
