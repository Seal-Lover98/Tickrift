(() => {
  "use strict";

  const CFG = Object.assign({
    globalMarketEndpoint: "/api/market",
    marketTickMs: 5000,
    startingCash: 100000
  }, window.TICKRIFT_CONFIG || {});

  const TF_MS = {"1m":60000,"5m":300000,"15m":900000,"30m":1800000,"1h":3600000,"2h":7200000,"4h":14400000,"1D":86400000,"1W":604800000};
  const TF_COUNT = {"1m":140,"5m":140,"15m":140,"30m":140,"1h":140,"2h":140,"4h":140,"1D":150,"1W":120};
  const FEE_RATE = 0.00045;
  const STORAGE_KEY = "tickrift_v3_state";
  const SETTINGS_KEY = "tickrift_v3_settings";
  const EPOCH = Date.UTC(2026,0,1,0,0,0);

  const A = (symbol,name,category,base,vol,exchange="SIM",currency="USD",drift=0.00012) => ({symbol,name,category,base,vol,exchange,currency,drift,seed:hash32(symbol)});
  const ASSETS = [
    A("NVDA","NVIDIA","stocks",185,0.030,"NASDAQ"),A("AAPL","Apple","stocks",245,0.018,"NASDAQ"),A("MSFT","Microsoft","stocks",515,0.016,"NASDAQ"),A("GOOGL","Alphabet","stocks",205,0.019,"NASDAQ"),A("AMZN","Amazon","stocks",230,0.022,"NASDAQ"),A("META","Meta Platforms","stocks",625,0.024,"NASDAQ"),A("TSLA","Tesla","stocks",390,0.038,"NASDAQ"),A("AVGO","Broadcom","stocks",350,0.027,"NASDAQ"),A("AMD","AMD","stocks",175,0.032,"NASDAQ"),A("INTC","Intel","stocks",42,0.031,"NASDAQ"),A("NFLX","Netflix","stocks",1250,0.027,"NASDAQ"),A("ORCL","Oracle","stocks",195,0.021,"NYSE"),A("CRM","Salesforce","stocks",310,0.025,"NYSE"),A("ADBE","Adobe","stocks",410,0.026,"NASDAQ"),A("PLTR","Palantir","stocks",155,0.041,"NASDAQ"),A("ARM","Arm Holdings","stocks",155,0.039,"NASDAQ"),A("TSM","TSMC ADR","stocks",245,0.025,"NYSE"),A("ASML","ASML ADR","stocks",1060,0.026,"NASDAQ"),A("QCOM","Qualcomm","stocks",185,0.025,"NASDAQ"),A("MU","Micron","stocks",185,0.035,"NASDAQ"),A("JPM","JPMorgan Chase","stocks",305,0.017,"NYSE"),A("BAC","Bank of America","stocks",55,0.019,"NYSE"),A("GS","Goldman Sachs","stocks",790,0.020,"NYSE"),A("V","Visa","stocks",365,0.015,"NYSE"),A("MA","Mastercard","stocks",590,0.015,"NYSE"),A("BRK.B","Berkshire Hathaway B","stocks",520,0.012,"NYSE"),A("WMT","Walmart","stocks",108,0.014,"NASDAQ"),A("COST","Costco","stocks",990,0.016,"NASDAQ"),A("HD","Home Depot","stocks",425,0.017,"NYSE"),A("MCD","McDonald's","stocks",315,0.014,"NYSE"),A("KO","Coca-Cola","stocks",73,0.011,"NYSE"),A("PEP","PepsiCo","stocks",160,0.013,"NASDAQ"),A("NKE","Nike","stocks",75,0.024,"NYSE"),A("DIS","Walt Disney","stocks",125,0.024,"NYSE"),A("SBUX","Starbucks","stocks",95,0.023,"NASDAQ"),A("LLY","Eli Lilly","stocks",805,0.021,"NYSE"),A("UNH","UnitedHealth","stocks",355,0.027,"NYSE"),A("JNJ","Johnson & Johnson","stocks",185,0.012,"NYSE"),A("PFE","Pfizer","stocks",26,0.021,"NYSE"),A("XOM","Exxon Mobil","stocks",118,0.017,"NYSE"),A("CVX","Chevron","stocks",160,0.016,"NYSE"),A("CAT","Caterpillar","stocks",455,0.020,"NYSE"),A("BA","Boeing","stocks",225,0.030,"NYSE"),A("GE","GE Aerospace","stocks",290,0.020,"NYSE"),A("F","Ford","stocks",12,0.025,"NYSE"),A("GM","General Motors","stocks",62,0.024,"NYSE"),A("RIVN","Rivian","stocks",18,0.051,"NASDAQ"),A("NVO","Novo Nordisk ADR","stocks",60,0.030,"NYSE"),A("SAP","SAP ADR","stocks",315,0.018,"NYSE"),A("SONY","Sony ADR","stocks",32,0.021,"NYSE"),A("BABA","Alibaba ADR","stocks",155,0.029,"NYSE"),
    A("BTC","Bitcoin","crypto",115000,0.040,"CRYPTO"),A("ETH","Ethereum","crypto",4800,0.050,"CRYPTO"),A("SOL","Solana","crypto",245,0.065,"CRYPTO"),A("XRP","XRP","crypto",3.2,0.055,"CRYPTO"),A("BNB","BNB","crypto",980,0.042,"CRYPTO"),A("ADA","Cardano","crypto",1.05,0.060,"CRYPTO"),A("AVAX","Avalanche","crypto",45,0.070,"CRYPTO"),A("LINK","Chainlink","crypto",28,0.055,"CRYPTO"),A("SUI","Sui","crypto",4.2,0.080,"CRYPTO"),A("HYPE","Hyperliquid","crypto",58,0.075,"CRYPTO"),A("TON","Toncoin","crypto",5.6,0.055,"CRYPTO"),A("DOT","Polkadot","crypto",6.9,0.060,"CRYPTO"),
    A("DOGE","Dogecoin","memecoins",0.10,0.095,"MEME"),A("SHIB","Shiba Inu","memecoins",0.0000061,0.110,"MEME"),A("PEPE","Pepe","memecoins",0.0000048,0.135,"MEME"),A("PUMP","Pump.fun","memecoins",0.0044,0.140,"MEME"),A("PENGU","Pudgy Penguins","memecoins",0.0088,0.135,"MEME"),A("BONK","Bonk","memecoins",0.000018,0.130,"MEME"),A("WIF","dogwifhat","memecoins",1.15,0.145,"MEME"),A("FLOKI","Floki","memecoins",0.00011,0.125,"MEME"),A("BRETT","Brett","memecoins",0.055,0.135,"MEME"),A("BOME","Book of Meme","memecoins",0.0011,0.150,"MEME"),A("MOG","Mog Coin","memecoins",0.00000055,0.145,"MEME"),A("TURBO","Turbo","memecoins",0.0035,0.150,"MEME"),
    A("SPX","S&P 500","indices",7150,0.010,"INDEX"),A("NDX","Nasdaq-100","indices",25800,0.014,"INDEX"),A("DJI","Dow Jones","indices",48200,0.008,"INDEX"),A("RUT","Russell 2000","indices",2500,0.015,"INDEX"),A("AEX","AEX","indices",980,0.011,"INDEX","EUR"),A("DAX","DAX","indices",24800,0.012,"INDEX","EUR"),A("FTSE","FTSE 100","indices",9300,0.009,"INDEX","GBP"),A("N225","Nikkei 225","indices",45500,0.013,"INDEX","JPY"),A("STOXX50","Euro Stoxx 50","indices",5850,0.011,"INDEX","EUR"),
    A("SPY","SPDR S&P 500 ETF","etfs",710,0.010,"ETF"),A("QQQ","Invesco QQQ","etfs",635,0.014,"ETF"),A("VOO","Vanguard S&P 500 ETF","etfs",650,0.010,"ETF"),A("VTI","Vanguard Total Stock Market ETF","etfs",330,0.011,"ETF"),A("VT","Vanguard Total World Stock ETF","etfs",145,0.010,"ETF"),A("IWM","iShares Russell 2000 ETF","etfs",245,0.015,"ETF"),A("DIA","SPDR Dow Jones ETF","etfs",480,0.008,"ETF"),A("XLK","Technology Select Sector SPDR","etfs",295,0.016,"ETF"),A("XLF","Financial Select Sector SPDR","etfs",57,0.012,"ETF"),A("XLE","Energy Select Sector SPDR","etfs",92,0.015,"ETF"),A("TLT","iShares 20+ Year Treasury Bond ETF","etfs",91,0.010,"ETF"),A("GLD","SPDR Gold Shares","etfs",340,0.012,"ETF"),A("SLV","iShares Silver Trust","etfs",42,0.023,"ETF"),A("ARKK","ARK Innovation ETF","etfs",82,0.027,"ETF"),A("EEM","iShares MSCI Emerging Markets ETF","etfs",55,0.014,"ETF"),A("IEFA","iShares Core MSCI EAFE ETF","etfs",93,0.012,"ETF"),A("VWCE","Vanguard FTSE All-World UCITS ETF","etfs",145,0.010,"ETF","EUR"),A("VUG","Vanguard Growth ETF","etfs",480,0.014,"ETF")
  ];
  const BY_SYMBOL = new Map(ASSETS.map(a => [a.symbol,a]));

  const $ = id => document.getElementById(id);
  const qsa = (sel,root=document) => [...root.querySelectorAll(sel)];
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const fmtMoney = (n,c="USD") => {
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) < 0.005) return "$0.00";
    if (Math.abs(n) < 0.01) return `$${n.toFixed(4)}`;
    return new Intl.NumberFormat("en-US",{style:"currency",currency:c,maximumFractionDigits:Math.abs(n)<1?6:2}).format(n);
  };
  const fmtPrice = n => {
    if (!Number.isFinite(n)) return "—";
    if (n >= 1000) return "$"+n.toLocaleString("en-US",{maximumFractionDigits:2});
    if (n >= 1) return "$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:4});
    if (n >= 0.01) return "$"+n.toFixed(5);
    return "$"+n.toPrecision(5);
  };
  const fmtQty = n => !Number.isFinite(n)?"—":n.toLocaleString("en-US",{maximumFractionDigits:n<1?8:4});
  const fmtPct = n => { const v=Math.abs(n)<0.0000005?0:n; return `${v>=0?"+":""}${(v*100).toFixed(2)}%`; };
  const nowIso = () => new Date().toISOString();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  function hash32(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rand01(seed){let x=seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967295}
  function smoothstep(x){return x*x*(3-2*x)}
  function noise(asset,t,period,salt){const k=Math.floor(t/period),f=(t-k*period)/period;const a=rand01(hash32(`${asset.symbol}:${salt}:${k}`))*2-1;const b=rand01(hash32(`${asset.symbol}:${salt}:${k+1}`))*2-1;return a+(b-a)*smoothstep(f)}

  const globalMarket = {serverOffset:0,impact:{},available:false,lastSync:0,mode:"clock-synced"};
  function marketNow(){return Date.now()+globalMarket.serverOffset}
  function currentImpact(symbol,t=marketNow()){
    const rec=globalMarket.impact[symbol]; if(!rec) return 0;
    const age=Math.max(0,t-rec.updatedAt); const decay=Math.max(0,1-age/(6*3600000));
    return rec.impact*decay;
  }
  function baselinePrice(asset,t){
    const qt=Math.floor(t/CFG.marketTickMs)*CFG.marketTickMs;
    const days=(qt-EPOCH)/86400000;
    const dailyDrift=asset.drift*days;
    const v=asset.vol;
    const nFast=noise(asset,qt,5*60000,"f")*v*0.10;
    const nMid=noise(asset,qt,2*3600000,"m")*v*0.28;
    const nSlow=noise(asset,qt,36*3600000,"s")*v*0.55;
    const nMacro=noise(asset,qt,21*86400000,"x")*v*1.10;
    const wave=Math.sin(qt/(7.5*3600000)+(asset.seed%1000))*v*0.11 + Math.sin(qt/(6.5*86400000)+(asset.seed%100))*v*0.23;
    return Math.max(asset.base*0.02,asset.base*Math.exp(dailyDrift+nFast+nMid+nSlow+nMacro+wave));
  }
  function priceAt(asset,t=marketNow(),withImpact=true){
    const base=baselinePrice(asset,t); const imp=withImpact?currentImpact(asset.symbol,t):0;
    return base*Math.exp(imp);
  }
  function dayChange(asset,t=marketNow()){const p=priceAt(asset,t), prev=priceAt(asset,t-86400000);return p/prev-1}

  function candleSeries(asset,tf,visible=TF_COUNT[tf]||140){
    const step=TF_MS[tf]||300000; const end=Math.floor(marketNow()/step)*step; const out=[];
    for(let i=visible-1;i>=0;i--){
      const start=end-(i+1)*step; const next=start+step; const samples=[];
      for(let j=0;j<=6;j++) samples.push(priceAt(asset,start+(step*j/6),false));
      let open=samples[0],close=samples[samples.length-1],high=Math.max(...samples),low=Math.min(...samples);
      const wick=(0.0015+asset.vol*0.045)*(0.5+rand01(hash32(`${asset.symbol}:${tf}:${start}:wick`)));
      high*=1+wick;low*=1-wick;
      const recentAge=marketNow()-next; const imp=currentImpact(asset.symbol);
      if(recentAge<6*3600000 && recentAge>=-step){const ramp=clamp(1-recentAge/(6*3600000),0,1);const m=Math.exp(imp*ramp);open*=m;high*=m;low*=m;close*=m}
      const volume=Math.round((asset.category==="memecoins"?4e8:asset.category==="crypto"?1.5e8:asset.category==="stocks"?2.5e7:4e6)*(0.55+rand01(hash32(`${asset.symbol}:${tf}:${start}:v`))*1.3));
      out.push({t:start,o:open,h:high,l:low,c:close,v:volume});
    }
    return out;
  }

  function initialState(cash=CFG.startingCash){return {cash,realized:0,positions:[],holdings:{},orders:[],history:[],equityHistory:[{t:Date.now(),v:cash}],watchlist:["NVDA","AAPL","BTC","ETH","SPX"],selected:"NVDA",category:"stocks",timeframe:"5m",activityPane:"positions",mode:"trade",tradeSide:"long",tradeType:"market",investSide:"buy",investType:"market",lastSeen:Date.now()}}
  function loadState(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");return x&&typeof x.cash==="number"?Object.assign(initialState(),x):initialState()}catch{return initialState()}}
  function loadSettings(){try{return Object.assign({theme:"carbon",upColor:"#2fc98f",downColor:"#ef6574",chartBg:"#0a0e13",grid:true,crosshair:true,compact:false,chartType:"candles",overlay:"none",zoom:1},JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}"))}catch{return {theme:"carbon",upColor:"#2fc98f",downColor:"#ef6574",chartBg:"#0a0e13",grid:true,crosshair:true,compact:false,chartType:"candles",overlay:"none",zoom:1}}}
  let state=loadState(), settings=loadSettings();
  function save(){state.lastSeen=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}

  let chartData=[],heroTimer=null,marketTimer=null,activityRenderKey="",tutorialStep=0;
  const tutorials=[
    {title:"This is not real trading",body:"Tickrift uses virtual funds and synthetic prices. There are no deposits, withdrawals, real assets or brokerage orders. Your paper account exists only in your browser."},
    {title:"The shared market keeps moving",body:"Synthetic prices are generated from the current UTC time. Closing the tab does not pause the market. When you return later, prices are recalculated for that later time."},
    {title:"Trade vs Invest",body:"Trade opens leveraged or unleveraged long/short paper positions. Invest creates unleveraged long-term holdings. Both use the same paper cash balance and the same simulated price."},
    {title:"Timeframes really change the candles",body:"1m, 5m, 15m, 30m, 1h, 2h, 4h, 1D and 1W aggregate different periods. A 1W candle represents one synthetic week, not the same 5-minute chart with a different label."},
    {title:"Global player flow",body:"If the optional shared backend is connected, filled virtual buys and sells create tiny temporary pressure in the synthetic market. The effect decays over time. Without that backend, the clock-synced market is still shared, but player orders cannot affect other visitors."}
  ];

  function portfolioSnapshot(){
    let tradeValue=0,unrealizedTrade=0,reserved=0,investValue=0,investCost=0,unrealizedInvest=0;
    for(const p of state.positions){const a=BY_SYMBOL.get(p.symbol);if(!a)continue;const px=priceAt(a);const pnl=(p.side==="long"?px-p.entry:p.entry-px)*p.qty;unrealizedTrade+=pnl;reserved+=p.margin;tradeValue+=p.margin+pnl}
    for(const [symbol,h] of Object.entries(state.holdings)){const a=BY_SYMBOL.get(symbol);if(!a)continue;const px=priceAt(a);investValue+=h.qty*px;investCost+=h.qty*h.avg;unrealizedInvest+=h.qty*(px-h.avg)}
    const equity=state.cash+tradeValue+investValue;
    return {tradeValue,unrealizedTrade,reserved,investValue,investCost,unrealizedInvest,equity,unrealized:unrealizedTrade+unrealizedInvest};
  }

  function showToast(msg,type=""){const el=document.createElement("div");el.className=`toast ${type}`;el.textContent=msg;$("toastHost").appendChild(el);setTimeout(()=>el.remove(),3300)}
  function setMessage(id,msg,bad=false){const el=$(id);el.textContent=msg;el.style.color=bad?"var(--down)":"var(--muted)"}

  async function syncGlobalMarket(force=false){
    if(!force && Date.now()-globalMarket.lastSync<15000)return;
    globalMarket.lastSync=Date.now();
    try{
      const syms=ASSETS.map(a=>a.symbol).join(",");
      const url=`${CFG.globalMarketEndpoint}?symbols=${encodeURIComponent(syms)}`;
      const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error("backend unavailable");
      const d=await r.json();
      if(Number.isFinite(d.serverTime)) globalMarket.serverOffset=d.serverTime-Date.now();
      globalMarket.available=!!d.globalFlow;
      globalMarket.mode=d.globalFlow?"global-flow":"clock-synced";
      const next={};
      for(const rec of (d.impacts||[])) next[rec.symbol]={impact:Number(rec.impact)||0,updatedAt:Number(rec.updatedAt)||d.serverTime||Date.now(),trades:Number(rec.trades)||0,volume:Number(rec.volume)||0};
      globalMarket.impact=next;
      $("globalStatus").textContent=globalMarket.available?"GLOBAL FLOW ONLINE":"SHARED SIMULATION";
      $("globalStatusDot").classList.toggle("online",globalMarket.available);
      $("globalFlowLabel").textContent=globalMarket.available?"Global player flow: online":"Global player flow: clock-only";
    }catch{
      globalMarket.available=false;globalMarket.mode="clock-synced";
      $("globalStatus").textContent="SHARED SIMULATION";
      $("globalStatusDot").classList.remove("online");
      $("globalFlowLabel").textContent="Global player flow: backend offline";
    }
  }
  async function reportOrderFlow(symbol,side,notional){
    if(!globalMarket.available)return;
    try{
      const r=await fetch(CFG.globalMarketEndpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({orderId:uid(),symbol,side,notional:clamp(Number(notional)||0,0,500000)})});
      if(r.ok){const d=await r.json();if(d.record)globalMarket.impact[symbol]=d.record;setTimeout(()=>syncGlobalMarket(true),300)}
    }catch{}
  }

  function renderViews(view){qsa(".view").forEach(v=>v.classList.remove("active"));$(view+"View").classList.add("active");document.body.classList.toggle("terminal-mode",view==="terminal");qsa(".nav-link[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));if(view==="terminal"){resizeChart();renderAll()}if(view==="portfolio")renderPortfolio()}
  qsa("[data-view]").forEach(b=>b.addEventListener("click",()=>renderViews(b.dataset.view)));
  $("startTrading").addEventListener("click",()=>renderViews("terminal"));
  qsa("[data-start-mode]").forEach(b=>b.addEventListener("click",()=>{setMode(b.dataset.startMode);renderViews("terminal")}));

  function filteredAssets(){const s=$("assetSearch").value.trim().toLowerCase();let arr=ASSETS.filter(a=>a.category===state.category);if($("watchlistOnly").classList.contains("active"))arr=arr.filter(a=>state.watchlist.includes(a.symbol));if(s)arr=arr.filter(a=>`${a.symbol} ${a.name}`.toLowerCase().includes(s));return arr}
  function renderAssetList(){const host=$("assetList");host.innerHTML="";for(const a of filteredAssets()){const p=priceAt(a),ch=dayChange(a);const b=document.createElement("button");b.className=`asset-row ${a.symbol===state.selected?"active":""}`;b.innerHTML=`<div><strong>${a.symbol}</strong><small>${a.name}</small></div><div class="asset-price"><b>${fmtPrice(p)}</b><span class="${ch>=0?"up":"down"}">${fmtPct(ch)}</span></div>`;b.addEventListener("click",()=>selectAsset(a.symbol));host.appendChild(b)}if(!host.children.length)host.innerHTML='<div class="empty-state">No instruments found.</div>'}
  function selectAsset(symbol){const a=BY_SYMBOL.get(symbol);if(!a)return;state.selected=symbol;state.category=a.category;save();qsa("#assetTabs button").forEach(b=>b.classList.toggle("active",b.dataset.category===a.category));refreshChart();renderAll()}
  qsa("#assetTabs button").forEach(b=>b.addEventListener("click",()=>{state.category=b.dataset.category;state.selected=(ASSETS.find(a=>a.category===state.category)||ASSETS[0]).symbol;qsa("#assetTabs button").forEach(x=>x.classList.toggle("active",x===b));save();refreshChart();renderAll()}));
  $("assetSearch").addEventListener("input",renderAssetList);$("watchlistOnly").addEventListener("click",e=>{e.currentTarget.classList.toggle("active");renderAssetList()});
  $("favoriteAsset").addEventListener("click",()=>{const s=state.selected;state.watchlist=state.watchlist.includes(s)?state.watchlist.filter(x=>x!==s):[...state.watchlist,s];save();renderInstrument();renderAssetList()});

  function refreshChart(){const a=BY_SYMBOL.get(state.selected)||ASSETS[0];const n=Math.round((TF_COUNT[state.timeframe]||140)*settings.zoom);chartData=candleSeries(a,state.timeframe,clamp(n,50,260));drawChart()}
  function renderInstrument(){const a=BY_SYMBOL.get(state.selected);if(!a)return;const p=priceAt(a),ch=dayChange(a),day=candleSeries(a,"1D",2).at(-1);$("symbolLabel").textContent=a.symbol;$("nameLabel").textContent=a.name;$("assetTypeBadge").textContent=a.category==="memecoins"?"MEME":a.category.slice(0,-1).toUpperCase();$("exchangeLabel").textContent=a.exchange;$("marketStateLabel").textContent="Shared synthetic market";$("sourceBadge").textContent=globalMarket.available?"GLOBAL SIM":"SHARED SIM";$("priceLabel").textContent=fmtPrice(p);$("changeLabel").textContent=fmtPct(ch);$("changeLabel").className=ch>=0?"up":"down";$("openLabel").textContent=fmtPrice(day.o);$("highLabel").textContent=fmtPrice(day.h);$("lowLabel").textContent=fmtPrice(day.l);$("volumeLabel").textContent=day.v.toLocaleString("en-US",{notation:"compact"});$("favoriteAsset").textContent=state.watchlist.includes(a.symbol)?"★":"☆";$("move24Stat").textContent=fmtPct(ch);const imp=currentImpact(a.symbol);$("flowStat").textContent=globalMarket.available?`${imp>=0?"+":""}${(imp*100).toFixed(4)}%`:"offline";$("updatedStat").textContent=new Date(marketNow()).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});}

  function drawChart(){
    const canvas=$("chartCanvas"),stage=$("chartStage");
    if(!canvas||!stage||!chartData.length)return;
    const rect=stage.getBoundingClientRect();
    const w=Math.max(240,Math.round(rect.width||stage.clientWidth||600));
    const h=Math.max(220,Math.round(rect.height||stage.clientHeight||360));
    const dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
    canvas.style.width="100%";canvas.style.height="100%";
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const bg=settings.chartBg||"#0a0e13";
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);stage.style.background=bg;
    const pad={l:12,r:64,t:10,b:23},pw=Math.max(80,w-pad.l-pad.r),ph=Math.max(60,h-pad.t-pad.b);
    const vals=chartData.flatMap(c=>[c.h,c.l]);
    let min=Math.min(...vals),max=Math.max(...vals);const range=Math.max(1e-9,max-min);min-=range*.08;max+=range*.08;
    const y=v=>pad.t+(max-v)/(max-min)*ph;const x=i=>pad.l+(i+.5)/chartData.length*pw;const cw=Math.max(1,pw/chartData.length*.64);
    if(settings.grid){
      ctx.strokeStyle="rgba(110,130,150,.12)";ctx.lineWidth=1;
      for(let i=0;i<=5;i++){const yy=pad.t+ph*i/5;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(pad.l+pw,yy);ctx.stroke()}
      for(let i=0;i<=6;i++){const xx=pad.l+pw*i/6;ctx.beginPath();ctx.moveTo(xx,pad.t);ctx.lineTo(xx,pad.t+ph);ctx.stroke()}
    }
    ctx.font="9px system-ui";ctx.fillStyle="#718092";ctx.textAlign="left";
    for(let i=0;i<=5;i++){const v=max-(max-min)*i/5;ctx.fillText(formatAxis(v),pad.l+pw+7,pad.t+ph*i/5+3)}
    const type=settings.chartType;let series=chartData;
    if(type==="heikin"){series=[];let prevO=chartData[0].o,prevC=chartData[0].c;for(const c of chartData){const hc=(c.o+c.h+c.l+c.c)/4,ho=(prevO+prevC)/2,hh=Math.max(c.h,ho,hc),hl=Math.min(c.l,ho,hc);series.push({...c,o:ho,h:hh,l:hl,c:hc});prevO=ho;prevC=hc}}
    if(type==="line"||type==="area"){
      ctx.beginPath();series.forEach((c,i)=>{const xx=x(i),yy=y(c.c);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.strokeStyle=settings.upColor;ctx.lineWidth=1.7;ctx.stroke();
      if(type==="area"){ctx.lineTo(x(series.length-1),pad.t+ph);ctx.lineTo(x(0),pad.t+ph);ctx.closePath();const g=ctx.createLinearGradient(0,pad.t,0,pad.t+ph);g.addColorStop(0,hexAlpha(settings.upColor,.24));g.addColorStop(1,hexAlpha(settings.upColor,0));ctx.fillStyle=g;ctx.fill()}
    } else {
      series.forEach((c,i)=>{
        const up=c.c>=c.o,col=up?settings.upColor:settings.downColor,xx=x(i),yo=y(c.o),yc=y(c.c);
        ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xx,y(c.h));ctx.lineTo(xx,y(c.l));ctx.stroke();
        if(type==="bars"){ctx.beginPath();ctx.moveTo(xx-cw*.45,yo);ctx.lineTo(xx,yo);ctx.lineTo(xx,yc);ctx.lineTo(xx+cw*.45,yc);ctx.stroke()}
        else {const top=Math.min(yo,yc),bh=Math.max(1,Math.abs(yc-yo));if(type==="hollow"){ctx.strokeRect(xx-cw/2,top,cw,bh)}else ctx.fillRect(xx-cw/2,top,cw,bh)}
      });
    }
    if(settings.overlay!=="none"){
      const period=settings.overlay.includes("50")?50:20;const ema=settings.overlay.startsWith("ema");const arr=ema?emaValues(series.map(c=>c.c),period):smaValues(series.map(c=>c.c),period);ctx.beginPath();let started=false;
      arr.forEach((v,i)=>{if(v==null)return;const xx=x(i),yy=y(v);started?ctx.lineTo(xx,yy):(ctx.moveTo(xx,yy),started=true)});ctx.strokeStyle="#69a7ff";ctx.lineWidth=1.2;ctx.stroke();
    }
    const last=series.at(-1);
    ctx.strokeStyle="rgba(216,255,114,.35)";ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(pad.l,y(last.c));ctx.lineTo(pad.l+pw,y(last.c));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#647181";ctx.textAlign="left";ctx.fillText(formatTime(new Date(series[0].t),state.timeframe),pad.l,h-7);ctx.textAlign="right";ctx.fillText(formatTime(new Date(last.t),state.timeframe),pad.l+pw,h-7);
    canvas._chartMap={pad,pw,ph,min,max,x,y,series};
  }
  function formatAxis(v){if(v>=1000)return v.toLocaleString("en-US",{maximumFractionDigits:0});if(v>=1)return v.toFixed(2);return v.toPrecision(3)}
  function formatTime(d,tf){if(tf==="1D"||tf==="1W")return d.toLocaleDateString([], {month:"short",year:tf==="1W"?"2-digit":undefined,day:"numeric"});return d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
  function hexAlpha(hex,a){const h=hex.replace("#","");const n=parseInt(h.length===3?h.split("").map(x=>x+x).join(""):h,16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}
  function smaValues(v,p){return v.map((_,i)=>i<p-1?null:v.slice(i-p+1,i+1).reduce((a,b)=>a+b,0)/p)}
  function emaValues(v,p){const k=2/(p+1);let e=v[0];return v.map((x,i)=>{e=i?x*k+e*(1-k):x;return i<p-1?null:e})}
  function resizeChart(){refreshChart();drawHero()}
  window.addEventListener("resize",()=>{clearTimeout(resizeChart._t);resizeChart._t=setTimeout(resizeChart,100)});

  qsa("#timeframes button").forEach(b=>b.addEventListener("click",()=>{state.timeframe=b.dataset.tf;qsa("#timeframes button").forEach(x=>x.classList.toggle("active",x===b));save();refreshChart()}));
  $("chartType").addEventListener("change",e=>{settings.chartType=e.target.value;save();drawChart()});$("overlaySelect").addEventListener("change",e=>{settings.overlay=e.target.value;save();drawChart()});$("zoomIn").addEventListener("click",()=>{settings.zoom=clamp(settings.zoom*.82,.45,2.2);save();refreshChart()});$("zoomOut").addEventListener("click",()=>{settings.zoom=clamp(settings.zoom*1.22,.45,2.2);save();refreshChart()});$("fitChart").addEventListener("click",()=>{settings.zoom=1;save();refreshChart()});
  $("chartCanvas").addEventListener("mousemove",e=>{if(!settings.crosshair)return;const map=e.currentTarget._chartMap;if(!map)return;const r=e.currentTarget.getBoundingClientRect(),mx=e.clientX-r.left;const idx=clamp(Math.floor((mx-map.pad.l)/map.pw*map.series.length),0,map.series.length-1);const c=map.series[idx],info=$("crosshairInfo");info.classList.remove("hidden");info.textContent=`${new Date(c.t).toLocaleString()} · O ${fmtPrice(c.o)} H ${fmtPrice(c.h)} L ${fmtPrice(c.l)} C ${fmtPrice(c.c)}`;info.style.left=Math.min(r.width-260,Math.max(8,e.clientX-r.left+10))+"px";info.style.top=Math.max(8,e.clientY-r.top-28)+"px";$("ohlcLegend").textContent=`O ${fmtPrice(c.o)}  H ${fmtPrice(c.h)}  L ${fmtPrice(c.l)}  C ${fmtPrice(c.c)}`});$("chartCanvas").addEventListener("mouseleave",()=>$("crosshairInfo").classList.add("hidden"));

  function setMode(mode){state.mode=mode;$("tradeTicket").classList.toggle("hidden",mode!=="trade");$("investTicket").classList.toggle("hidden",mode!=="invest");qsa("#orderMode button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));save();updateTicket()}
  qsa("#orderMode button").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  qsa("#directionToggle button").forEach(b=>b.addEventListener("click",()=>{state.tradeSide=b.dataset.side;qsa("#directionToggle button").forEach(x=>x.classList.toggle("active",x===b));save();updateTicket()}));
  qsa("#investSideToggle button").forEach(b=>b.addEventListener("click",()=>{state.investSide=b.dataset.side;qsa("#investSideToggle button").forEach(x=>x.classList.toggle("active",x===b));save();updateTicket()}));
  qsa("#tradeOrderTypes button").forEach(b=>b.addEventListener("click",()=>{state.tradeType=b.dataset.type;qsa("#tradeOrderTypes button").forEach(x=>x.classList.toggle("active",x===b));$("tradeTriggerRow").classList.toggle("hidden",state.tradeType==="market");save();updateTicket()}));
  qsa("#investOrderTypes button").forEach(b=>b.addEventListener("click",()=>{state.investType=b.dataset.type;qsa("#investOrderTypes button").forEach(x=>x.classList.toggle("active",x===b));$("investTriggerRow").classList.toggle("hidden",state.investType==="market");save();updateTicket()}));
  qsa("#tradeQuick button").forEach(b=>b.addEventListener("click",()=>{$("tradeAmount").value=b.dataset.value;updateTicket()}));qsa("#investQuick button").forEach(b=>b.addEventListener("click",()=>{$("investAmount").value=b.dataset.value;updateTicket()}));
  ["tradeAmount","tradeLeverage","investAmount","tradeTrigger","investTrigger","slValue","tpValue","trailValue"].forEach(id=>$(id).addEventListener("input",updateTicket));
  [["slEnabled","slValue"],["tpEnabled","tpValue"],["trailEnabled","trailValue"]].forEach(([c,i])=>$(c).addEventListener("change",()=>{$(i).disabled=!$(c).checked;updateTicket()}));

  function updateTicket(){const a=BY_SYMBOL.get(state.selected),px=priceAt(a);const amount=Math.max(0,Number($("tradeAmount").value)||0),lev=Math.max(1,Number($("tradeLeverage").value)||1),notional=amount*lev;$("tradeQty").textContent=fmtQty(notional/px);$("tradeFee").textContent=fmtMoney(notional*FEE_RATE);$("tradeNotional").textContent=fmtMoney(notional);$("tradeSubmit").textContent=state.tradeType==="market"?`Open ${state.tradeSide}`:`Place ${state.tradeSide} ${state.tradeType}`;$("tradeSubmit").className=`order-submit ${state.tradeSide}`;const ia=Math.max(0,Number($("investAmount").value)||0),h=state.holdings[a.symbol];$("investQty").textContent=fmtQty(ia/px);$("investFee").textContent=fmtMoney(ia*FEE_RATE);$("currentHolding").textContent=h?`${fmtQty(h.qty)} shares`:"None";$("investSubmit").textContent=state.investType==="market"?`${state.investSide==="buy"?"Buy":"Sell"} investment`:`Place ${state.investSide} limit`;}

  function executeTrade({symbol,side,margin,leverage,slPct,tpPct,trailPct,fromOrder=false}){const a=BY_SYMBOL.get(symbol),px=priceAt(a);const notional=margin*leverage,fee=notional*FEE_RATE;if(margin<=0||notional<=0)return {ok:false,msg:"Enter a valid amount."};if(state.cash<margin+fee)return {ok:false,msg:"Not enough paper cash."};state.cash-=margin+fee;const p={id:uid(),symbol,side,margin,leverage,qty:notional/px,entry:px,openedAt:Date.now(),fee,slPct,tpPct,trailPct,best:px};state.positions.push(p);state.history.unshift({id:uid(),t:Date.now(),kind:`${side.toUpperCase()} OPEN`,symbol,price:px,amount:notional});reportOrderFlow(symbol,side==="long"?"buy":"sell",notional);save();showToast(`${side==="long"?"Long":"Short"} ${symbol} opened`,"good");return {ok:true,msg:fromOrder?"Order filled.":"Paper position opened."}}
  function executeInvest({symbol,side,amount,fromOrder=false}){const a=BY_SYMBOL.get(symbol),px=priceAt(a),fee=amount*FEE_RATE;if(amount<=0)return {ok:false,msg:"Enter a valid amount."};if(side==="buy"){if(state.cash<amount+fee)return {ok:false,msg:"Not enough paper cash."};const qty=amount/px,h=state.holdings[symbol]||{qty:0,avg:0};const cost=h.qty*h.avg+amount;h.qty+=qty;h.avg=cost/h.qty;state.holdings[symbol]=h;state.cash-=amount+fee;state.history.unshift({id:uid(),t:Date.now(),kind:"INVEST BUY",symbol,price:px,amount});reportOrderFlow(symbol,"buy",amount)}else{const h=state.holdings[symbol];if(!h||h.qty<=0)return {ok:false,msg:"You do not hold this asset."};const qty=Math.min(h.qty,amount/px);const gross=qty*px,sellFee=gross*FEE_RATE;state.cash+=gross-sellFee;state.realized+=(px-h.avg)*qty-sellFee;h.qty-=qty;if(h.qty<1e-10)delete state.holdings[symbol];state.history.unshift({id:uid(),t:Date.now(),kind:"INVEST SELL",symbol,price:px,amount:gross});reportOrderFlow(symbol,"sell",gross)}save();showToast(`${symbol} ${side} filled`,"good");return {ok:true,msg:fromOrder?"Order filled.":"Investment order filled."}}

  $("tradeSubmit").addEventListener("click",()=>{const margin=Number($("tradeAmount").value)||0,leverage=Number($("tradeLeverage").value)||1,slPct=$("slEnabled").checked?(Number($("slValue").value)||0)/100:null,tpPct=$("tpEnabled").checked?(Number($("tpValue").value)||0)/100:null,trailPct=$("trailEnabled").checked?(Number($("trailValue").value)||0)/100:null;if(state.tradeType!=="market"){const trigger=Number($("tradeTrigger").value)||0;if(trigger<=0){setMessage("tradeMessage","Enter a trigger price.",true);return}state.orders.push({id:uid(),mode:"trade",symbol:state.selected,side:state.tradeSide,type:state.tradeType,trigger,margin,leverage,slPct,tpPct,trailPct,createdAt:Date.now()});save();setMessage("tradeMessage","Paper order placed.");showToast("Paper order placed","good");renderAll();return}const r=executeTrade({symbol:state.selected,side:state.tradeSide,margin,leverage,slPct,tpPct,trailPct});setMessage("tradeMessage",r.msg,!r.ok);renderAll()});
  $("investSubmit").addEventListener("click",()=>{const amount=Number($("investAmount").value)||0;if(state.investType!=="market"){const trigger=Number($("investTrigger").value)||0;if(trigger<=0){setMessage("investMessage","Enter a limit price.",true);return}state.orders.push({id:uid(),mode:"invest",symbol:state.selected,side:state.investSide,type:"limit",trigger,amount,createdAt:Date.now()});save();setMessage("investMessage","Paper order placed.");showToast("Paper order placed","good");renderAll();return}const r=executeInvest({symbol:state.selected,side:state.investSide,amount});setMessage("investMessage",r.msg,!r.ok);renderAll()});

  function closePosition(id,reason="Manual close"){const idx=state.positions.findIndex(p=>p.id===id);if(idx<0)return;const p=state.positions[idx],a=BY_SYMBOL.get(p.symbol),px=priceAt(a),pnl=(p.side==="long"?px-p.entry:p.entry-px)*p.qty,closeFee=(p.qty*px)*FEE_RATE;state.cash+=Math.max(0,p.margin+pnl)-closeFee;state.realized+=pnl-p.fee-closeFee;state.positions.splice(idx,1);state.history.unshift({id:uid(),t:Date.now(),kind:reason,symbol:p.symbol,price:px,amount:p.qty*px,pnl:pnl-closeFee});reportOrderFlow(p.symbol,p.side==="long"?"sell":"buy",p.qty*px);save();showToast(`${p.symbol} closed · ${fmtMoney(pnl-closeFee)}`,pnl>=0?"good":"bad");renderAll()}
  function cancelOrder(id){state.orders=state.orders.filter(o=>o.id!==id);save();showToast("Order cancelled");renderAll()}

  function processMarketLogic(){
    for(const o of [...state.orders]){const a=BY_SYMBOL.get(o.symbol);if(!a)continue;const px=priceAt(a);let hit=false;if(o.mode==="trade"){if(o.type==="limit")hit=o.side==="long"?px<=o.trigger:px>=o.trigger;else hit=o.side==="long"?px>=o.trigger:px<=o.trigger;if(hit){const r=executeTrade({...o,fromOrder:true});if(r.ok)state.orders=state.orders.filter(x=>x.id!==o.id)}}else{hit=o.side==="buy"?px<=o.trigger:px>=o.trigger;if(hit){const r=executeInvest({...o,fromOrder:true});if(r.ok)state.orders=state.orders.filter(x=>x.id!==o.id)}}}
    for(const p of [...state.positions]){const a=BY_SYMBOL.get(p.symbol);if(!a)continue;const px=priceAt(a);p.best=p.side==="long"?Math.max(p.best||p.entry,px):Math.min(p.best||p.entry,px);const ret=p.side==="long"?(px/p.entry-1):(p.entry/px-1),pnl=(p.side==="long"?px-p.entry:p.entry-px)*p.qty;if(p.slPct&&ret<=-p.slPct){closePosition(p.id,"Stop loss");continue}if(p.tpPct&&ret>=p.tpPct){closePosition(p.id,"Take profit");continue}if(p.trailPct){const trailHit=p.side==="long"?px<=(p.best*(1-p.trailPct)):px>=(p.best*(1+p.trailPct));if(trailHit){closePosition(p.id,"Trailing stop");continue}}if(pnl<=-p.margin*.92){closePosition(p.id,"Simulated liquidation");continue}}
    save();
  }

  function renderAccount(){const s=portfolioSnapshot();$("headerEquity").textContent=fmtMoney(s.equity);$("equityMetric").textContent=fmtMoney(s.equity);$("cashMetric").textContent=fmtMoney(state.cash);$("unrealizedMetric").textContent=fmtMoney(s.unrealized);$("unrealizedMetric").className=s.unrealized>=0?"up":"down";$("realizedMetric").textContent=fmtMoney(state.realized);$("realizedMetric").className=state.realized>=0?"up":"down";$("reservedMetric").textContent=fmtMoney(s.reserved);if(s.equity<=5&&state.cash<=5&&state.positions.length===0&&Object.keys(state.holdings).length===0)$("depletedOverlay").classList.remove("hidden")}
  function renderActivity(){
    const pane=state.activityPane,host=$("activityContent");
    $("positionCount").textContent=state.positions.length;$("holdingCount").textContent=Object.keys(state.holdings).length;$("orderCount").textContent=state.orders.length;$("historyCount").textContent=Math.min(99,state.history.length);
    qsa("#activityTabs button").forEach(b=>b.classList.toggle("active",b.dataset.pane===pane));
    let html="";
    if(pane==="positions"){
      if(!state.positions.length)html='<div class="empty-state">No open paper trades. Use the order ticket to open a paper position.</div>';
      else html='<table class="activity-table"><thead><tr><th>Symbol</th><th>Side</th><th>Entry</th><th>Now</th><th>Qty</th><th class="right">P&amp;L</th><th>Risk</th><th></th></tr></thead><tbody>'+state.positions.map(p=>{
        const a=BY_SYMBOL.get(p.symbol),px=priceAt(a),pnl=(p.side==="long"?px-p.entry:p.entry-px)*p.qty,ret=p.side==="long"?(px/p.entry-1):(p.entry/px-1);
        const risk=[p.slPct!=null?`SL ${fmtPct(-p.slPct)}`:'',p.tpPct!=null?`TP ${fmtPct(p.tpPct)}`:'',p.trailPct!=null?`Trail ${fmtPct(p.trailPct)}`:''].filter(Boolean).join(' · ')||'None';
        return `<tr><td><b>${p.symbol}</b></td><td class="${p.side==="long"?"up":"down"}">${p.side}</td><td>${fmtPrice(p.entry)}</td><td>${fmtPrice(px)}</td><td>${fmtQty(p.qty)}</td><td class="right ${pnl>=0?"up":"down"}"><span class="pnl-primary">${fmtMoney(pnl)}</span><span class="pnl-secondary">${fmtPct(ret)}</span></td><td class="risk-summary">${risk}</td><td class="right"><button data-close="${p.id}">Close</button></td></tr>`;
      }).join('')+'</tbody></table>';
    }
    if(pane==="holdings"){
      const entries=Object.entries(state.holdings);
      if(!entries.length)html='<div class="empty-state">No long-term holdings yet.</div>';
      else html='<table class="activity-table"><thead><tr><th>Symbol</th><th>Qty</th><th>Avg cost</th><th>Now</th><th class="right">Value</th><th class="right">P&amp;L</th></tr></thead><tbody>'+entries.map(([s,h])=>{const px=priceAt(BY_SYMBOL.get(s)),pnl=(px-h.avg)*h.qty,ret=px/h.avg-1;return `<tr><td><b>${s}</b></td><td>${fmtQty(h.qty)}</td><td>${fmtPrice(h.avg)}</td><td>${fmtPrice(px)}</td><td class="right">${fmtMoney(px*h.qty)}</td><td class="right ${pnl>=0?"up":"down"}"><span class="pnl-primary">${fmtMoney(pnl)}</span><span class="pnl-secondary">${fmtPct(ret)}</span></td></tr>`}).join('')+'</tbody></table>';
    }
    if(pane==="orders"){
      if(!state.orders.length)html='<div class="empty-state">No pending paper orders.</div>';
      else html='<table class="activity-table"><thead><tr><th>Symbol</th><th>Mode</th><th>Side</th><th>Type</th><th>Trigger</th><th></th></tr></thead><tbody>'+state.orders.map(o=>`<tr><td><b>${o.symbol}</b></td><td>${o.mode}</td><td>${o.side}</td><td>${o.type}</td><td>${fmtPrice(o.trigger)}</td><td class="right"><button data-cancel="${o.id}">Cancel</button></td></tr>`).join('')+'</tbody></table>';
    }
    if(pane==="history"){
      if(!state.history.length)html='<div class="empty-state">No activity yet.</div>';
      else html='<table class="activity-table"><thead><tr><th>Time</th><th>Action</th><th>Symbol</th><th>Price</th><th class="right">Amount</th></tr></thead><tbody>'+state.history.slice(0,120).map(h=>`<tr><td>${new Date(h.t).toLocaleString()}</td><td>${h.kind}</td><td><b>${h.symbol}</b></td><td>${fmtPrice(h.price)}</td><td class="right">${fmtMoney(h.amount||0)}</td></tr>`).join('')+'</tbody></table>';
    }
    host.innerHTML=html;
    qsa("[data-close]",host).forEach(b=>b.addEventListener("click",()=>closePosition(b.dataset.close)));
    qsa("[data-cancel]",host).forEach(b=>b.addEventListener("click",()=>cancelOrder(b.dataset.cancel)));
  }
  qsa("#activityTabs button").forEach(b=>b.addEventListener("click",()=>{state.activityPane=b.dataset.pane;save();renderActivity()}));

  function renderPortfolio(){const s=portfolioSnapshot();$("portfolioEquity").textContent=fmtMoney(s.equity);$("portfolioCash").textContent=fmtMoney(state.cash);$("investedKpi").textContent=fmtMoney(s.investValue);$("tradingPnlKpi").textContent=fmtMoney(s.unrealizedTrade+state.realized);$("investPnlKpi").textContent=fmtMoney(s.unrealizedInvest);$("openOrdersKpi").textContent=state.orders.length;const rows=Object.entries(state.holdings);$("portfolioHoldings").innerHTML=rows.length?'<table class="portfolio-table"><thead><tr><th>Instrument</th><th>Shares</th><th>Average cost</th><th>Price</th><th class="right">Market value</th><th class="right">Return</th></tr></thead><tbody>'+rows.map(([sym,h])=>{const a=BY_SYMBOL.get(sym),px=priceAt(a),pnl=(px-h.avg)*h.qty;return `<tr><td><b>${sym}</b><br><small>${a.name}</small></td><td>${fmtQty(h.qty)}</td><td>${fmtPrice(h.avg)}</td><td>${fmtPrice(px)}</td><td class="right">${fmtMoney(px*h.qty)}</td><td class="right ${pnl>=0?"up":"down"}">${fmtMoney(pnl)} · ${fmtPct(px/h.avg-1)}</td></tr>`}).join("")+'</tbody></table>':'<div class="empty-state">No long-term holdings yet.</div>';drawAllocation();drawEquity()}
  function drawAllocation(){const c=$("allocationCanvas"),r=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);c.width=Math.max(1,r.width*dpr);c.height=Math.max(1,r.height*dpr);const ctx=c.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);const vals=Object.entries(state.holdings).map(([s,h])=>({s,v:h.qty*priceAt(BY_SYMBOL.get(s))})).filter(x=>x.v>0),total=vals.reduce((a,b)=>a+b.v,0);if(!total){ctx.fillStyle="#647181";ctx.font="11px system-ui";ctx.fillText("No holdings",40,80);$("allocationLegend").innerHTML="";return}let a0=-Math.PI/2;const cols=["#2fc98f","#69a7ff","#d8ff72","#ef6574","#a28cff","#f3b55a","#5fd1d6"];vals.forEach((x,i)=>{const a1=a0+x.v/total*Math.PI*2;ctx.beginPath();ctx.moveTo(r.width/2,r.height/2);ctx.arc(r.width/2,r.height/2,Math.min(r.width,r.height)*.42,a0,a1);ctx.closePath();ctx.fillStyle=cols[i%cols.length];ctx.fill();a0=a1});ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(r.width/2,r.height/2,Math.min(r.width,r.height)*.25,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="source-over";$("allocationLegend").innerHTML=vals.slice(0,8).map((x,i)=>`<div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${cols[i%cols.length]};margin-right:6px"></span>${x.s} <b>${(x.v/total*100).toFixed(1)}%</b></div>`).join("")}
  function drawEquity(){const c=$("equityCanvas"),r=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);c.width=Math.max(1,r.width*dpr);c.height=Math.max(1,r.height*dpr);const ctx=c.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);const pts=state.equityHistory.slice(-100);if(pts.length<2)return;const mn=Math.min(...pts.map(p=>p.v)),mx=Math.max(...pts.map(p=>p.v)),rg=Math.max(1,mx-mn),x=i=>10+i/(pts.length-1)*(r.width-20),y=v=>10+(mx-v)/rg*(r.height-20);ctx.strokeStyle="#2fc98f";ctx.lineWidth=1.6;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(x(i),y(p.v)):ctx.moveTo(x(i),y(p.v)));ctx.stroke()}

  function renderHero(){
    const picks=["NVDA","AAPL","BTC","ETH","DOGE","SPX"];
    $("heroMarketList").innerHTML=picks.map(s=>{const a=BY_SYMBOL.get(s),ch=dayChange(a);return `<div class="hero-market-row"><div><span>${s}</span><small>${a.name}</small></div><div><b>${fmtPrice(priceAt(a))}</b><small class="${ch>=0?"up":"down"}">${fmtPct(ch)}</small></div></div>`}).join("");
    $("heroSourceBadge").textContent=globalMarket.available?"GLOBAL FLOW":"CLOCK-SYNCED";
    $("heroSelected").textContent=`${state.selected} · ${BY_SYMBOL.get(state.selected)?.name||"NVIDIA"}`;
    drawHero();
  }
  function drawHero(){
    const c=$("heroChart");if(!c)return;const wrap=c.closest(".hero-chart-wrap");
    const rect=wrap?wrap.getBoundingClientRect():c.getBoundingClientRect();
    const w=Math.max(320,Math.round(rect.width||c.clientWidth||520)),h=Math.max(180,Math.round(rect.height||c.clientHeight||220)),dpr=Math.min(2,window.devicePixelRatio||1);
    c.width=Math.floor(w*dpr);c.height=Math.floor(h*dpr);c.style.width="100%";c.style.height="100%";
    const ctx=c.getContext("2d");if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const bg=settings.chartBg||"#0a0e13";ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const data=candleSeries(BY_SYMBOL.get("NVDA"),"15m",72),vals=data.flatMap(x=>[x.h,x.l]);let min=Math.min(...vals),max=Math.max(...vals),rg=Math.max(1e-9,max-min);min-=rg*.08;max+=rg*.08;
    const pad={l:8,r:10,t:8,b:18},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b,x=i=>pad.l+(i+.5)/data.length*pw,y=v=>pad.t+(max-v)/(max-min)*ph,cw=Math.max(2,pw/data.length*.55);
    if(settings.grid){ctx.strokeStyle="rgba(110,130,150,.11)";ctx.lineWidth=1;for(let i=0;i<4;i++){const yy=pad.t+ph*i/3;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(pad.l+pw,yy);ctx.stroke()}}
    data.forEach((p,i)=>{const up=p.c>=p.o,col=up?settings.upColor:settings.downColor,xx=x(i),yo=y(p.o),yc=y(p.c);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xx,y(p.h));ctx.lineTo(xx,y(p.l));ctx.stroke();const top=Math.min(yo,yc),bh=Math.max(1,Math.abs(yc-yo));ctx.fillRect(xx-cw/2,top,cw,bh)});
    const last=data.at(-1);ctx.strokeStyle="rgba(216,255,114,.45)";ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(pad.l,y(last.c));ctx.lineTo(pad.l+pw,y(last.c));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#7b8797";ctx.font="9px system-ui";ctx.textAlign="left";ctx.fillText("NVDA · 15m",8,h-5);ctx.textAlign="right";ctx.fillText(fmtPrice(last.c),w-8,h-5);
  }

  function renderAll(){renderInstrument();renderAssetList();renderAccount();renderActivity();updateTicket();if($("portfolioView").classList.contains("active"))renderPortfolio()}

  function tick(){processMarketLogic();renderAll();if($("terminalView").classList.contains("active")){chartData=candleSeries(BY_SYMBOL.get(state.selected),state.timeframe,chartData.length||TF_COUNT[state.timeframe]);drawChart()}if(Date.now()%30000<CFG.marketTickMs)syncGlobalMarket();const s=portfolioSnapshot();const last=state.equityHistory.at(-1);if(!last||Date.now()-last.t>60000){state.equityHistory.push({t:Date.now(),v:s.equity});state.equityHistory=state.equityHistory.slice(-500);save()}}

  function openTutorial(){tutorialStep=0;$("tutorialOverlay").classList.remove("hidden");renderTutorial()}
  function renderTutorial(){const t=tutorials[tutorialStep];$("tutorialContent").innerHTML=`<span class="micro-label">STEP ${tutorialStep+1} OF ${tutorials.length}</span><h3>${t.title}</h3><p>${t.body}</p>`;$("tutorialProgress").innerHTML=tutorials.map((_,i)=>`<i class="${i<=tutorialStep?"active":""}"></i>`).join("");$("tutorialPrev").disabled=tutorialStep===0;$("tutorialNext").textContent=tutorialStep===tutorials.length-1?"Finish":"Next"}
  $("tutorialNav").addEventListener("click",openTutorial);$("openTutorialHome").addEventListener("click",openTutorial);$("openTutorialSettings").addEventListener("click",()=>{$("settingsBackdrop").classList.add("hidden");openTutorial()});$("closeTutorial").addEventListener("click",()=>$("tutorialOverlay").classList.add("hidden"));$("tutorialPrev").addEventListener("click",()=>{tutorialStep=Math.max(0,tutorialStep-1);renderTutorial()});$("tutorialNext").addEventListener("click",()=>{if(tutorialStep>=tutorials.length-1)$("tutorialOverlay").classList.add("hidden");else{tutorialStep++;renderTutorial()}});

  function applySettings(){document.body.dataset.theme=settings.theme;document.documentElement.style.setProperty("--up",settings.upColor);document.documentElement.style.setProperty("--down",settings.downColor);$("upColor").value=settings.upColor;$("downColor").value=settings.downColor;$("chartBg").value=settings.chartBg||"#0a0e13";$("gridToggle").checked=settings.grid;$("crosshairToggle").checked=settings.crosshair;$("compactToggle").checked=settings.compact;$("chartType").value=settings.chartType;$("overlaySelect").value=settings.overlay;qsa("#themePresets button").forEach(b=>b.classList.toggle("active",b.dataset.theme===settings.theme))}
  $("settingsButton").addEventListener("click",()=>$("settingsBackdrop").classList.remove("hidden"));$("closeSettings").addEventListener("click",()=>$("settingsBackdrop").classList.add("hidden"));$("settingsBackdrop").addEventListener("click",e=>{if(e.target===$("settingsBackdrop"))$("settingsBackdrop").classList.add("hidden")});qsa("#themePresets button").forEach(b=>b.addEventListener("click",()=>{settings.theme=b.dataset.theme;applySettings();save();drawChart()}));$("upColor").addEventListener("input",e=>{settings.upColor=e.target.value;applySettings();save();drawChart();drawHero()});$("downColor").addEventListener("input",e=>{settings.downColor=e.target.value;applySettings();save();drawChart();drawHero()});$("chartBg").addEventListener("input",e=>{settings.chartBg=e.target.value;applySettings();save();drawChart();drawHero()});$("gridToggle").addEventListener("change",e=>{settings.grid=e.target.checked;save();drawChart();drawHero()});$("crosshairToggle").addEventListener("change",e=>{settings.crosshair=e.target.checked;save()});$("compactToggle").addEventListener("change",e=>{settings.compact=e.target.checked;document.body.classList.toggle("compact",settings.compact);save()});
  function resetAccount(cash){state=initialState(cash);save();$("depletedOverlay").classList.add("hidden");refreshChart();renderAll();renderPortfolio();showToast(`Paper account restarted with ${fmtMoney(cash)}`,"good")}
  $("resetSimulation").addEventListener("click",()=>{if(confirm("Reset your local paper account? The shared simulated market will not reset.")){resetAccount(CFG.startingCash);$("settingsBackdrop").classList.add("hidden")}});$("restart100").addEventListener("click",()=>resetAccount(100000));$("restart10").addEventListener("click",()=>resetAccount(10000));$("closeDepleted").addEventListener("click",()=>$("depletedOverlay").classList.add("hidden"));

  function restoreUi(){const a=BY_SYMBOL.get(state.selected)||ASSETS[0];state.selected=a.symbol;state.category=a.category;qsa("#assetTabs button").forEach(b=>b.classList.toggle("active",b.dataset.category===state.category));qsa("#timeframes button").forEach(b=>b.classList.toggle("active",b.dataset.tf===state.timeframe));qsa("#activityTabs button").forEach(b=>b.classList.toggle("active",b.dataset.pane===state.activityPane));qsa("#directionToggle button").forEach(b=>b.classList.toggle("active",b.dataset.side===state.tradeSide));qsa("#investSideToggle button").forEach(b=>b.classList.toggle("active",b.dataset.side===state.investSide));qsa("#tradeOrderTypes button").forEach(b=>b.classList.toggle("active",b.dataset.type===state.tradeType));qsa("#investOrderTypes button").forEach(b=>b.classList.toggle("active",b.dataset.type===state.investType));$("tradeTriggerRow").classList.toggle("hidden",state.tradeType==="market");$("investTriggerRow").classList.toggle("hidden",state.investType==="market");setMode(state.mode)}

  applySettings();restoreUi();
  syncGlobalMarket(true).finally(()=>{refreshChart();renderAll();renderHero()});
  requestAnimationFrame(()=>{resizeChart();renderHero()});
  window.addEventListener("load",()=>{resizeChart();renderHero()});
  if(window.ResizeObserver){const ro=new ResizeObserver(()=>{if($("homeView").classList.contains("active"))drawHero();if($("terminalView").classList.contains("active"))drawChart()});ro.observe($("homeView"));ro.observe($("chartStage"));}
  marketTimer=setInterval(tick,CFG.marketTickMs);
  heroTimer=setInterval(renderHero,15000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){syncGlobalMarket(true);refreshChart();renderAll();renderHero()}});
  window.addEventListener("beforeunload",save);
})();
