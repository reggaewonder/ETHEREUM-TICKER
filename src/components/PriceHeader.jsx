import { useEffect, useRef, useState } from 'react'
import { formatPrice, formatPercent, formatVolume } from '../utils/formatters'

/**
 * PriceHeader - The hero component showing live ETH price
 * 
 * Design decisions:
 * - Large, prominent price display (it's the main event)
 * - Green/red flash on price change for visual feedback
 * - Secondary stats (24h change, volume, high/low) in a row below
 * - Monospace font for numbers to prevent layout shift
 */
export function PriceHeader({ 
  price, 
  prevPrice, 
  priceChange, 
  priceChangePercent, 
  high24h, 
  low24h, 
  quoteVolume24h,
  status 
}) {
  const priceRef = useRef(null)
  const [flashClass, setFlashClass] = useState('')
  
  // Flash effect when price changes
  useEffect(() => {
    if (price && prevPrice && price !== prevPrice) {
      const newClass = price > prevPrice ? 'flash-green' : 'flash-red'
      setFlashClass(newClass)
      
      const timer = setTimeout(() => setFlashClass(''), 500)
      return () => clearTimeout(timer)
    }
  }, [price, prevPrice])
  
  const isPositive = priceChangePercent >= 0
  const changeColor = isPositive ? 'text-ticker-green' : 'text-ticker-red'
  
  return (
    <header className="bg-ticker-card border-b border-ticker-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top row: Logo + Main Price */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo and name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-6 h-6">
                <g fill="#fff">
                  <polygon fillOpacity=".6" points="16 4 16 12.87 23 16.17"/>
                  <polygon points="16 4 9 16.17 16 12.87"/>
                  <polygon fillOpacity=".6" points="16 21.96 16 28 23 17.61"/>
                  <polygon points="16 28 16 21.96 9 17.61"/>
                  <polygon fillOpacity=".2" points="16 20.57 23 16.17 16 12.87"/>
                  <polygon fillOpacity=".6" points="9 16.17 16 20.57 16 12.87"/>
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Ethereum</h1>
              <span className="text-ticker-muted text-sm">ETH/USDT</span>
            </div>
          </div>
          
          {/* Main price display */}
          <div 
            ref={priceRef}
            className={`text-right ${flashClass} rounded px-3 py-1 transition-colors`}
          >
            <div className="price-display text-4xl md:text-5xl font-bold text-white">
              ${price ? formatPrice(price) : '—'}
            </div>
            <div className={`price-display text-lg ${changeColor} mt-1`}>
              {formatPercent(priceChangePercent)} ({priceChange >= 0 ? '+' : ''}${formatPrice(priceChange)})
            </div>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-ticker-border">
          <StatItem 
            label="24h Volume" 
            value={formatVolume(quoteVolume24h)} 
          />
          <StatItem 
            label="24h High" 
            value={`$${formatPrice(high24h)}`}
            valueClass="text-ticker-green" 
          />
          <StatItem 
            label="24h Low" 
            value={`$${formatPrice(low24h)}`}
            valueClass="text-ticker-red" 
          />
          <StatItem 
            label="Status" 
            value={status === 'connected' ? '● Live' : '○ Connecting...'}
            valueClass={status === 'connected' ? 'text-ticker-green' : 'text-yellow-500'} 
          />
        </div>
      </div>
    </header>
  )
}

function StatItem({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-ticker-muted text-xs uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`price-display text-sm md:text-base font-medium ${valueClass}`}>
        {value}
      </div>
    </div>
  )
}
