/**
 * TimeframeSelector - Tab-style buttons for chart timeframe
 * 
 * Design: Minimal, pill-style buttons that match the dark theme
 * Behavior: Instant switch (data fetches in background)
 */

const TIMEFRAMES = ['1H', '4H', '1D', '1W', '1M']

export function TimeframeSelector({ selected, onChange }) {
  return (
    <div className="flex gap-1 bg-ticker-bg p-1 rounded-lg">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all
            ${selected === tf 
              ? 'bg-ticker-card text-white shadow-sm' 
              : 'text-ticker-muted hover:text-ticker-text hover:bg-ticker-card/50'
            }
          `}
        >
          {tf}
        </button>
      ))}
    </div>
  )
}
