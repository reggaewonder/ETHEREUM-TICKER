/**
 * TimeframeSelector - Tab-style buttons for chart timeframe
 * 
 * Design: Minimal, pill-style buttons that match the dark theme
 * Behavior: Instant switch (data fetches in background)
 */

const TIMEFRAMES = ['24H', '7D', '30D', '6M', '1Y', '2Y', '3Y', '5Y', '10Y']

export function TimeframeSelector({ selected, onChange }) {
  return (
    <div className="flex gap-1 bg-ticker-bg p-1 rounded-lg overflow-x-auto">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`
            px-2 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap
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
