import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook for real-time order book via Binance WebSocket
 * 
 * Note: There's no free alternative for order book data.
 * If Binance is blocked, we gracefully show "unavailable"
 * rather than breaking the whole app.
 */

export function useBinanceOrderBook(levels = 10) {
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
  })
  const [status, setStatus] = useState('connecting')
  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnects = 3

  const connect = useCallback(() => {
    // Don't keep trying if we've failed too many times
    if (reconnectAttempts.current >= maxReconnects) {
      setStatus('unavailable')
      return
    }

    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@depth20@100ms')
      
      // Connection timeout
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          setStatus('unavailable')
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(timeout)
        setStatus('connected')
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
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

          // Calculate cumulative quantities
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

          const maxCumulative = Math.max(bidCumulative, askCumulative)

          setOrderBook({
            bids: bidsWithCumulative.map(b => ({ 
              ...b, 
              depthPercent: (b.cumulative / maxCumulative) * 100 
            })),
            asks: asksWithCumulative.map(a => ({ 
              ...a, 
              depthPercent: (a.cumulative / maxCumulative) * 100 
            })),
          })
        } catch (err) {
          console.error('Failed to parse order book:', err)
        }
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        console.log('Order book WebSocket error')
      }

      ws.onclose = () => {
        reconnectAttempts.current++
        
        if (reconnectAttempts.current < maxReconnects) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          setStatus('connecting')
          setTimeout(connect, delay)
        } else {
          setStatus('unavailable')
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.log('Order book WebSocket not available')
      setStatus('unavailable')
    }
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
  }
}
