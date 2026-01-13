import { useBinanceOrderBook } from '../hooks/useBinanceOrderBook'
import { formatPrice, formatQuantity } from '../utils/formatters'

/**
 * OrderBook Component - Real-time bid/ask depth visualization
 * 
 * Now with graceful handling when Binance is blocked:
 * - Shows "unavailable" message instead of breaking
 * - Still looks good even without data
 */

export function OrderBook() {
  const { bids, asks, spread, status } = useBinanceOrderBook(10)

  // Reverse asks so lowest (best) ask appears at bottom
  const reversedAsks = [...asks].reverse()

  // Show unavailable state
  if (status === 'unavailable') {
    return (
      <div className="bg-ticker-card border border-ticker-border rounded-lg overflow-hidden h-full flex flex-col">
        <div className="px-3 py-2 border-b border-ticker-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-ticker-text">Order Book</h3>
          <span className="text-xs text-ticker-muted">○ Unavailable</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-ticker-muted">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm">Order book unavailable</div>
            <div className="text-xs mt-1 opacity-60">
              Real-time data blocked in your region
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ticker-card border border-ticker-border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-ticker-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-ticker-text">Order Book</h3>
        <span className={`text-xs ${status === 'connected' ? 'text-ticker-green' : 'text-yellow-500'}`}>
          {status === 'connected' ? '● Live' : '○ Connecting...'}
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs text-ticker-muted border-b border-ticker-border">
        <span>Price (USD)</span>
        <span className="text-right">Amount (ETH)</span>
        <span className="text-right">Total</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks */}
        <div className="flex-1 overflow-y-auto">
          {reversedAsks.length > 0 ? (
            reversedAsks.map((ask, i) => (
              <OrderRow 
                key={`ask-${i}`}
                price={ask.price}
                quantity={ask.quantity}
                total={ask.total}
                depthPercent={ask.depthPercent}
                type="ask"
              />
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-ticker-muted text-xs">
              Loading...
            </div>
          )}
        </div>

        {/* Spread */}
        <div className="px-3 py-2 bg-ticker-bg border-y border-ticker-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ticker-muted">Spread</span>
            {spread ? (
              <span className="font-mono text-ticker-text">
                ${formatPrice(spread.value, 2)} 
                <span className="text-ticker-muted ml-1">
                  ({spread.percent.toFixed(3)}%)
                </span>
              </span>
            ) : (
              <span className="text-ticker-muted">—</span>
            )}
          </div>
        </div>

        {/* Bids */}
        <div className="flex-1 overflow-y-auto">
          {bids.length > 0 ? (
            bids.map((bid, i) => (
              <OrderRow 
                key={`bid-${i}`}
                price={bid.price}
                quantity={bid.quantity}
                total={bid.total}
                depthPercent={bid.depthPercent}
                type="bid"
              />
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-ticker-muted text-xs">
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrderRow({ price, quantity, total, depthPercent, type }) {
  const isBid = type === 'bid'
  const textColor = isBid ? 'text-ticker-green' : 'text-ticker-red'
  const bgColor = isBid ? 'bg-ticker-green/10' : 'bg-ticker-red/10'

  return (
    <div className="relative px-3 py-1 hover:bg-ticker-border/30 transition-colors">
      <div 
        className={`absolute inset-y-0 ${isBid ? 'left-0' : 'right-0'} ${bgColor} transition-all duration-150`}
        style={{ width: `${Math.min(depthPercent, 100)}%` }}
      />
      <div className="relative grid grid-cols-3 gap-2 text-xs font-mono">
        <span className={textColor}>{formatPrice(price, 2)}</span>
        <span className="text-right text-ticker-text">{formatQuantity(quantity, 4)}</span>
        <span className="text-right text-ticker-muted">{formatQuantity(total, 2)}</span>
      </div>
    </div>
  )
}
