# Tickrift v4 stability QA

- Homepage navigation is implemented as in-app views for Home, Simulator, Portfolio, Leaderboard and Learn.
- Learn also has a real `/learn/` SEO page plus four topic guides.
- Homepage has a deterministic NVDA candlestick preview that is redrawn after load and resize.
- Leaderboard has an anonymous player ID, editable nickname, global D1-backed rankings, refresh, current rank, and current paper-equity display.
- Leaderboard API validates nickname/player ID/equity, removes stale rows, and returns top 50 players.
- Shared market API remains `/api/market` and uses D1 binding `MARKET_DB`.
- P&L in open positions and holdings shows money and percentage.
- Stop-loss / take-profit summaries remain visible on open trade rows.
- Chart background remains user-selectable and candle colors remain configurable.
- Search Console verification meta tag remains present.
- Google Analytics remains consent-gated through `analytics.js`.
- Homepage and content pages retain titles, descriptions, canonical URLs, robots directives, internal links and structured data.
- Sitemap includes `/learn/`; robots points to the generated sitemap.
- Synthetic market data remains clearly labelled; no real brokerage execution exists.
- Node syntax checks pass for homepage JavaScript and all Cloudflare Function scripts.
- Static DOM ID-reference check passes with no missing IDs or duplicate IDs.

Leaderboard note: the simulator account lives in the visitor's browser, so leaderboard equity is client-reported and therefore suitable as a fun game feature rather than an audited competition.
