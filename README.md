# EthTicker 📊

A clean, real-time Ethereum price dashboard inspired by [bitcointicker.co](https://bitcointicker.co).

## ✨ Features

- **Live ETH Price** — Real-time updates via Binance WebSocket (~100ms)
- **24h Statistics** — Volume, high/low, percentage change
- **Interactive Charts** — TradingView Lightweight Charts with 5 timeframes
- **Order Book** — Live bid/ask depth with spread indicator
- **News Feed** — Curated ETH news from CryptoCompare

## 🚀 Quick Start

```bash
# Clone/download the project
cd ethticker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 18 + Vite | Fast builds, great DX |
| Styling | Tailwind CSS | Rapid dark theme development |
| Charts | Lightweight Charts | TradingView quality, tiny bundle |
| Data | Binance WebSocket | Free, real-time, reliable |
| News | CryptoCompare API | Free tier, no auth needed |

## 📁 Project Structure

```
ethticker/
├── src/
│   ├── components/
│   │   ├── PriceHeader.jsx    # Hero price display
│   │   ├── Chart.jsx          # Candlestick charts
│   │   ├── OrderBook.jsx      # Bid/ask depth
│   │   ├── NewsFeed.jsx       # News headlines
│   │   └── TimeframeSelector.jsx
│   ├── hooks/
│   │   ├── useBinancePrice.js     # Price WebSocket
│   │   ├── useBinanceOrderBook.js # Order book WebSocket
│   │   ├── useCandlesticks.js     # Chart data REST
│   │   └── useNews.js             # News fetching
│   ├── utils/
│   │   └── formatters.js      # Number formatting
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── eth-icon.svg
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🌐 Data Sources

| Data | Source | Auth Required | Update Frequency |
|------|--------|---------------|------------------|
| Price | Binance WebSocket | No | ~100ms |
| Charts | Binance REST API | No | On demand |
| Order Book | Binance WebSocket | No | 100ms |
| News | CryptoCompare API | No | 60s |

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Deploy (auto-configured for Vite)

### Netlify

```bash
npm run build
# Upload `dist` folder to Netlify
```

### Manual / Any Static Host

```bash
npm run build
# Serve the `dist` folder with any static server
npx serve dist
```

## ⚙️ Configuration

### Environment Variables

None required! All APIs used are free and public.

### Customization

**Change trading pair:**
Edit the WebSocket URLs in hooks (e.g., `ethusdt` → `btcusdt`)

**Adjust update frequency:**
Modify intervals in hook files

**Theming:**
Colors defined in `tailwind.config.js` under `theme.extend.colors`

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 📄 License

MIT — use it however you want.

---

Built with 💜 by a vibe coder
