import { useState, useEffect } from 'react'

/**
 * Hook for fetching OHLCV candlestick data from CoinGecko
 * 
 * CoinGecko works everywhere and doesn't require API keys.
 * Chart data doesn't need to be real-time, so this is fine.
 */

const TIMEFRAME_CONFIG = {
  '24H': { days: '1' },
  '7D': { days: '7' },
  '30D': { days: '30' },
  '6M': { days: '180' },
  '1Y': { days: '365' },
  '2Y': { days: '730' },
  '3Y': { days: '1095' },
  '5Y': { days: '1825' },
  '10Y': { days: 'max' },  // CoinGecko 'max' gives all available history
}

export function useCandlesticks(timeframe = '1D') {
  const [candles, setCandles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCandles = async () => {
      const config = TIMEFRAME_CONFIG[timeframe]
      if (!config) return

      setLoading(true)
      setError(null)

      try {
        const url = `https://api.coingecko.com/api/v3/coins/ethereum/ohlc?vs_currency=usd&days=${config.days}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        // CoinGecko returns [timestamp, open, high, low, close]
        const formatted = data.map(candle => ({
          time: Math.floor(candle[0] / 1000),
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: 0, // CoinGecko OHLC doesn't include volume
        }))

        setCandles(formatted)
      } catch (err) {
        console.error('Failed to fetch candles:', err)
        setError('Failed to load chart data')
      } finally {
        setLoading(false)
      }
    }

    fetchCandles()
  }, [timeframe])

  return { candles, loading, error }
}
