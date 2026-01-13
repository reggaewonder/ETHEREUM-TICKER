import { useEffect, useRef, useState } from 'react'
import { createChart, CrosshairMode } from 'lightweight-charts'
import { TimeframeSelector } from './TimeframeSelector'
import { useCandlesticks } from '../hooks/useCandlesticks'
import { formatPrice, formatVolume } from '../utils/formatters'

/**
 * Chart Component - TradingView Lightweight Charts integration
 * 
 * Features:
 * - Candlestick chart with proper OHLC data
 * - Volume histogram overlay
 * - Timeframe switching
 * - Crosshair with price/time display
 * - Auto-resize on container change
 * 
 * Why Lightweight Charts?
 * - Same tech as TradingView
 * - Tiny bundle size (~40kb)
 * - Excellent performance
 * - Free for any use
 */

// Chart color theme matching our dark UI
const CHART_COLORS = {
  background: '#131318',
  text: '#6b6b6b',
  grid: '#1e1e24',
  crosshair: '#4a4a52',
  upColor: '#00c853',
  downColor: '#ff1744',
  wickUp: '#00c853',
  wickDown: '#ff1744',
  volumeUp: 'rgba(0, 200, 83, 0.3)',
  volumeDown: 'rgba(255, 23, 68, 0.3)',
}

export function Chart({ currentPrice }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  
  const [timeframe, setTimeframe] = useState('1D')
  const [chartType, setChartType] = useState('candle') // 'candle' or 'line'
  const [crosshairData, setCrosshairData] = useState(null)
  
  const { candles, loading, error } = useCandlesticks(timeframe)

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2a32',
        },
        horzLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2a32',
        },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // Leave room for volume
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    })

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: CHART_COLORS.upColor,
      downColor: CHART_COLORS.downColor,
      wickUpColor: CHART_COLORS.wickUp,
      wickDownColor: CHART_COLORS.wickDown,
      borderVisible: false,
    })

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: CHART_COLORS.volumeUp,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay on main pane
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    })

    // Subscribe to crosshair move for tooltip data
    chart.subscribeCrosshairMove(param => {
      if (param.time) {
        const candleData = param.seriesData.get(candleSeries)
        const volumeData = param.seriesData.get(volumeSeries)
        if (candleData) {
          setCrosshairData({
            time: param.time,
            ...candleData,
            volume: volumeData?.value,
          })
        }
      } else {
        setCrosshairData(null)
      }
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Update data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles.length) return

    // Set candlestick data
    candleSeriesRef.current.setData(candles)

    // Set volume data with colors based on candle direction
    const volumeData = candles.map(candle => ({
      time: candle.time,
      value: candle.volume,
      color: candle.close >= candle.open 
        ? CHART_COLORS.volumeUp 
        : CHART_COLORS.volumeDown,
    }))
    volumeSeriesRef.current.setData(volumeData)

    // Fit content to view
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [candles])

  // Update last candle in real-time when currentPrice changes
  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length || !currentPrice) return

    const lastCandle = candles[candles.length - 1]
    if (!lastCandle) return

    // Update the last candle with current price
    candleSeriesRef.current.update({
      time: lastCandle.time,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, currentPrice),
      low: Math.min(lastCandle.low, currentPrice),
      close: currentPrice,
    })
  }, [currentPrice, candles])

  return (
    <div className="bg-ticker-card border border-ticker-border rounded-lg overflow-hidden">
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ticker-border">
        <div className="flex items-center gap-4">
          <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
          
          {/* Chart type toggle */}
          <div className="flex gap-1 bg-ticker-bg p-1 rounded-lg">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                chartType === 'candle' 
                  ? 'bg-ticker-card text-white' 
                  : 'text-ticker-muted hover:text-ticker-text'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                chartType === 'line' 
                  ? 'bg-ticker-card text-white' 
                  : 'text-ticker-muted hover:text-ticker-text'
              }`}
            >
              Line
            </button>
          </div>
        </div>

        {/* Crosshair data display */}
        {crosshairData && (
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <span className="text-ticker-muted">
              O: <span className="text-white">${formatPrice(crosshairData.open)}</span>
            </span>
            <span className="text-ticker-muted">
              H: <span className="text-ticker-green">${formatPrice(crosshairData.high)}</span>
            </span>
            <span className="text-ticker-muted">
              L: <span className="text-ticker-red">${formatPrice(crosshairData.low)}</span>
            </span>
            <span className="text-ticker-muted">
              C: <span className="text-white">${formatPrice(crosshairData.close)}</span>
            </span>
            {crosshairData.volume && (
              <span className="text-ticker-muted">
                Vol: <span className="text-white">{formatVolume(crosshairData.volume)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart container */}
      <div className="relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-ticker-card/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-ticker-muted">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading chart...
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-ticker-card/80 flex items-center justify-center z-10">
            <div className="text-center text-ticker-red">
              <div className="text-2xl mb-2">⚠️</div>
              <div>Failed to load chart data</div>
              <div className="text-xs text-ticker-muted mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* Actual chart */}
        <div 
          ref={containerRef} 
          className="w-full h-[400px]"
        />
      </div>
    </div>
  )
}
