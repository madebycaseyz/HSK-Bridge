import type { Word } from '../domain/types'

export type VocabLevel = {
  level: number
  label: string
}

type VocabRow = {
  id: string
  no: number
  level: number
  levelLabel: string
  characters: string
  pinyin: string
  partOfSpeech: string
  meaning: string
}

let words: Word[] = []
let levels: VocabLevel[] = []
let loadPromise: Promise<void> | null = null

function buildFromRows(rows: VocabRow[]) {
  words = rows.map((row) => ({
    id: row.id,
    level: row.level,
    levelLabel: row.levelLabel,
    characters: row.characters,
    pinyin: row.pinyin,
    partOfSpeech: row.partOfSpeech,
    meaning: row.meaning,
  }))

  const seen = new Set<number>()
  const nextLevels: VocabLevel[] = []
  for (const word of words) {
    if (seen.has(word.level)) continue
    seen.add(word.level)
    nextLevels.push({ level: word.level, label: word.levelLabel })
  }
  nextLevels.sort((a, b) => a.level - b.level)
  levels = nextLevels
}

/** Lazily load the full vocabulary pack (large JSON). */
export function loadVocabulary(): Promise<void> {
  if (words.length > 0) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = import('./vocab.json').then((mod) => {
    const rows = mod.default as VocabRow[]
    buildFromRows(rows)
  })

  return loadPromise
}

export function getWordsForLevel(level: number): Word[] {
  return words.filter((w) => w.level === level)
}

export function getAvailableLevels(): VocabLevel[] {
  return levels
}

export function getLevelLabel(level: number): string {
  return levels.find((l) => l.level === level)?.label ?? String(level)
}
