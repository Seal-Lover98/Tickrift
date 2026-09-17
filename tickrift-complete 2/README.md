# Tickrift

A dark, browser-based **market simulation** for short-term paper trading and long-term paper investing.

## What is included

- Home page with clear simulation messaging and separate Day Trading / Long-Term Investing entry points.
- 30 stocks, 12 crypto assets, 9 indices, and 13 funds/ETFs.
- Search, watchlist, market categories, and source-status badges.
- Custom canvas charts that work without an external chart library.
- Candles, hollow candles, Heikin Ashi, OHLC bars, line, and area charts.
- 1m, 5m, 15m, 1h, 4h, 1D, and 1W intervals.
- Volume, SMA 20, SMA 50, EMA 20, VWAP, Bollinger Bands, RSI, and MACD.
- Custom bullish/bearish candle colors and three dark themes.
- Trade mode: long/short, market/limit/stop orders, simulated leverage, stop-loss, take-profit, trailing stop, slippage, fees, reserved margin, and auto-liquidation.
- Invest mode: buy/sell, market/limit orders, average cost, holdings, recurring paper buys, allocation, and portfolio P&L.
- Portfolio dashboard, equity curve, allocation chart, activity log, and local journal.
- First-run tutorial.
- Paper-account depletion flow: restart with $100,000 or a $10,000 challenge.
- Browser persistence using localStorage.
- Direct market-linked crypto prices/history through CoinGecko when the public endpoint is available.
- A production-style market-data bridge (`market-worker.js`) for stocks, ETFs, and indices through a licensed data provider.

## Run locally

Open `index.html`, or serve the folder with any static web server.

## GitHub Pages

The frontend (`index.html`, `styles.css`, `app.js`, `config.js`) is static and can be hosted on GitHub Pages.

The optional market-data bridge cannot run inside GitHub Pages because it needs server-side secrets. Deploy `market-worker.js` to an edge/serverless host and set `window.TICKRIFT_CONFIG.marketDataEndpoint` in `config.js` to that HTTPS URL.

## Data status

Tickrift never pretends demo data is live. Each selected instrument displays one of:

- `MARKET` — provider-linked market data.
- `DELAYED` — provider-linked but delayed market data.
- `SIMULATED` — generated practice data.

Crypto can use CoinGecko directly when available. Stocks, ETFs, and indices stay simulated until the licensed backend is connected.

## Important market-data note

A working API key is not bundled in this project. Public display rights for stock/exchange data depend on the provider plan and exchange licensing. Do not put a paid API key into `app.js` or `config.js` because visitors can read it.

If the person publishing this project is below a data provider's minimum account age, an eligible parent/guardian or adult organization must handle the provider account/contract. Do not create an account in violation of a provider's terms.

See `LIVE_DATA.md` for the backend contract and deployment flow.
