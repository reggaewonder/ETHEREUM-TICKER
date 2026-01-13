import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for fetching OHLCV candlestick data
 * 
 * Strategy:
 * 1. Try Binance first (better data resolution)
 * 2. Fall back to CoinGecko if Binance is blocked
 * 
 * CoinGecko OHLC limitations:
 * - Only supports 1/7/14/30/90/180/365 day ranges
 * - Less granular than Binance
 * - But works everywhere!
 */

// Binance config (preferred)
const BINANCE_CONFIG = {
  '1H': { interval: '1m', limit: 60 },
  '4H': { interval: '5m', limit: 48 },
  '1D': { interval: '15m', limit: 96 },
  '1W': { interval: '1h', limit: 168 },
  '1M': { interval: '1d', limit: 30 },
}

// CoinGecko config (fallback)
const COINGECKO_CONFIG = {
  '1H': { days: '1' },      // 1 day gives ~24 candles
  '4H': { days: '1' },
  '1D': { days: '1' },
  '1W': { days: '7' },
  '1M': { days: '30' },
}

export function useCandlesticks(timeframe = '1D') {
  const [candles, setCandles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFromBinance = useCallback(async () => {
    const config = BINANCE_CONFIG[timeframe]
    const url = `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=${config.interval}&limit=${config.limit}`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('Binance fetch failed')
    
    const data = await response.json()
    return data.map(candle => ({
      time: Math.floor(candle[0] / 1000),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }))
  }, [timeframe])

  const fetchFromCoinGecko = useCallback(async () => {
    const config = COINGECKO_CONFIG[timeframe]
    const url = `https://api.coingecko.com/api/v3/coins/ethereum/ohlc?vs_currency=usd&days=${config.days}`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('CoinGecko fetch failed')
    
    const data = await response.json()
    
    // CoinGecko returns [timestamp, open, high, low, close]
    return data.map(candle => ({
      time: Math.floor(candle[0] / 1000),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: 0, // CoinGecko OHLC doesn't include volume
    }))
  }, [timeframe])

  const fetchCandles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Try Binance first
      const data = await fetchFromBinance()
      setCandles(data)
    } catch (binanceError) {
      console.log('Binance failed, trying CoinGecko:', binanceError.message)
      
      try {
        // Fall back to CoinGecko
        const data = await fetchFromCoinGecko()
        setCandles(data)
      } catch (geckoError) {
        console.error('Both APIs failed:', geckoError)
        setError('Unable to load chart data')
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFromBinance, fetchFromCoinGecko])

  useEffect(() => {
    fetchCandles()
  }, [fetchCandles])

  return { candles, loading, error, refetch: fetchCandles }
}

export { BINANCE_CONFIG, COINGECKO_CONFIG }
