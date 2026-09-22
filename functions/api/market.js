const ALLOWED = new Set([
  "NVDA","AAPL","MSFT","GOOGL","AMZN","META","TSLA","AVGO","AMD","INTC","NFLX","ORCL","CRM","ADBE","PLTR","ARM","TSM","ASML","QCOM","MU","JPM","BAC","GS","V","MA","BRK.B","WMT","COST","HD","MCD","KO","PEP","NKE","DIS","SBUX","LLY","UNH","JNJ","PFE","XOM","CVX","CAT","BA","GE","F","GM","RIVN","NVO","SAP","SONY","BABA",
  "BTC","ETH","SOL","XRP","BNB","ADA","AVAX","LINK","SUI","HYPE","TON","DOT",
  "DOGE","SHIB","PEPE","PUMP","PENGU","BONK","WIF","FLOKI","BRETT","BOME","MOG","TURBO",
  "SPX","NDX","DJI","RUT","AEX","DAX","FTSE","N225","STOXX50",
  "SPY","QQQ","VOO","VTI","VT","IWM","DIA","XLK","XLF","XLE","TLT","GLD","SLV","ARKK","EEM","IEFA","VWCE","VUG"
]);
const MEME = new Set(["DOGE","SHIB","PEPE","PUMP","PENGU","BONK","WIF","FLOKI","BRETT","BOME","MOG","TURBO"]);
const CRYPTO = new Set(["BTC","ETH","SOL","XRP","BNB","ADA","AVAX","LINK","SUI","HYPE","TON","DOT"]);
const DECAY_MS = 6 * 60 * 60 * 1000;

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}})}
function cleanSymbols(raw){return [...new Set(String(raw||"").split(",").map(x=>x.trim().toUpperCase()).filter(x=>ALLOWED.has(x)))].slice(0,150)}
function decayed(impact,updatedAt,now){const factor=Math.max(0,1-(Math.max(0,now-updatedAt)/DECAY_MS));return impact*factor}
function impactPerFullOrder(symbol){if(MEME.has(symbol))return 0.000010;if(CRYPTO.has(symbol))return 0.000004;return 0.0000025}

export async function onRequest(context){
  const {request,env}=context; const now=Date.now();
  if(request.method==="GET"){
    const url=new URL(request.url),symbols=cleanSymbols(url.searchParams.get("symbols"));
    if(!env.MARKET_DB) return json({serverTime:now,globalFlow:false,impacts:[],message:"D1 binding MARKET_DB is not configured."});
    try{
      if(!symbols.length) return json({serverTime:now,globalFlow:true,impacts:[]});
      const marks=symbols.map(()=>"?").join(",");
      const result=await env.MARKET_DB.prepare(`SELECT symbol, impact, updated_at, volume, trades FROM market_impact WHERE symbol IN (${marks})`).bind(...symbols).all();
      const impacts=(result.results||[]).map(r=>({symbol:r.symbol,impact:decayed(Number(r.impact)||0,Number(r.updated_at)||now,now),updatedAt:now,volume:Number(r.volume)||0,trades:Number(r.trades)||0}));
      return json({serverTime:now,globalFlow:true,impacts});
    }catch(err){return json({serverTime:now,globalFlow:false,impacts:[],error:"market database unavailable"},200)}
  }
  if(request.method==="POST"){
    if(!env.MARKET_DB) return json({ok:false,globalFlow:false,error:"D1 binding MARKET_DB is not configured."},503);
    let body; try{body=await request.json()}catch{return json({ok:false,error:"invalid json"},400)}
    const symbol=String(body.symbol||"").toUpperCase(),side=body.side==="sell"?"sell":"buy",notional=Math.max(0,Math.min(500000,Number(body.notional)||0)),orderId=String(body.orderId||"").slice(0,100);
    if(!ALLOWED.has(symbol)||notional<10||!orderId)return json({ok:false,error:"invalid order flow"},400);
    const direction=side==="buy"?1:-1; const scale=Math.min(1,notional/100000); const delta=direction*impactPerFullOrder(symbol)*scale;
    try{
      const exists=await env.MARKET_DB.prepare("SELECT 1 FROM processed_orders WHERE id = ?").bind(orderId).first();
      if(exists) return json({ok:true,duplicate:true});
      const insertOrder=env.MARKET_DB.prepare("INSERT INTO processed_orders (id, created_at) VALUES (?, ?)").bind(orderId,now);
      const upsert=env.MARKET_DB.prepare(`INSERT INTO market_impact(symbol,impact,updated_at,volume,trades) VALUES(?,?,?,?,1)
        ON CONFLICT(symbol) DO UPDATE SET
        impact=(market_impact.impact * CASE WHEN (? - market_impact.updated_at) >= ? THEN 0 ELSE 1 - ((? - market_impact.updated_at) * 1.0 / ?) END) + excluded.impact,
        updated_at=excluded.updated_at,
        volume=market_impact.volume + excluded.volume,
        trades=market_impact.trades + 1`).bind(symbol,delta,now,notional,now,DECAY_MS,now,DECAY_MS);
      const cleanup=env.MARKET_DB.prepare("DELETE FROM processed_orders WHERE created_at < ?").bind(now - 86400000);
      await env.MARKET_DB.batch([insertOrder,upsert,cleanup]);
      const row=await env.MARKET_DB.prepare("SELECT symbol,impact,updated_at,volume,trades FROM market_impact WHERE symbol=?").bind(symbol).first();
      const record={symbol,impact:decayed(Number(row.impact)||0,Number(row.updated_at)||now,now),updatedAt:now,volume:Number(row.volume)||0,trades:Number(row.trades)||0};
      return json({ok:true,globalFlow:true,record});
    }catch(err){return json({ok:false,error:"market flow write failed"},500)}
  }
  return json({error:"method not allowed"},405);
}
