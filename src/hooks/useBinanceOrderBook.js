import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook for real-time order book via Binance WebSocket
 * 
 * Why partial book depth stream?
 * - Full order book is massive (thousands of levels)
 * - We only need top 10-20 levels for display
 * - Binance offers optimized partial streams: @depth5, @depth10, @depth20
 * - Updates every 100ms or 1000ms depending on stream
 * 
 * Data structure:
 * - bids: [[price, quantity], ...] sorted high to low (best bid first)
 * - asks: [[price, quantity], ...] sorted low to high (best ask first)
 */

export function useBinanceOrderBook(levels = 10) {
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
    lastUpdate: null,
  })
  const [status, setStatus] = useState('connecting')
  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setStatus('connecting')

    // Use depth20@100ms for responsive updates with reasonable depth
    // Format: ethusdt@depth{levels}@{speed}ms
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@depth20@100ms')

    ws.onopen = () => {
      setStatus('connected')
      reconnectAttempts.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Transform to our format with parsed numbers
        // Binance sends: { bids: [["price", "qty"], ...], asks: [...] }
        const bids = data.bids.slice(0, levels).map(([price, qty]) => ({
          price: parseFloat(price),
          quantity: parseFloat(qty),
          total: parseFloat(price) * parseFloat(qty),
        }))

        const asks = data.asks.slice(0, levels).map(([price, qty]) => ({
          price: parseFloat(price),
          quantity: parseFloat(qty),
          total: parseFloat(price) * parseFloat(qty),
        }))

        // Calculate cumulative quantities for depth visualization
        let bidCumulative = 0
        const bidsWithCumulative = bids.map(bid => {
          bidCumulative += bid.quantity
          return { ...bid, cumulative: bidCumulative }
        })

        let askCumulative = 0
        const asksWithCumulative = asks.map(ask => {
          askCumulative += ask.quantity
          return { ...ask, cumulative: askCumulative }
        })

        // Find max cumulative for percentage bars
        const maxCumulative = Math.max(
          bidCumulative,
          askCumulative
        )

        setOrderBook({
          bids: bidsWithCumulative.map(b => ({ 
            ...b, 
            depthPercent: (b.cumulative / maxCumulative) * 100 
          })),
          asks: asksWithCumulative.map(a => ({ 
            ...a, 
            depthPercent: (a.cumulative / maxCumulative) * 100 
          })),
          maxCumulative,
          lastUpdate: Date.now(),
        })
      } catch (err) {
        console.error('Failed to parse order book:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('OrderBook WebSocket error:', error)
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus('connecting')
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
      reconnectAttempts.current++
      setTimeout(connect, delay)
    }

    wsRef.current = ws
  }, [levels])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  // Calculate spread
  const spread = orderBook.bids[0] && orderBook.asks[0]
    ? {
        value: orderBook.asks[0].price - orderBook.bids[0].price,
        percent: ((orderBook.asks[0].price - orderBook.bids[0].price) / orderBook.asks[0].price) * 100,
      }
    : null

  return { 
    bids: orderBook.bids, 
    asks: orderBook.asks, 
    spread,
    status,
    lastUpdate: orderBook.lastUpdate,
  }
}
