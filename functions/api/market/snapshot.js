const API = 'https://api.twelvedata.com';
const MAX_SYMBOLS = 20;
const ALLOWED = new Set(['NVDA','AAPL','MSFT','AMZN','META','GOOGL','TSLA','AMD','ASML','JPM','NFLX','AVGO','ORCL','CRM','INTC','QCOM','PLTR','KO','DIS','NKE','BA','LLY','UNH','XOM','WMT','COST','V','MA','UBER','SHOP','PYPL','ABNB','COIN','SNOW','ADBE','IBM','GE','CAT','GS','BAC','PFE','JNJ','PEP','MCD','SBUX','F','GM','RIVN','ARM','MU','BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','LINK','DOT','LTC','BCH','SPX','NDX','DJI','RUT','AEX','DAX','FTSE','N225','STOXX50E','SPY','QQQ','VOO','VTI','IWM','DIA','GLD','SLV','TLT','BND','XLK','XLF','XLE','XLV','ARKK','VWRL','VWCE','CSPX']);
const INDEX_SYMBOLS = new Set(['SPX','NDX','DJI','RUT','AEX','DAX','FTSE','N225','STOXX50E']);

const CRYPTO = new Set(['BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','LINK','DOT','LTC','BCH']);
const SYMBOL_MAP = {
  // UI symbol -> upstream symbol when they differ. Exchange suffixes reduce ambiguity.
  VWRL:'VWRL:LSE', VWCE:'VWCE:XETR', CSPX:'CSPX:LSE',
  BTC:'BTC/USD', ETH:'ETH/USD', SOL:'SOL/USD', XRP:'XRP/USD', BNB:'BNB/USD', ADA:'ADA/USD',
  DOGE:'DOGE/USD', AVAX:'AVAX/USD', LINK:'LINK/USD', DOT:'DOT/USD', LTC:'LTC/USD', BCH:'BCH/USD'
};

export async function onRequestGet(context) {
  const key = context.env.TWELVE_DATA_API_KEY;
  if (!key) return json({ error: 'Market data is not configured.' }, 503);

  const url = new URL(context.request.url);
  const requested = [...new Set((url.searchParams.get('symbols') || '')
    .split(',').map(v => v.trim().toUpperCase()).filter(v => ALLOWED.has(v)))].slice(0, MAX_SYMBOLS);
  if (!requested.length) return json({ source: 'Twelve Data', quotes: {} });

  const cache = globalThis.caches?.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  if (cache) { const hit = await cache.match(cacheKey); if (hit) return hit; }

  const providers = requested.map(ui => providerSymbol(ui));
  const upstream = new URL(`${API}/quote`);
  upstream.searchParams.set('symbol', providers.join(','));
  upstream.searchParams.set('interval', '1day');

  const res = await fetch(upstream, {
    headers: { Authorization: `apikey ${key}`, Accept: 'application/json' },
    cf: { cacheEverything: true, cacheTtl: 12 }
  });
  const payload = await safeJson(res);
  if (!res.ok || payload?.status === 'error') {
    return json({ error: payload?.message || 'Upstream market-data request failed.' }, 502);
  }

  const delayed = String(context.env.MARKET_DATA_MODE || 'delayed').toLowerCase() !== 'live';
  const quotes = {};
  requested.forEach((ui, index) => {
    const provider = providers[index];
    const q = readBatchItem(payload, provider, requested.length === 1);
    if (!q || q.status === 'error') return;
    if (INDEX_SYMBOLS.has(ui) && /\b(etf|fund|trust)\b/i.test(String(q.name || ''))) return;
    const px = finite(q.close ?? q.price ?? q.last);
    if (!(px > 0)) return;
    quotes[ui] = {
      price: px,
      open: finiteOrNull(q.open),
      high: finiteOrNull(q.high),
      low: finiteOrNull(q.low),
      volume: finite(q.volume) || 0,
      percentChange: finiteOrNull(q.percent_change),
      high52: finiteOrNull(q.fifty_two_week?.high),
      low52: finiteOrNull(q.fifty_two_week?.low),
      timestamp: normalizeTimestamp(q.timestamp, q.datetime),
      delayed,
      source: 'Twelve Data',
      marketOpen: typeof q.is_market_open === 'boolean' ? q.is_market_open : null
    };
  });

  const response = json({ source: 'Twelve Data', delayed, quotes }, 200, 45);
  if (cache) context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function providerSymbol(ui) { return SYMBOL_MAP[ui] || ui; }
function readBatchItem(payload, provider, single) {
  if (single && payload && !payload[provider]) return payload;
  return payload?.[provider] || payload?.[provider.replace('/','') ] || null;
}
function finite(v) { const n = Number(v); return Number.isFinite(n) ? n : NaN; }
function finiteOrNull(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function normalizeTimestamp(ts, dt) {
  const n = Number(ts);
  if (Number.isFinite(n) && n > 0) return n > 1e12 ? n : n * 1000;
  const parsed = Date.parse(dt || '');
  return Number.isFinite(parsed) ? parsed : Date.now();
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
