import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for fetching OHLCV candlestick data from Binance
 * 
 * Why REST instead of WebSocket for historical data?
 * - WebSocket only gives us real-time updates
 * - We need historical candles to draw the chart initially
 * - REST is perfect for "give me the last N candles"
 * 
 * Timeframe mapping:
 * - 1H = 60 candles of 1m each (last hour)
 * - 4H = 48 candles of 5m each  
 * - 1D = 96 candles of 15m each
 * - 1W = 168 candles of 1h each
 * - 1M = 30 candles of 1d each
 */

// Map our UI timeframes to Binance intervals
const TIMEFRAME_CONFIG = {
  '1H': { interval: '1m', limit: 60 },
  '4H': { interval: '5m', limit: 48 },
  '1D': { interval: '15m', limit: 96 },
  '1W': { interval: '1h', limit: 168 },
  '1M': { interval: '1d', limit: 30 },
}

export function useCandlesticks(timeframe = '1D') {
  const [candles, setCandles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCandles = useCallback(async () => {
    const config = TIMEFRAME_CONFIG[timeframe]
    if (!config) {
      setError(`Invalid timeframe: ${timeframe}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=${config.interval}&limit=${config.limit}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Transform Binance data to chart format
      // Binance returns: [openTime, open, high, low, close, volume, closeTime, ...]
      const formatted = data.map(candle => ({
        time: Math.floor(candle[0] / 1000), // Convert ms to seconds for lightweight-charts
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }))

      setCandles(formatted)
    } catch (err) {
      console.error('Failed to fetch candles:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  // Fetch on mount and when timeframe changes
  useEffect(() => {
    fetchCandles()
  }, [fetchCandles])

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchCandles()
  }, [fetchCandles])

  return { candles, loading, error, refetch }
}

export { TIMEFRAME_CONFIG }
