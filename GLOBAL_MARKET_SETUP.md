# Shared market setup

## Is a market that is the same for every visitor possible?

Yes. Tickrift v3 does this in two layers:

1. **Clock-synced base market** — the synthetic price is a deterministic function of the instrument and UTC time. The market therefore continues while no browser is open and does not restart when a user returns.
2. **Optional shared order-flow layer** — Cloudflare D1 stores one small temporary impact value per instrument. When paper orders fill, the API updates this value. Every visitor fetching the same value sees the same crowd effect.

Without the D1 layer, users still share the same time-based base market, but one user's order cannot affect another user's browser. A shared writeable backend is required for that part.

## Cloudflare D1 steps

Create a D1 database and execute `schema.sql`.

Bind it to the Pages project as:

`MARKET_DB`

Then redeploy.

The browser calls:

- `GET /api/market?symbols=NVDA,BTC,...` for server time and current global impact
- `POST /api/market` after a virtual order actually fills

## Why this keeps moving offline

The database does not need to run a timer. The base price is calculated from the current timestamp. If the last visit was Monday and the next visit is Friday, Friday's price is calculated directly from Friday's time.

The stored player impact also decays mathematically based on the time since its last update. It therefore fades while nobody is on the site without needing a background cron job.
