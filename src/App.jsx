import { useBinancePrice } from './hooks/useBinancePrice'
import { PriceHeader } from './components/PriceHeader'
import { Chart } from './components/Chart'
import { OrderBook } from './components/OrderBook'
import { NewsFeed } from './components/NewsFeed'

/**
 * EthTicker - Main Application
 * 
 * Sprint 1: Live price header with real-time WebSocket updates
 * Sprint 2: Interactive candlestick charts with timeframe selection
 * Sprint 3: Real-time order book with depth visualization
 * Sprint 4: News feed + final polish
 * 
 * Architecture:
 * - Data fetching happens in custom hooks (keeps components clean)
 * - App.jsx orchestrates data flow to components
 * - Each component receives only the props it needs
 */
function App() {
  // Real-time price data from Binance WebSocket
  const priceData = useBinancePrice()
  
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
        quoteVolume24h={priceData.quoteVolume24h}
        status={priceData.status}
      />
      
      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Chart - Sprint 2 ✅ */}
          <div className="lg:col-span-3">
            <Chart currentPrice={priceData.price} />
          </div>
          
          {/* Order book - Sprint 3 ✅ */}
          <div className="h-[460px]">
            <OrderBook />
          </div>
        </div>
        
        {/* News Feed - Sprint 4 ✅ */}
        <div className="mt-4">
          <NewsFeed />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-ticker-border mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-ticker-muted text-sm">
          Data from Binance • Not financial advice • Built with 💜
        </div>
      </footer>
    </div>
  )
}

export default App
