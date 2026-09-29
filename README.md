# Tickrift v3 — shared simulated market

This build is a virtual-money market simulator. The homepage bundles its core CSS and simulator JavaScript so the main experience remains resilient if an auxiliary static asset is accidentally omitted. It does **not** place real orders and does not use real deposits or withdrawals.

## What changed

- One clock-synced synthetic market for every visitor instead of per-browser random prices.
- The market keeps moving while a visitor is away because prices are derived from UTC time.
- Optional global player-order flow using Cloudflare Pages Functions + D1. Paper buys/sells create deliberately tiny temporary pressure that decays over six hours.
- Working 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1D and 1W chart timeframes.
- Stocks, crypto, meme coins, indices and ETFs.
- Trade and Invest are order styles inside one simulator workspace rather than separate top-level products.
- Open trades remain visible directly below the chart on desktop so they can be closed without scrolling the page.
- Search Console verification tag included.
- Chart background can be changed independently from bullish/bearish candle colors.
- Optional Google Analytics (G-PK72BHMES7) is loaded only after analytics consent.
- Static SEO guide pages for paper trading, stock simulation, crypto simulation and meme-coin simulation.
- Dynamic `/sitemap.xml` and `/robots.txt` when deployed on Cloudflare Pages Functions.

## Deploy the basic site

Upload the contents of this folder to the root of the repository. `index.html` must be at repository root, not inside another folder.

The basic static site works without a database. Prices are still shared/clock-synced, assuming visitors' device clocks are reasonably accurate. The player-flow effect will show as unavailable until the backend is configured.

## Enable exact server clock + global player flow on Cloudflare Pages

1. Create a Cloudflare D1 database, for example `tickrift-market`.
2. Run the SQL in `schema.sql` against that database.
3. In the Pages project, add a D1 binding with variable name exactly `MARKET_DB`.
4. Redeploy the Pages project.
5. Open Tickrift. The header should change from `SHARED SIMULATION` to `GLOBAL FLOW ONLINE` after the API responds.

The API endpoint is `/api/market`.

## Global player impact model

A filled virtual order sends only:

- synthetic instrument symbol
- `buy` or `sell`
- paper notional, capped server-side
- a random idempotency ID

A full $100,000 paper order changes the global pressure by approximately:

- stocks / indices / ETFs: 0.00025%
- major crypto: 0.0004%
- meme coins: 0.001%

The pressure decays to zero over six hours. This means one visitor should barely move a price, while a large crowd leaning the same way can become visible.

This is a game mechanic, **not** an attempt to model real market impact.

## SEO

The Search Console verification meta tag is already in the homepage and content pages. On Cloudflare Pages, `/sitemap.xml` is created dynamically from the actual domain, so no hard-coded domain is required.

After launch:

1. Add the property in Google Search Console.
2. Submit `/sitemap.xml`.
3. Use URL Inspection on the homepage and the main learning pages.
4. Do not generate hundreds of thin keyword pages. Add genuinely useful pages instead.

## Important production notes

- The current market is synthetic. Do not describe it as live exchange data.
- If real market data is added later, review the provider's public/commercial display licence first.
- `privacy/` and `terms/` are launch templates. Before commercial use, add the actual operator/contact information and review the final legal setup.
- The player-flow API intentionally accepts only symbols that exist in Tickrift and caps paper notional.
- For a large public launch, add stronger abuse/rate controls to the shared-flow endpoint.
