/**
 * Format price with appropriate decimal places
 * ETH typically shows 2 decimals for prices > $100
 */
export function formatPrice(price, decimals = 2) {
  if (price === null || price === undefined) return '—'
  
  const num = parseFloat(price)
  if (isNaN(num)) return '—'
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format percentage with + or - prefix
 */
export function formatPercent(percent) {
  if (percent === null || percent === undefined) return '—'
  
  const num = parseFloat(percent)
  if (isNaN(num)) return '—'
  
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

/**
 * Format large volumes (e.g., 1.2B, 450M)
 */
export function formatVolume(volume) {
  if (volume === null || volume === undefined) return '—'
  
  const num = parseFloat(volume)
  if (isNaN(num)) return '—'
  
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`
  } else if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`
  }
  return `$${num.toFixed(2)}`
}

/**
 * Format quantity (no $ prefix, for ETH amounts)
 */
export function formatQuantity(qty, decimals = 4) {
  if (qty === null || qty === undefined) return '—'
  
  const num = parseFloat(qty)
  if (isNaN(num)) return '—'
  
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`
  }
  return num.toFixed(decimals)
}

/**
 * Format timestamp to readable time
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
