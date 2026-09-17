# Tickrift live / market-linked data

## What works immediately

The frontend contains a direct CoinGecko adapter for crypto. When CoinGecko responds successfully, the selected crypto asset is labelled `MARKET`, the current price is updated from CoinGecko, and Tickrift builds chart candles from CoinGecko historical price points.

If that request fails or is rate-limited, the instrument remains clearly labelled `SIMULATED`.

## Stocks, ETFs, and indices

For public stock/exchange data, use a licensed backend. `market-worker.js` is a ready-made Cloudflare Worker example using Twelve Data as the upstream provider.

The flow is:

```
GitHub Pages / static frontend
        ↓
Tickrift market-data bridge
        ↓
Licensed market-data provider
```

The API key stays in the backend environment, never in the browser.

## Frontend configuration

After deploying the worker, edit `config.js`:

```js
window.TICKRIFT_CONFIG = {
  marketDataEndpoint: "https://YOUR-WORKER.example.workers.dev",
  directCrypto: true,
  cryptoAttribution: true
};
```

## Backend contract

Tickrift uses two endpoints.

### `GET /snapshot?symbols=AAPL,MSFT,SPX`

Expected response:

```json
{
  "source": "Market provider",
  "quotes": {
    "AAPL": {
      "price": 250.12,
      "volume": 1234567,
      "timestamp": 1780000000000,
      "delayed": false,
      "source": "Market provider"
    }
  }
}
```

### `GET /history?symbol=AAPL&interval=5min&limit=320`

Expected response:

```json
{
  "source": "Market provider",
  "delayed": false,
  "candles": [
    {
      "time": 1780000000000,
      "open": 249.80,
      "high": 250.30,
      "low": 249.60,
      "close": 250.12,
      "volume": 123456
    }
  ]
}
```

## Cloudflare Worker setup

`market-worker.js` expects:

- secret: `MARKET_DATA_KEY`
- optional variable: `MARKET_DATA_MODE=live` or `MARKET_DATA_MODE=delayed`

The mode variable exists so the frontend does not falsely call delayed data live. Set it to match the rights/data you actually receive.

## Licensing

The code does not grant market-data display or redistribution rights. Before monetizing the site, check the current provider and exchange terms for public/commercial display. If required, use the provider's business/public-display plan and the necessary exchange licences.

CoinGecko attribution is already shown in Tickrift when the direct crypto feed is active. Verify the current CoinGecko terms for the plan/use case before launching a monetized version.
