import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

// ============================================
// EthTicker - Complete ETH Dashboard
// Live Price | Charts | Order Book | News
// ============================================

// === FORMATTERS ===
function formatPrice(price, decimals = 2) {
  if (!price) return '—';
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPercent(pct) {
  if (pct === null || pct === undefined) return '—';
  const num = parseFloat(pct);
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

function formatVolume(vol) {
  if (!vol) return '—';
  const num = parseFloat(vol);
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(2)}`;
}

function formatQuantity(qty, decimals = 4) {
  if (!qty) return '—';
  const num = parseFloat(qty);
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(decimals);
}

function formatRelativeTime(date) {
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

// === HOOKS ===

// Live price WebSocket
function useBinancePrice() {
  const [data, setData] = useState({
    price: null, priceChange: null, priceChangePercent: null,
    high24h: null, low24h: null, quoteVolume24h: null, prevPrice: null,
  });
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    setStatus('connecting');
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@ticker');
    ws.onopen = () => { setStatus('connected'); reconnectAttempts.current = 0; };
    ws.onmessage = (event) => {
      const t = JSON.parse(event.data);
      setData(prev => ({
        price: parseFloat(t.c), priceChange: parseFloat(t.p),
        priceChangePercent: parseFloat(t.P), high24h: parseFloat(t.h),
        low24h: parseFloat(t.l), quoteVolume24h: parseFloat(t.q),
        prevPrice: prev.price,
      }));
    };
    ws.onerror = () => setStatus('error');
    ws.onclose = () => {
      setStatus('connecting');
      setTimeout(connect, Math.min(1000 * Math.pow(2, reconnectAttempts.current++), 30000));
    };
    wsRef.current = ws;
  }, []);

  useEffect(() => { connect(); return () => wsRef.current?.close(); }, [connect]);
  return { ...data, status };
}

// Candlestick data
const TF_CONFIG = {
  '1H': { interval: '1m', limit: 60 }, '4H': { interval: '5m', limit: 48 },
  '1D': { interval: '15m', limit: 96 }, '1W': { interval: '1h', limit: 168 },
  '1M': { interval: '1d', limit: 30 },
};

function useCandlesticks(tf = '1D') {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const c = TF_CONFIG[tf];
    if (!c) return;
    setLoading(true);
    fetch(`https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=${c.interval}&limit=${c.limit}`)
      .then(r => r.json())
      .then(d => {
        setCandles(d.map(x => ({
          time: Math.floor(x[0] / 1000), open: +x[1], high: +x[2], low: +x[3], close: +x[4], volume: +x[5],
        })));
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tf]);

  return { candles, loading, error };
}

// Order book WebSocket
function useBinanceOrderBook(levels = 10) {
  const [ob, setOb] = useState({ bids: [], asks: [] });
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef(null);
  const ra = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    setStatus('connecting');
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@depth20@100ms');
    ws.onopen = () => { setStatus('connected'); ra.current = 0; };
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      const bids = d.bids.slice(0, levels).map(([p, q]) => ({ price: +p, quantity: +q, total: +p * +q }));
      const asks = d.asks.slice(0, levels).map(([p, q]) => ({ price: +p, quantity: +q, total: +p * +q }));
      let bc = 0, ac = 0;
      bids.forEach(b => { bc += b.quantity; b.cum = bc; });
      asks.forEach(a => { ac += a.quantity; a.cum = ac; });
      const max = Math.max(bc, ac);
      setOb({
        bids: bids.map(b => ({ ...b, pct: (b.cum / max) * 100 })),
        asks: asks.map(a => ({ ...a, pct: (a.cum / max) * 100 })),
      });
    };
    ws.onerror = () => setStatus('error');
    ws.onclose = () => { setStatus('connecting'); setTimeout(connect, Math.min(1000 * Math.pow(2, ra.current++), 30000)); };
    wsRef.current = ws;
  }, [levels]);

  useEffect(() => { connect(); return () => wsRef.current?.close(); }, [connect]);
  const spread = ob.bids[0] && ob.asks[0] ? {
    value: ob.asks[0].price - ob.bids[0].price,
    pct: ((ob.asks[0].price - ob.bids[0].price) / ob.asks[0].price) * 100,
  } : null;
  return { ...ob, spread, status };
}

// News hook
function useNews(interval = 60000) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch('https://min-api.cryptocompare.com/data/v2/news/?categories=ETH&excludeCategories=Sponsored');
      const d = await r.json();
      if (d.Data) {
        setNews(d.Data.slice(0, 12).map(x => ({
          id: x.id, title: x.title, url: x.url,
          source: x.source_info?.name || x.source,
          time: new Date(x.published_on * 1000),
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); const i = setInterval(fetch_, interval); return () => clearInterval(i); }, [fetch_, interval]);
  return { news, loading, refetch: fetch_ };
}

// === COMPONENTS ===

function StatItem({ label, value, cls = 'text-white' }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-mono text-sm font-medium ${cls}`}>{value}</div>
    </div>
  );
}

