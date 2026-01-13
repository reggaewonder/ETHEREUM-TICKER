import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook for real-time order book via Coinbase WebSocket
 * 
 * Coinbase provides level2 order book data:
 * - level2_batch channel gives us aggregated order book updates
 * - We maintain a local order book state and apply updates
 * 
 * This is more complex than Binance because Coinbase sends
 * incremental updates rather than full snapshots.
 */

export function useCoinbaseOrderBook(levels = 10) {
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
  })
  const [status, setStatus] = useState('connecting')
  
  const wsRef = useRef(null)
  const bidsMap = useRef(new Map())
  const asksMap = useRef(new Map())
  const reconnectAttempts = useRef(0)

  const processOrderBook = useCallback(() => {
    // Convert maps to sorted arrays
    const bidsArray = Array.from(bidsMap.current.entries())
      .map(([price, size]) => ({ price: parseFloat(price), quantity: parseFloat(size) }))
      .filter(b => b.quantity > 0)
      .sort((a, b) => b.price - a.price) // Highest first
      .slice(0, levels)

    const asksArray = Array.from(asksMap.current.entries())
      .map(([price, size]) => ({ price: parseFloat(price), quantity: parseFloat(size) }))
      .filter(a => a.quantity > 0)
      .sort((a, b) => a.price - b.price) // Lowest first
      .slice(0, levels)

    // Calculate totals and cumulative
    let bidCumulative = 0
    const bidsWithData = bidsArray.map(bid => {
      bidCumulative += bid.quantity
      return {
        ...bid,
        total: bid.price * bid.quantity,
        cumulative: bidCumulative,
      }
    })

    let askCumulative = 0
    const asksWithData = asksArray.map(ask => {
      askCumulative += ask.quantity
      return {
        ...ask,
        total: ask.price * ask.quantity,
        cumulative: askCumulative,
      }
    })

    // Calculate depth percentages
    const maxCumulative = Math.max(bidCumulative, askCumulative) || 1

    setOrderBook({
      bids: bidsWithData.map(b => ({ ...b, depthPercent: (b.cumulative / maxCumulative) * 100 })),
      asks: asksWithData.map(a => ({ ...a, depthPercent: (a.cumulative / maxCumulative) * 100 })),
    })
  }, [levels])

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Clear order book state
    bidsMap.current.clear()
    asksMap.current.clear()
    setStatus('connecting')

    try {
      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com')

      ws.onopen = () => {
        // Subscribe to level2_batch for order book updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          product_ids: ['ETH-USD'],
          channels: ['level2_batch']
        }))
        
        setStatus('connected')
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          // Handle initial snapshot
          if (msg.type === 'snapshot' && msg.product_id === 'ETH-USD') {
            bidsMap.current.clear()
            asksMap.current.clear()

            // Process bids [price, size]
            msg.bids.forEach(([price, size]) => {
              bidsMap.current.set(price, size)
            })

            // Process asks [price, size]
            msg.asks.forEach(([price, size]) => {
              asksMap.current.set(price, size)
            })

            processOrderBook()
          }

          // Handle incremental updates
          if (msg.type === 'l2update' && msg.product_id === 'ETH-USD') {
            msg.changes.forEach(([side, price, size]) => {
              const map = side === 'buy' ? bidsMap.current : asksMap.current
              
              if (parseFloat(size) === 0) {
                map.delete(price)
              } else {
                map.set(price, size)
              }
            })

            processOrderBook()
          }
        } catch (err) {
          console.error('Failed to parse order book message:', err)
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
    } catch (err) {
      console.error('Failed to create OrderBook WebSocket:', err)
      setStatus('error')
    }
  }, [processOrderBook])

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
