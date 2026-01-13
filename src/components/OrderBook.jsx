import { useBinanceOrderBook } from '../hooks/useBinanceOrderBook'
import { formatPrice, formatQuantity } from '../utils/formatters'

/**
 * OrderBook Component - Real-time bid/ask depth visualization
 * 
 * Design decisions:
 * - Asks on top (sorted low to high, so best ask at bottom of asks section)
 * - Spread in the middle
 * - Bids on bottom (sorted high to low, so best bid at top of bids section)
 * - Depth bars show cumulative volume at each level
 * - Color intensity increases with depth
 * 
 * This matches the standard exchange order book layout
 */

export function OrderBook() {
  const { bids, asks, spread, status } = useBinanceOrderBook(10)

  // Reverse asks so lowest (best) ask appears at bottom, closest to spread
  const reversedAsks = [...asks].reverse()

  return (
    <div className="bg-ticker-card border border-ticker-border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-ticker-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-ticker-text">Order Book</h3>
        <span className={`text-xs ${status === 'connected' ? 'text-ticker-green' : 'text-yellow-500'}`}>
          {status === 'connected' ? '● Live' : '○ ...'}
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs text-ticker-muted border-b border-ticker-border">
        <span>Price (USD)</span>
        <span className="text-right">Amount (ETH)</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (sells) - reversed so best ask is at bottom */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {reversedAsks.map((ask, i) => (
            <OrderRow 
              key={`ask-${i}`}
              price={ask.price}
              quantity={ask.quantity}
              total={ask.total}
              depthPercent={ask.depthPercent}
              type="ask"
            />
          ))}
        </div>

        {/* Spread indicator */}
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

        {/* Bids (buys) */}
        <div className="flex-1 overflow-y-auto">
          {bids.map((bid, i) => (
            <OrderRow 
              key={`bid-${i}`}
              price={bid.price}
              quantity={bid.quantity}
              total={bid.total}
              depthPercent={bid.depthPercent}
              type="bid"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Individual order row with depth bar
 */
function OrderRow({ price, quantity, total, depthPercent, type }) {
  const isBid = type === 'bid'
  const textColor = isBid ? 'text-ticker-green' : 'text-ticker-red'
  const bgColor = isBid 
    ? 'bg-ticker-green/10' 
    : 'bg-ticker-red/10'

  return (
    <div className="relative px-3 py-1 hover:bg-ticker-border/30 transition-colors">
      {/* Depth bar background */}
      <div 
        className={`absolute inset-y-0 ${isBid ? 'left-0' : 'right-0'} ${bgColor} transition-all duration-150`}
        style={{ width: `${Math.min(depthPercent, 100)}%` }}
      />
      
      {/* Content */}
      <div className="relative grid grid-cols-3 gap-2 text-xs font-mono">
        <span className={textColor}>
          {formatPrice(price, 2)}
        </span>
        <span className="text-right text-ticker-text">
          {formatQuantity(quantity, 4)}
        </span>
        <span className="text-right text-ticker-muted">
          {formatQuantity(total, 2)}
        </span>
      </div>
    </div>
  )
}
