import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook for ETH price with multiple providers
 * 
 * Strategy:
 * 1. CoinGecko REST API (works everywhere, updates every 10s)
 * 2. Binance WebSocket (real-time bonus if not blocked)
 * 
 * This ensures the app works in the USA and everywhere else,
 * while still getting real-time updates where possible.
 */

export function useBinancePrice() {
  const [data, setData] = useState({
    price: null,
    priceChange: null,
    priceChangePercent: null,
    high24h: null,
    low24h: null,
    quoteVolume24h: null,
    prevPrice: null,
  })
  
  const [status, setStatus] = useState('connecting')
  const wsRef = useRef(null)
  const geckoIntervalRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const binanceWorking = useRef(false)

  // CoinGecko fetcher (reliable fallback)
  const fetchFromCoinGecko = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
      )
      
      if (!response.ok) throw new Error('CoinGecko fetch failed')
      
      const coin = await response.json()
      const market = coin.market_data
      
      setData(prev => ({
        price: market.current_price.usd,
        priceChange: market.price_change_24h,
        priceChangePercent: market.price_change_percentage_24h,
        high24h: market.high_24h.usd,
        low24h: market.low_24h.usd,
        quoteVolume24h: market.total_volume.usd,
        prevPrice: prev.price,
      }))
      
      // Only set connected if Binance isn't working
      if (!binanceWorking.current) {
        setStatus('connected')
      }
    } catch (err) {
      console.error('CoinGecko error:', err)
      // Don't change status if Binance is working
      if (!binanceWorking.current) {
        setStatus('error')
      }
    }
  }, [])

  // Binance WebSocket (real-time if available)
  const connectBinance = useCallback(() => {
    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@ticker')
      
      // Set a connection timeout
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          console.log('Binance WebSocket timeout - using CoinGecko')
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(timeout)
        binanceWorking.current = true
        setStatus('live')
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        const ticker = JSON.parse(event.data)
        setData(prev => ({
          price: parseFloat(ticker.c),
          priceChange: parseFloat(ticker.p),
          priceChangePercent: parseFloat(ticker.P),
          high24h: parseFloat(ticker.h),
          low24h: parseFloat(ticker.l),
          quoteVolume24h: parseFloat(ticker.q),
          prevPrice: prev.price,
        }))
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        binanceWorking.current = false
        console.log('Binance WebSocket error - falling back to CoinGecko')
      }

      ws.onclose = () => {
        binanceWorking.current = false
        
        // Only retry a few times, then give up on Binance
        if (reconnectAttempts.current < 3) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          reconnectAttempts.current++
          setTimeout(connectBinance, delay)
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.log('Binance WebSocket not available')
      binanceWorking.current = false
    }
  }, [])

  useEffect(() => {
    // Start with CoinGecko (guaranteed to work)
    fetchFromCoinGecko()
    
    // Poll CoinGecko every 10 seconds as baseline
    geckoIntervalRef.current = setInterval(fetchFromCoinGecko, 10000)
    
    // Try Binance WebSocket for real-time (bonus)
    connectBinance()

    return () => {
      if (wsRef.current) wsRef.current.close()
      if (geckoIntervalRef.current) clearInterval(geckoIntervalRef.current)
    }
  }, [fetchFromCoinGecko, connectBinance])

  return { ...data, status }
}
