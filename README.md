# Tickrift — Production Beta

Tickrift is a dark browser-based **paper trading and long-term investing simulator**. It uses virtual money only: no deposits, withdrawals, brokerage connection or real order execution.

## Launch build highlights

- One-screen desktop terminal: chart, open trades and close buttons remain visible together.
- Separate **Trade** and **Invest** modes.
- 50+ stocks plus crypto, global indices and ETFs/funds.
- Candles, hollow candles, Heikin Ashi, OHLC bars, line and area charts.
- 1m, 5m, 15m, 1h, 4h, 1D and 1W intervals.
- Volume, SMA 20/50, EMA 20, VWAP, Bollinger Bands, RSI and MACD.
- Custom candle colours, themes, grid/crosshair settings and zoom.
- Long/short paper trades, market/limit/stop orders, simulated leverage, stop-loss, take-profit, trailing stop, fees and slippage.
- Long-term holdings, average cost, allocation, recurring paper buys and portfolio P&L.
- Open positions/orders dock, portfolio dashboard, journal and first-run tutorial.
- Paper-account reset flow when buying power is exhausted.
- Search Console verification meta tag included.
- SEO landing content, crawlable learning pages, dynamic canonical URLs, robots.txt and sitemap.xml on Cloudflare Pages.
- Privacy/Terms/Data Sources pages.
- No Google Analytics or advertising trackers in this release.
- Same-origin market-data API bridge for licensed provider data. API keys never appear in browser JavaScript.

## Recommended production hosting

Keep the repository on GitHub, but deploy the website from that repository with **Cloudflare Pages**. The included `/functions` directory is a Cloudflare Pages Functions backend and handles:

- `/api/market/snapshot`
- `/api/market/history`
- dynamic `/robots.txt`
- dynamic `/sitemap.xml`
- canonical URL injection and basic security headers

No build command is required for this static project. Use the repository root as the output directory.

## Enable provider-linked market data

The site works immediately in clearly labelled `SIMULATED` mode. To enable provider-linked data, add these Cloudflare Pages environment values:

- Secret: `TWELVE_DATA_API_KEY`
- Variable: `MARKET_DATA_MODE` = `live` or `delayed`

Use a provider plan and exchange/data entitlements that permit your intended public/commercial display. The repository deliberately contains **no API key**.

If the market API is unavailable or a symbol is not returned, Tickrift leaves that instrument as `SIMULATED` rather than presenting generated prices as live.

See `LIVE_DATA.md` for details.

## SEO/Search Console

The Google Search Console verification tag supplied for this project is already in the homepage and content pages. On Cloudflare Pages, `/sitemap.xml` automatically uses the deployed domain, so there is no hard-coded placeholder domain to fix.

Useful indexable pages:

- `/`
- `/learn/paper-trading/`
- `/learn/long-term-investing/`
- `/data-sources/`
- `/privacy/`
- `/terms/`

After the production domain is live, submit `https://YOUR-DOMAIN/sitemap.xml` in Search Console and use URL Inspection on the homepage.

## Local testing

Serve the directory over HTTP rather than opening the file directly:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`. The Cloudflare Functions do not run in a basic local static server, so market prices will correctly remain simulated.

## Important product boundary

Tickrift is a simulator. Virtual balances and simulated profit/loss have no monetary value. It is not a brokerage or personalized investment-advice service.
