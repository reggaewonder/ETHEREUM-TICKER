import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook for real-time ETH/USDT price via Binance WebSocket
 * 
 * Why Binance? 
 * - No API key needed for public WebSocket
 * - ~100ms update frequency
 * - Reliable, high uptime
 * 
 * Returns live ticker data including price, 24h change, volume, etc.
 */
export function useBinancePrice() {
  const [data, setData] = useState({
    price: null,
    priceChange: null,
    priceChangePercent: null,
    high24h: null,
    low24h: null,
    volume24h: null,        // ETH volume
    quoteVolume24h: null,   // USDT volume (dollar value)
    lastUpdate: null,
    prevPrice: null,        // For flash animation
  })
  
  const [status, setStatus] = useState('connecting') // connecting, connected, error
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  
  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    setStatus('connecting')
    
    // Binance 24hr ticker stream for ETHUSDT
    // This gives us everything: price, 24h change, volume, high/low
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@ticker')
    
    ws.onopen = () => {
      setStatus('connected')
      reconnectAttempts.current = 0
    }
    
    ws.onmessage = (event) => {
      try {
        const ticker = JSON.parse(event.data)
        
        setData(prev => ({
          price: parseFloat(ticker.c),              // Current price
          priceChange: parseFloat(ticker.p),        // 24h price change
          priceChangePercent: parseFloat(ticker.P), // 24h price change %
          high24h: parseFloat(ticker.h),            // 24h high
          low24h: parseFloat(ticker.l),             // 24h low
          volume24h: parseFloat(ticker.v),          // 24h ETH volume
          quoteVolume24h: parseFloat(ticker.q),     // 24h USDT volume
          lastUpdate: Date.now(),
          prevPrice: prev.price,                    // Store previous for animation
        }))
      } catch (err) {
        console.error('Failed to parse ticker data:', err)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setStatus('error')
    }
    
    ws.onclose = () => {
      setStatus('connecting')
      
      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
      reconnectAttempts.current++
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, delay)
    }
    
    wsRef.current = ws
  }, [])
  
  useEffect(() => {
    connect()
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])
  
  return { ...data, status }
}
