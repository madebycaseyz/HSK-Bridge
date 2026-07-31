import { emptyLevelProgress } from '../domain/decks'
import type { LevelProgress, ProgressStore } from '../domain/types'

const STORAGE_KEY = 'hsk-deck-progress-v1'
const LEGACY_STORAGE_KEY = 'hsk-bridge-progress-v1'

function levelKey(level: number): string {
  return String(level)
}

export function loadProgressStore(): ProgressStore {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ProgressStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveProgressStore(store: ProgressStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getLevelProgress(store: ProgressStore, level: number): LevelProgress {
  return store[levelKey(level)] ?? emptyLevelProgress()
}

export function setLevelProgress(
  store: ProgressStore,
  level: number,
  progress: LevelProgress,
): ProgressStore {
  return {
    ...store,
    [levelKey(level)]: progress,
  }
}
