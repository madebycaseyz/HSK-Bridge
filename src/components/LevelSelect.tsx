import type { VocabLevel } from '../data/words'

type LevelSelectProps = {
  levels: VocabLevel[]
  onSelect: (level: number) => void
}

function displayLabel(label: string): string {
  return label === '7-9' ? '7–9' : label
}

export function LevelSelect({ levels, onSelect }: LevelSelectProps) {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">HSK prep</p>
        <h1 className="brand">HSK Bridge</h1>
        <p className="lede">Flashcards for every level — pick up where you left off.</p>
      </header>

      <section className="section" aria-label="Choose a level">
        <h2 className="section-title">Choose a level</h2>
        <div className="level-grid">
          {levels.map(({ level, label }) => (
            <button
              key={level}
              type="button"
              className="level-btn"
              onClick={() => onSelect(level)}
            >
              <span className="level-num">{displayLabel(label)}</span>
              <span className="level-label">HSK {displayLabel(label)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
