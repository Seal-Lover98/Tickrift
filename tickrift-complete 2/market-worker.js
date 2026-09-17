/**
 * Tickrift market-data bridge — Cloudflare Worker example.
 *
 * Required secret/environment:
 *   MARKET_DATA_KEY       API key for a licensed Twelve Data account
 * Optional:
 *   MARKET_DATA_MODE      "live" or "delayed" (default: "live")
 *
 * IMPORTANT: This code is only a transport layer. Your data-provider plan and
 * exchange licences must allow public display for the markets you publish.
 * Keep the key in the Worker secret store, never in GitHub Pages JavaScript.
 */

const API = 'https://api.twelvedata.com';
const CRYPTO = new Set(['BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','LINK','DOT','LTC','BCH']);
const SYMBOL_MAP = {
  SPX:'SPX', NDX:'NDX', DJI:'DJI', RUT:'RUT', AEX:'AEX', DAX:'DAX', FTSE:'FTSE', N225:'N225', STOXX50E:'STOXX50E',
  VWRL:'VWRL', VWCE:'VWCE', CSPX:'CSPX'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null,{status:204}));
    if (!env.MARKET_DATA_KEY) return json({error:'MARKET_DATA_KEY is not configured'},500);
    try {
      if (url.pathname === '/snapshot') return cors(await snapshot(url, env));
      if (url.pathname === '/history') return cors(await history(url, env));
      if (url.pathname === '/health') return json({ok:true,source:'Twelve Data bridge'});
      return json({error:'Not found'},404);
    } catch (err) {
      return json({error:'Market-data request failed',detail:String(err?.message||err)},502);
    }
  }
};

async function snapshot(url, env) {
  const requested=(url.searchParams.get('symbols')||'').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean).slice(0,20);
  if (!requested.length) return json({quotes:{},source:'Twelve Data'});
  const delayed=(env.MARKET_DATA_MODE||'live').toLowerCase()==='delayed';
  const pairs=await Promise.all(requested.map(async ui=>{
    const provider=providerSymbol(ui);
    const upstream=new URL(API+'/quote');
    upstream.searchParams.set('symbol',provider);
    upstream.searchParams.set('apikey',env.MARKET_DATA_KEY);
    const r=await fetch(upstream.toString(),{cf:{cacheTtl:8,cacheEverything:true}});
    const q=await r.json();
    if (!r.ok || q.status==='error' || q.code) return [ui,null];
    const px=Number(q.close ?? q.price ?? q.last);
    if (!Number.isFinite(px) || px<=0) return [ui,null];
    return [ui,{
      price:px,
      open:numberOrNull(q.open),
      high:numberOrNull(q.high),
      low:numberOrNull(q.low),
      volume:numberOrZero(q.volume),
      percentChange:numberOrNull(q.percent_change),
      timestamp:normalizeTimestamp(q.timestamp,q.datetime),
      delayed,
      source:'Twelve Data'
    }];
  }));
  return json({quotes:Object.fromEntries(pairs.filter(([,q])=>q)),source:'Twelve Data',delayed});
}

async function history(url, env) {
  const ui=(url.searchParams.get('symbol')||'').trim().toUpperCase();
  const interval=(url.searchParams.get('interval')||'5min').trim();
  const limit=Math.min(500,Math.max(20,Number(url.searchParams.get('limit')||320)));
  if (!ui) return json({error:'symbol is required'},400);
  const upstream=new URL(API+'/time_series');
  upstream.searchParams.set('symbol',providerSymbol(ui));
  upstream.searchParams.set('interval',interval);
  upstream.searchParams.set('outputsize',String(limit));
  upstream.searchParams.set('order','ASC');
  upstream.searchParams.set('timezone','UTC');
  upstream.searchParams.set('apikey',env.MARKET_DATA_KEY);
  const r=await fetch(upstream.toString(),{cf:{cacheTtl:20,cacheEverything:true}});
  const data=await r.json();
  if (!r.ok || data.status==='error' || !Array.isArray(data.values)) return json({error:data.message||'No history returned'},502);
  const candles=data.values.map(v=>({
    time:Date.parse(String(v.datetime).replace(' ','T')+'Z'),
    open:Number(v.open),high:Number(v.high),low:Number(v.low),close:Number(v.close),volume:numberOrZero(v.volume)
  })).filter(v=>[v.time,v.open,v.high,v.low,v.close].every(Number.isFinite));
  const delayed=(env.MARKET_DATA_MODE||'live').toLowerCase()==='delayed';
  return json({candles,source:'Twelve Data',delayed});
}

function providerSymbol(ui){
  if (CRYPTO.has(ui)) return `${ui}/USD`;
  return SYMBOL_MAP[ui] || ui;
}
function numberOrNull(v){const n=Number(v);return Number.isFinite(n)?n:null}
function numberOrZero(v){const n=Number(v);return Number.isFinite(n)?n:0}
function normalizeTimestamp(ts,dt){
  const n=Number(ts);if(Number.isFinite(n)&&n>0)return n>1e12?n:n*1000;
  const p=Date.parse(dt);return Number.isFinite(p)?p:Date.now();
}
function cors(res){const h=new Headers(res.headers);h.set('Access-Control-Allow-Origin','*');h.set('Access-Control-Allow-Methods','GET,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type');h.set('Cache-Control','no-store');return new Response(res.body,{status:res.status,headers:h})}
function json(data,status=200){return cors(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json;charset=UTF-8'}}))}
