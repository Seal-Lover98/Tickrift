# Tickrift v4 stability QA

Checks run on the release package:

- Node syntax validation: `app.js`, `analytics.js`, all Pages Functions — passed.
- CSS parsing with tinycss2 — 0 parse errors.
- Every explicit `$("id")` reference in `app.js` exists in the homepage HTML — passed.
- Homepage local asset-reference check — no missing local HTML/CSS/JS/image references.
- DOM smoke test with a browser-DOM mock — app boots without a startup exception; Open simulator, timeframe, and Trade/Invest mode click paths update state.
- Homepage bundles a copy of core CSS and core simulator JS, while keeping `styles.css`/`app.js` as maintainable source files.
- Hero chart uses an explicit NVDA candlestick canvas with a delayed/resize redraw path.
- Open positions show P&L amount and return percentage; risk summary shows configured SL/TP/trailing values.
- Chart background is independently configurable from bullish/bearish candle colors.
- SEO tags checked: title, description, robots, canonical, Search Console verification, Open Graph, WebSite/WebApplication structured data.
- Cloudflare Pages Functions remain under `/functions` at repository root.

Note: a full production-browser visual pass still needs to be performed against the live Pages URL after the GitHub deployment, because local headless browser navigation is restricted in the build environment used for this package.
