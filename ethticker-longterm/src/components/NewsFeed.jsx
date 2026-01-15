import { useNews, formatRelativeTime } from '../hooks/useNews'

/**
 * NewsFeed Component - ETH news headlines
 * 
 * Design decisions:
 * - Horizontal scrolling on mobile, grid on desktop
 * - Show source + relative time for context
 * - Open links in new tab
 * - Subtle hover effects
 * - Auto-refresh indicator
 */

export function NewsFeed() {
  const { news, loading, error, lastUpdate, refetch } = useNews(60000) // Refresh every 60s

  return (
    <div className="bg-ticker-card border border-ticker-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ticker-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-ticker-text">Latest News</h3>
          <span className="text-xs text-ticker-muted">• ETH</span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-ticker-muted">
              Updated {formatRelativeTime(new Date(lastUpdate))}
            </span>
          )}
          <button 
            onClick={refetch}
            className="text-ticker-muted hover:text-ticker-text transition-colors"
            title="Refresh news"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* News content */}
      <div className="p-4">
        {loading && news.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-ticker-muted">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading news...
          </div>
        ) : error && news.length === 0 ? (
          <div className="text-center py-8 text-ticker-muted">
            <div className="text-2xl mb-2">📰</div>
            <div>Unable to load news</div>
            <button 
              onClick={refetch}
              className="mt-2 text-xs text-ticker-green hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.slice(0, 6).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Individual news card
 */
function NewsCard({ item }) {
  return (
    <a 
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-ticker-bg hover:bg-ticker-border/50 transition-colors group"
    >
      <h4 className="text-sm text-ticker-text group-hover:text-white transition-colors line-clamp-2 leading-snug">
        {item.title}
      </h4>
      <div className="flex items-center gap-2 mt-2 text-xs text-ticker-muted">
        <span className="truncate max-w-[120px]">{item.source}</span>
        <span>•</span>
        <span>{formatRelativeTime(item.publishedAt)}</span>
      </div>
    </a>
  )
}

/**
 * Compact horizontal news ticker (alternative layout)
 */
export function NewsTickerCompact() {
  const { news, loading } = useNews(60000)

  if (loading && news.length === 0) {
    return (
      <div className="bg-ticker-card border border-ticker-border rounded-lg p-3 text-center text-ticker-muted text-sm">
        Loading news...
      </div>
    )
  }

  return (
    <div className="bg-ticker-card border border-ticker-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        <span className="text-xs font-medium text-ticker-muted uppercase tracking-wider shrink-0">
          News
        </span>
        {news.slice(0, 5).map((item, i) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ticker-text hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {item.title.length > 60 ? item.title.slice(0, 60) + '...' : item.title}
            {i < 4 && <span className="text-ticker-border ml-4">|</span>}
          </a>
        ))}
      </div>
    </div>
  )
}