function PriceHeader({ price, prevPrice, priceChange, priceChangePercent, high24h, low24h, quoteVolume24h, status }) {
  const [flash, setFlash] = useState('');
  useEffect(() => {
    if (price && prevPrice && price !== prevPrice) {
      setFlash(price > prevPrice ? 'bg-green-500/20' : 'bg-red-500/20');
      const t = setTimeout(() => setFlash(''), 500);
      return () => clearTimeout(t);
    }
  }, [price, prevPrice]);

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
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
              <span className="text-gray-500 text-sm">ETH/USDT</span>
            </div>
          </div>
          <div className={`text-right rounded px-3 py-1 transition-colors duration-500 ${flash}`}>
            <div className="font-mono text-4xl font-bold text-white">${formatPrice(price)}</div>
            <div className={`font-mono text-lg mt-1 ${priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercent(priceChangePercent)} ({priceChange >= 0 ? '+' : ''}${formatPrice(Math.abs(priceChange))})
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800">
          <StatItem label="24h Volume" value={formatVolume(quoteVolume24h)} />
          <StatItem label="24h High" value={`$${formatPrice(high24h)}`} cls="text-green-500" />
          <StatItem label="24h Low" value={`$${formatPrice(low24h)}`} cls="text-red-500" />
          <StatItem label="Status" value={status === 'connected' ? '● Live' : '○ ...'} cls={status === 'connected' ? 'text-green-500' : 'text-yellow-500'} />
        </div>
      </div>
    </header>
  );
}

function TimeframeSelector({ selected, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-950 p-1 rounded-lg">
      {['1H', '4H', '1D', '1W', '1M'].map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selected === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{t}</button>
      ))}
    </div>
  );
}

const COLORS = { bg: '#111114', text: '#6b6b6b', grid: '#1e1e24', up: '#00c853', down: '#ff1744', volUp: 'rgba(0,200,83,0.3)', volDown: 'rgba(255,23,68,0.3)' };

function Chart({ currentPrice }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const csRef = useRef(null);
  const vsRef = useRef(null);
  const [tf, setTf] = useState('1D');
  const [ch, setCh] = useState(null);
  const { candles, loading, error } = useCandlesticks(tf);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { color: COLORS.bg }, textColor: COLORS.text },
      grid: { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: COLORS.grid, scaleMargins: { top: 0.1, bottom: 0.2 } },
      timeScale: { borderColor: COLORS.grid, timeVisible: true },
    });
    const cs = chart.addCandlestickSeries({ upColor: COLORS.up, downColor: COLORS.down, wickUpColor: COLORS.up, wickDownColor: COLORS.down });
    const vs = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '', scaleMargins: { top: 0.85, bottom: 0 } });
    chart.subscribeCrosshairMove(p => { if (p.time) { const d = p.seriesData.get(cs); if (d) setCh(d); } else setCh(null); });
    chartRef.current = chart; csRef.current = cs; vsRef.current = vs;
    const resize = () => chart.applyOptions({ width: ref.current.clientWidth, height: ref.current.clientHeight });
    window.addEventListener('resize', resize); resize();
    return () => { window.removeEventListener('resize', resize); chart.remove(); };
  }, []);

  useEffect(() => {
    if (!csRef.current || !candles.length) return;
    csRef.current.setData(candles);
    vsRef.current.setData(candles.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? COLORS.volUp : COLORS.volDown })));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    if (!csRef.current || !candles.length || !currentPrice) return;
    const l = candles[candles.length - 1];
    csRef.current.update({ time: l.time, open: l.open, close: currentPrice, high: Math.max(l.high, currentPrice), low: Math.min(l.low, currentPrice) });
  }, [currentPrice, candles]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-wrap gap-2">
        <TimeframeSelector selected={tf} onChange={setTf} />
        {ch && <div className="hidden md:flex gap-4 text-xs font-mono">
          <span className="text-gray-500">O: <span className="text-white">${formatPrice(ch.open)}</span></span>
          <span className="text-gray-500">H: <span className="text-green-500">${formatPrice(ch.high)}</span></span>
          <span className="text-gray-500">L: <span className="text-red-500">${formatPrice(ch.low)}</span></span>
          <span className="text-gray-500">C: <span className="text-white">${formatPrice(ch.close)}</span></span>
        </div>}
      </div>
      <div className="relative">
        {loading && <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10 text-gray-500">Loading...</div>}
        {error && <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10 text-red-500">Error</div>}
        <div ref={ref} className="w-full h-72" />
      </div>
    </div>
  );
}

function OrderRow({ price, quantity, total, pct, type }) {
  const bid = type === 'bid';
  return (
    <div className="relative px-3 py-1 hover:bg-gray-800/30">
      <div className={`absolute inset-y-0 ${bid ? 'left-0 bg-green-500/10' : 'right-0 bg-red-500/10'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      <div className="relative grid grid-cols-3 gap-2 text-xs font-mono">
        <span className={bid ? 'text-green-500' : 'text-red-500'}>{formatPrice(price)}</span>
        <span className="text-right text-gray-300">{formatQuantity(quantity, 4)}</span>
        <span className="text-right text-gray-500">{formatQuantity(total, 2)}</span>
      </div>
    </div>
  );
}

function OrderBook() {
  const { bids, asks, spread, status } = useBinanceOrderBook(10);
  const rAsks = [...asks].reverse();
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Order Book</h3>
        <span className={`text-xs ${status === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>{status === 'connected' ? '● Live' : '○'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs text-gray-500 border-b border-gray-800">
        <span>Price</span><span className="text-right">Amount</span><span className="text-right">Total</span>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">{rAsks.map((a, i) => <OrderRow key={`a${i}`} {...a} type="ask" />)}</div>
        <div className="px-3 py-2 bg-gray-950 border-y border-gray-800 flex justify-between text-xs">
          <span className="text-gray-500">Spread</span>
          {spread ? <span className="font-mono text-gray-300">${formatPrice(spread.value)} <span className="text-gray-500">({spread.pct.toFixed(3)}%)</span></span> : <span>—</span>}
        </div>
        <div className="flex-1 overflow-y-auto">{bids.map((b, i) => <OrderRow key={`b${i}`} {...b} type="bid" />)}</div>
      </div>
    </div>
  );
}

function NewsCard({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-gray-950 hover:bg-gray-800/50 transition-colors group">
      <h4 className="text-sm text-gray-300 group-hover:text-white line-clamp-2 leading-snug">{item.title}</h4>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span className="truncate max-w-[100px]">{item.source}</span>
        <span>•</span>
        <span>{formatRelativeTime(item.time)}</span>
      </div>
    </a>
  );
}

function NewsFeed() {
  const { news, loading, refetch } = useNews();
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-300">Latest News</h3>
          <span className="text-xs text-gray-500">• ETH</span>
        </div>
        <button onClick={refetch} className="text-gray-500 hover:text-gray-300 transition-colors" title="Refresh">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        {loading && news.length === 0 ? (
          <div className="text-center py-6 text-gray-500">Loading news...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {news.slice(0, 6).map(n => <NewsCard key={n.id} item={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// === MAIN APP ===
export default function App() {
  const priceData = useBinancePrice();
  return (
    <div className="min-h-screen bg-gray-950">
      <PriceHeader {...priceData} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3"><Chart currentPrice={priceData.price} /></div>
          <div className="h-80 lg:h-96"><OrderBook /></div>
        </div>
        <div className="mt-4"><NewsFeed /></div>
      </main>
      <footer className="border-t border-gray-800 mt-8 py-4">
        <div className="text-center text-gray-500 text-sm">Data from Binance & CryptoCompare • Not financial advice • Built with 💜</div>
      </footer>
    </div>
  );
}
