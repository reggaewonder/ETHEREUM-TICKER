import { useCoinbasePrice } from './hooks/useCoinbasePrice'
import { PriceHeader } from './components/PriceHeader'
import { Chart } from './components/Chart'
import { OrderBook } from './components/OrderBook'
import { NewsFeed } from './components/NewsFeed'

/**
 * EthTicker - Main Application
 * 
 * Now powered by Coinbase - works in USA! 🇺🇸
 * 
 * Data sources:
 * - Price: Coinbase WebSocket (real-time)
 * - Order Book: Coinbase WebSocket (real-time)
 * - Charts: CoinGecko (reliable, works everywhere)
 * - News: CryptoCompare (works everywhere)
 */
function App() {
  // Real-time price data from Coinbase WebSocket
  const priceData = useCoinbasePrice()
  
  return (
    <div className="min-h-screen bg-ticker-bg">
      {/* Live price header */}
      <PriceHeader 
        price={priceData.price}
        prevPrice={priceData.prevPrice}
        priceChange={priceData.priceChange}
        priceChangePercent={priceData.priceChangePercent}
        high24h={priceData.high24h}
        low24h={priceData.low24h}
        volume24h={priceData.volume24h}
        status={priceData.status}
      />
      
      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Chart */}
          <div className="lg:col-span-3">
            <Chart currentPrice={priceData.price} />
          </div>
          
          {/* Order book */}
          <div className="h-[460px]">
            <OrderBook />
          </div>
        </div>
        
        {/* News Feed */}
        <div className="mt-4">
          <NewsFeed />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-ticker-border mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-ticker-muted text-sm">
          Data from Coinbase & CryptoCompare • Not financial advice • Built with 💜
        </div>
      </footer>
    </div>
  )
}

export default App
