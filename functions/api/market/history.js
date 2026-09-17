const API = 'https://api.twelvedata.com';
const ALLOWED_INTERVALS = new Set(['1min','5min','15min','1h','4h','1day','1week']);
const ALLOWED = new Set(['NVDA','AAPL','MSFT','AMZN','META','GOOGL','TSLA','AMD','ASML','JPM','NFLX','AVGO','ORCL','CRM','INTC','QCOM','PLTR','KO','DIS','NKE','BA','LLY','UNH','XOM','WMT','COST','V','MA','UBER','SHOP','PYPL','ABNB','COIN','SNOW','ADBE','IBM','GE','CAT','GS','BAC','PFE','JNJ','PEP','MCD','SBUX','F','GM','RIVN','ARM','MU','BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','LINK','DOT','LTC','BCH','SPX','NDX','DJI','RUT','AEX','DAX','FTSE','N225','STOXX50E','SPY','QQQ','VOO','VTI','IWM','DIA','GLD','SLV','TLT','BND','XLK','XLF','XLE','XLV','ARKK','VWRL','VWCE','CSPX']);
const SYMBOL_MAP = {
  VWRL:'VWRL:LSE', VWCE:'VWCE:XETR', CSPX:'CSPX:LSE',
  BTC:'BTC/USD', ETH:'ETH/USD', SOL:'SOL/USD', XRP:'XRP/USD', BNB:'BNB/USD', ADA:'ADA/USD',
  DOGE:'DOGE/USD', AVAX:'AVAX/USD', LINK:'LINK/USD', DOT:'DOT/USD', LTC:'LTC/USD', BCH:'BCH/USD'
};

export async function onRequestGet(context) {
  const key = context.env.TWELVE_DATA_API_KEY;
  if (!key) return json({ error: 'Market data is not configured.' }, 503);

  const url = new URL(context.request.url);
  const ui = (url.searchParams.get('symbol') || '').trim().toUpperCase();
  const interval = url.searchParams.get('interval') || '5min';
  const limit = Math.max(20, Math.min(320, Number(url.searchParams.get('limit') || 240)));
  if (!ALLOWED.has(ui)) return json({ error: 'Unsupported symbol.' }, 400);
  if (!ALLOWED_INTERVALS.has(interval)) return json({ error: 'Invalid interval.' }, 400);

  const cache = globalThis.caches?.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  if (cache) { const hit = await cache.match(cacheKey); if (hit) return hit; }

  const upstream = new URL(`${API}/time_series`);
  upstream.searchParams.set('symbol', SYMBOL_MAP[ui] || ui);
  upstream.searchParams.set('interval', interval);
  upstream.searchParams.set('outputsize', String(limit));
  upstream.searchParams.set('order', 'ASC');
  upstream.searchParams.set('timezone', 'UTC');

  const res = await fetch(upstream, {
    headers: { Authorization: `apikey ${key}`, Accept: 'application/json' },
    cf: { cacheEverything: true, cacheTtl: interval === '1min' ? 20 : 60 }
  });
  const payload = await safeJson(res);
  if (!res.ok || payload?.status === 'error' || !Array.isArray(payload?.values)) {
    return json({ error: payload?.message || 'No history returned.' }, 502);
  }

  const candles = payload.values.map(v => ({
    time: parseTime(v.datetime),
    open: Number(v.open), high: Number(v.high), low: Number(v.low), close: Number(v.close),
    volume: Number.isFinite(Number(v.volume)) ? Number(v.volume) : 0
  })).filter(v => [v.time,v.open,v.high,v.low,v.close].every(Number.isFinite));

  const delayed = String(context.env.MARKET_DATA_MODE || 'delayed').toLowerCase() !== 'live';
  const ttl = interval === '1min' ? 45 : interval === '5min' ? 60 : 120;
  const response = json({ source: 'Twelve Data', delayed, candles }, 200, ttl);
  if (cache) context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function parseTime(value) {
  const raw = String(value || '');
  const isoish = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(isoish) ? isoish : `${isoish}Z`);
  return Number.isFinite(t) ? t : NaN;
}
async function safeJson(res) { try { return await res.json(); } catch { return null; } }
function json(data, status = 200, maxAge = 0) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge ? `public, max-age=${maxAge}, s-maxage=${maxAge}` : 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}
