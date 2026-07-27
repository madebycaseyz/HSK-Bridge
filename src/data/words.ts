import vocab from './vocab.json'
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

const rows = vocab as VocabRow[]

export const WORDS: Word[] = rows.map((row) => ({
  id: row.id,
  level: row.level,
  levelLabel: row.levelLabel,
  characters: row.characters,
  pinyin: row.pinyin,
  partOfSpeech: row.partOfSpeech,
  meaning: row.meaning,
}))

const LEVELS: VocabLevel[] = []
const seen = new Set<number>()
for (const word of WORDS) {
  if (seen.has(word.level)) continue
  seen.add(word.level)
  LEVELS.push({ level: word.level, label: word.levelLabel })
}
LEVELS.sort((a, b) => a.level - b.level)

export function getWordsForLevel(level: number): Word[] {
  return WORDS.filter((w) => w.level === level)
}

export function getAvailableLevels(): VocabLevel[] {
  return LEVELS
}

export function getLevelLabel(level: number): string {
  return LEVELS.find((l) => l.level === level)?.label ?? String(level)
}
