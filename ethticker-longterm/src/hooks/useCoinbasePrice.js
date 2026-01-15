import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook for real-time ETH price via Coinbase WebSocket
 * 
 * Why Coinbase?
 * - Works in USA (legally operates there)
 * - No API key required for public WebSocket
 * - Real-time ticker updates
 * - Reliable and fast
 * 
 * WebSocket endpoint: wss://ws-feed.exchange.coinbase.com
 * Channel: ticker (for real-time price updates)
 */

export function useCoinbasePrice() {
  const [data, setData] = useState({
    price: null,
    priceChange: null,
    priceChangePercent: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    prevPrice: null,
    open24h: null,
  })
  
  const [status, setStatus] = useState('connecting')
  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setStatus('connecting')

    try {
      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com')

      ws.onopen = () => {
        // Subscribe to ETH-USD ticker
        ws.send(JSON.stringify({
          type: 'subscribe',
          product_ids: ['ETH-USD'],
          channels: ['ticker']
        }))
        
        setStatus('connected')
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          
          // Handle ticker updates
          if (msg.type === 'ticker' && msg.product_id === 'ETH-USD') {
            const price = parseFloat(msg.price)
            const open24h = parseFloat(msg.open_24h)
            const high24h = parseFloat(msg.high_24h)
            const low24h = parseFloat(msg.low_24h)
            const volume24h = parseFloat(msg.volume_24h)
            
            // Calculate 24h change
            const priceChange = price - open24h
            const priceChangePercent = ((price - open24h) / open24h) * 100

            setData(prev => ({
              price,
              priceChange,
              priceChangePercent,
              high24h,
              low24h,
              volume24h,
              open24h,
              prevPrice: prev.price,
            }))
          }
        } catch (err) {
          console.error('Failed to parse Coinbase message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('Coinbase WebSocket error:', error)
        setStatus('error')
      }

      ws.onclose = () => {
        setStatus('connecting')
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++
        
        setTimeout(connect, delay)
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { ...data, status }
}
