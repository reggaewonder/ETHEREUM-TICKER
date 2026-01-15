import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for fetching ETH-related news from CryptoPanic
 * 
 * Why CryptoPanic?
 * - Free tier with no API key required for public endpoint
 * - Aggregates from 50+ crypto news sources
 * - Filters by currency (ETH)
 * - Already ranked by importance/virality
 * 
 * Note: We use their public RSS-style endpoint which doesn't require auth
 * For production with higher rate limits, you'd want an API key
 */

const NEWS_API_URL = 'https://cryptopanic.com/api/free/v1/posts/?auth_token=&public=true&currencies=ETH'

// Fallback: If CryptoPanic fails, we can use this backup approach
const BACKUP_NEWS_API = 'https://min-api.cryptocompare.com/data/v2/news/?categories=ETH&excludeCategories=Sponsored'

export function useNews(refreshInterval = 60000) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchNews = useCallback(async () => {
    try {
      // Try CryptoCompare first (more reliable, no auth needed)
      const response = await fetch(BACKUP_NEWS_API)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.Data && Array.isArray(data.Data)) {
        const formatted = data.Data.slice(0, 15).map(item => ({
          id: item.id,
          title: item.title,
          url: item.url,
          source: item.source_info?.name || item.source,
          publishedAt: new Date(item.published_on * 1000),
          imageUrl: item.imageurl,
          categories: item.categories?.split('|') || [],
        }))
        
        setNews(formatted)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch news:', err)
      setError(err.message)
      
      // Set some placeholder news on error so UI isn't empty
      setNews([
        {
          id: 1,
          title: 'Unable to load news - check your connection',
          url: '#',
          source: 'EthTicker',
          publishedAt: new Date(),
          categories: [],
        }
      ])
    } finally {
      setLoading(false)
      setLastUpdate(Date.now())
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return
    
    const interval = setInterval(fetchNews, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchNews, refreshInterval])

  return { news, loading, error, lastUpdate, refetch: fetchNews }
}

/**
 * Format relative time (e.g., "5m ago", "2h ago")
 */
export function formatRelativeTime(date) {
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
