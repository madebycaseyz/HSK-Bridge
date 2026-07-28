import { useCallback, useEffect, useState } from 'react'
import {
  getAvailableLevels,
  getWordsForLevel,
  loadVocabulary,
} from './data/words'
import {
  applyRating,
  clampIndex,
  countRatings,
  getDeckIndex,
  getDeckWords,
  withDeckIndex,
} from './domain/decks'
import type { DeckKind, Rating } from './domain/types'
import {
  getLevelProgress,
  loadProgressStore,
  saveProgressStore,
  setLevelProgress,
} from './storage/localProgress'
import { DeckSelect } from './components/DeckSelect'
import { LevelSelect } from './components/LevelSelect'
import { StudySession } from './components/StudySession'

type Screen =
  | { name: 'levels' }
  | { name: 'decks'; level: number }
  | { name: 'study'; level: number; deck: DeckKind }

export default function App() {
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'levels' })
  const [store, setStore] = useState(() => loadProgressStore())
  const [deckComplete, setDeckComplete] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadVocabulary()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load vocabulary. Refresh and try again.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveProgressStore(store)
  }, [store])

  useEffect(() => {
    setDeckComplete(false)
  }, [screen])

  const handleRate = useCallback((level: number, deck: DeckKind, index: number, rating: Rating) => {
    setStore((prev) => {
      const progress = getLevelProgress(prev, level)
      const mainWords = getWordsForLevel(level)
      const deckWords = getDeckWords(mainWords, progress, deck)
      const word = deckWords[index]
      if (!word) return prev

      let next = applyRating(progress, word.id, rating)
      const nextDeckWords = getDeckWords(mainWords, next, deck)
      let finished = false

      if (deck === 'main') {
        if (index >= mainWords.length - 1) {
          finished = true
          next = withDeckIndex(next, 'main', index)
        } else {
          next = withDeckIndex(next, 'main', index + 1)
        }
      } else if (nextDeckWords.length === 0) {
        finished = true
        next = withDeckIndex(next, deck, 0)
      } else {
        const stillInDeck = nextDeckWords.some((w) => w.id === word.id)
        if (stillInDeck) {
          const pos = nextDeckWords.findIndex((w) => w.id === word.id)
          if (pos >= nextDeckWords.length - 1) {
            finished = true
            next = withDeckIndex(next, deck, pos)
          } else {
            next = withDeckIndex(next, deck, pos + 1)
          }
        } else if (index >= nextDeckWords.length) {
          finished = true
          next = withDeckIndex(next, deck, nextDeckWords.length - 1)
        } else {
          next = withDeckIndex(next, deck, index)
        }
      }

      queueMicrotask(() => {
        if (finished) setDeckComplete(true)
      })

      return setLevelProgress(prev, level, next)
    })
  }, [])

  const persistIndex = useCallback(
    (level: number, deck: DeckKind, nextIndex: number) => {
      setDeckComplete(false)
      setStore((prev) => {
        const progress = getLevelProgress(prev, level)
        return setLevelProgress(prev, level, withDeckIndex(progress, deck, nextIndex))
      })
    },
    [],
  )

  if (loadError) {
    return (
      <div className="page boot">
        <h1 className="brand">HSK Bridge</h1>
        <p className="lede">{loadError}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="page boot" aria-busy="true">
        <p className="eyebrow">HSK prep</p>
        <h1 className="brand">HSK Bridge</h1>
        <p className="lede">Loading vocabulary…</p>
        <div className="boot-bar" aria-hidden="true">
          <span className="boot-bar-fill" />
        </div>
      </div>
    )
  }

  const levels = getAvailableLevels()

  if (screen.name === 'levels') {
    return (
      <LevelSelect
        levels={levels}
        onSelect={(level) => setScreen({ name: 'decks', level })}
      />
    )
  }

  const progress = getLevelProgress(store, screen.level)
  const mainWords = getWordsForLevel(screen.level)
  const counts = countRatings(progress)

  if (screen.name === 'decks') {
    return (
      <DeckSelect
        level={screen.level}
        mainCount={mainWords.length}
        knowCount={counts.know}
        reviewCount={counts.review}
        resumeIndex={clampIndex(progress.mainIndex, mainWords.length)}
        onBack={() => setScreen({ name: 'levels' })}
        onSelect={(deck) => setScreen({ name: 'study', level: screen.level, deck })}
      />
    )
  }

  const deckWords = getDeckWords(mainWords, progress, screen.deck)
  const index = clampIndex(getDeckIndex(progress, screen.deck), deckWords.length)

  return (
    <StudySession
      level={screen.level}
      deck={screen.deck}
      words={deckWords}
      index={index}
      complete={deckComplete}
      onBack={() => setScreen({ name: 'decks', level: screen.level })}
      onFlipNavigate={(delta) => {
        if (deckWords.length === 0) return
        persistIndex(screen.level, screen.deck, clampIndex(index + delta, deckWords.length))
      }}
      onRate={(rating) => handleRate(screen.level, screen.deck, index, rating)}
      onRestart={() => {
        setDeckComplete(false)
        persistIndex(screen.level, screen.deck, 0)
      }}
    />
  )
}
