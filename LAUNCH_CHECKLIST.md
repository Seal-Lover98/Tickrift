# Tickrift launch checklist

## 1. Repository
- Create a new GitHub repository and put the contents of this folder at the repository root.
- Do **not** commit `.env`, `.dev.vars`, API keys, or provider credentials.
- Keep the repository private until you are comfortable with the public source code, or public if you intentionally want it open source.

## 2. Production hosting
Use Cloudflare Pages (recommended for this build) rather than GitHub Pages for the commercial/public app.

- Connect the GitHub repository to Cloudflare Pages.
- Framework preset: none / static HTML.
- Build command: none.
- Output directory: repository root.
- The `functions/` directory is detected by Pages Functions and serves `/api/market/*` plus SEO/security middleware.

## 3. Market-data secret
In Cloudflare Pages settings, add:

- `TWELVE_DATA_API_KEY` as a secret.
- `MARKET_DATA_MODE` as `live` only when the provider/data licence actually permits the feed you are displaying. Otherwise use `delayed`.

Tickrift deliberately falls back to **SIMULATED** when the provider is missing or unavailable. Do not change the badge to MARKET unless the returned feed really is provider-linked.

Before monetising or broadly distributing the site, confirm that the chosen market-data plan permits public/commercial display for every exchange/data set you expose.

## 4. Domain
- Add a custom domain in Cloudflare Pages when you have one.
- Enable HTTPS (Cloudflare does this automatically for Pages/custom domains once DNS is configured).
- Test `/`, `/learn/paper-trading/`, `/privacy/`, `/terms/`, `/data-sources/`, `/robots.txt`, and `/sitemap.xml` on the final domain.

The included middleware generates canonical URLs, Open Graph URLs, `robots.txt`, and `sitemap.xml` from the deployed hostname, so no domain string needs to be hard-coded first.

## 5. Google Search Console
The supplied Google verification meta tag is already installed.

After the final domain is live:
- Verify the property in Google Search Console.
- Submit `https://YOUR-DOMAIN/sitemap.xml`.
- Use URL Inspection on the homepage and the two Learn pages.
- Request indexing after checking that Google can fetch the pages.

Search visibility takes time. Technical SEO makes pages eligible and understandable; it cannot guarantee a particular ranking.

## 6. Pre-launch QA
Test on desktop and mobile:
- Home → Day Trading and Home → Investing.
- Search/filter all four market categories.
- Change timeframe, chart type, indicators and candle colours.
- Open long and short paper trades; close them from the always-visible bottom activity dock on desktop.
- Place/cancel limit and stop orders.
- Use stop-loss, take-profit and trailing stop.
- Buy/sell long-term paper holdings.
- Confirm indices and non-USD instruments are view-only where the simulator cannot account for them correctly.
- Confirm MARKET / DELAYED / SIMULATED labels match the actual feed.
- Disconnect/fail the market API and confirm the interface safely remains SIMULATED.
- Test account depletion and both restart options.
- Test tutorial, settings, Portfolio, Journal, Privacy, Terms, Learn, and Data Sources.
- Refresh the page and verify local state persists.

## 7. Privacy and monetisation
The launch build includes no analytics or ad trackers. Simulator data stays in the browser except for ordinary market-data requests.

If accounts, payments, ads, analytics, email capture or third-party marketing tools are added later, update the privacy/terms pages and implement whatever consent/compliance flow those features require **before** enabling them.
