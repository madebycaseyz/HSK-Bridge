import { useCallback, useEffect, useState } from 'react'
import { getAvailableLevels, getWordsForLevel } from './data/words'
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
  const [screen, setScreen] = useState<Screen>({ name: 'levels' })
  const [store, setStore] = useState(() => loadProgressStore())

  useEffect(() => {
    saveProgressStore(store)
  }, [store])

  const levels = getAvailableLevels()

  const handleRate = useCallback(
    (level: number, deck: DeckKind, index: number, rating: Rating) => {
      setStore((prev) => {
        const progress = getLevelProgress(prev, level)
        const mainWords = getWordsForLevel(level)
        const deckWords = getDeckWords(mainWords, progress, deck)
        const word = deckWords[index]
        if (!word) return prev

        let next = applyRating(progress, word.id, rating)
        const nextDeckWords = getDeckWords(mainWords, next, deck)

        if (deck === 'main') {
          const advanced = Math.min(index + 1, Math.max(mainWords.length - 1, 0))
          next = withDeckIndex(next, 'main', advanced)
        } else if (nextDeckWords.length === 0) {
          next = withDeckIndex(next, deck, 0)
        } else if (rating === (deck === 'know' ? 'know' : 'review')) {
          const advanced = Math.min(index + 1, nextDeckWords.length - 1)
          next = withDeckIndex(next, deck, advanced)
        } else {
          next = withDeckIndex(next, deck, clampIndex(index, nextDeckWords.length))
        }

        return setLevelProgress(prev, level, next)
      })
    },
    [],
  )

  const persistIndex = useCallback((level: number, deck: DeckKind, nextIndex: number) => {
    setStore((prev) => {
      const progress = getLevelProgress(prev, level)
      return setLevelProgress(prev, level, withDeckIndex(progress, deck, nextIndex))
    })
  }, [])

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
      onBack={() => setScreen({ name: 'decks', level: screen.level })}
      onFlipNavigate={(delta) => {
        if (deckWords.length === 0) return
        persistIndex(screen.level, screen.deck, clampIndex(index + delta, deckWords.length))
      }}
      onRate={(rating) => handleRate(screen.level, screen.deck, index, rating)}
    />
  )
}
