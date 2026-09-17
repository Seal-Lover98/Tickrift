# Tickrift market-data setup

## Default behavior

`config.js` points the frontend to the same-origin endpoint:

```js
marketDataEndpoint: "/api/market"
```

The Cloudflare Pages Functions in `functions/api/market/` proxy the minimum price/candle data the simulator needs. If the backend has no API key, is rate-limited, or does not return an instrument, the frontend keeps that instrument in clearly labelled `SIMULATED` mode.

## Server-side secret

Configure in Cloudflare Pages:

- `TWELVE_DATA_API_KEY` — encrypted secret
- `MARKET_DATA_MODE` — `live` or `delayed`

The API key must never be committed to GitHub or placed in `config.js` / `app.js`.

## Frontend contract

### `GET /api/market/snapshot?symbols=AAPL,MSFT,BTC`

Returns:

```json
{
  "source": "Twelve Data",
  "delayed": false,
  "quotes": {
    "AAPL": {
      "price": 250.12,
      "open": 248.7,
      "high": 251.2,
      "low": 247.8,
      "volume": 1234567,
      "percentChange": 0.72,
      "timestamp": 1780000000000,
      "delayed": false,
      "source": "Twelve Data",
      "marketOpen": true
    }
  }
}
```

### `GET /api/market/history?symbol=AAPL&interval=5min&limit=320`

Returns ordered OHLCV candles:

```json
{
  "source": "Twelve Data",
  "delayed": false,
  "candles": [
    {
      "time": 1780000000000,
      "open": 249.8,
      "high": 250.3,
      "low": 249.6,
      "close": 250.12,
      "volume": 123456
    }
  ]
}
```

## Data rights matter

A functioning API is not automatically permission to publish every exchange feed commercially. Before monetization, verify that the provider plan and any exchange entitlements cover public display/redistribution for the exact markets used by Tickrift.

The UI exposes the resulting state as `MARKET`, `DELAYED`, or `SIMULATED` so the site does not overstate data freshness.
