# Tickrift v3 QA report

Checked on 2026-09-22.

## Automated browser checks

- Two independent browser pages at the same mocked UTC timestamp showed the exact same NVDA simulated price.
- Advancing the mocked clock by four hours produced a different price without needing a prior browser session.
- 1h, 2h, 4h, 1D and 1W each rendered a different chart canvas.
- A paper trade opened, reduced available paper cash, appeared in Open trades, and could be closed.
- Invest mode created a long-term holding.
- Meme category loaded 12 separate simulated meme-coin instruments.
- Desktop simulator viewport had no document-level vertical scroll; the open-trades panel stayed visible below the chart.
- Mobile layout had no horizontal overflow.
- No JavaScript page errors were observed in the mocked offline-backend test.

## Static checks

- `app.js` passes `node --check`.
- Cloudflare Functions pass `node --check`.
- No duplicate HTML IDs were found.
- All DOM IDs referenced through the app's `$()` helper exist in `index.html`.
- Local file references used by the homepage resolve inside the project.
- Search Console verification meta tag is present.

## Backend note

The global crowd effect cannot exist across visitors on a purely static GitHub Pages deployment. The same clock-synced base market works statically, but shared player impact needs the included Cloudflare Pages Function plus a D1 database binding named `MARKET_DB`.
