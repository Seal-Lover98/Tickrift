const paths=[
  ["/","2026-09-29"],
  ["/learn/paper-trading/","2026-09-22"],
  ["/learn/stock-market-simulator/","2026-09-22"],
  ["/learn/crypto-trading-simulator/","2026-09-22"],
  ["/learn/meme-coin-simulator/","2026-09-22"],
  ["/data-sources/","2026-09-22"],
  ["/privacy/","2026-09-22"],
  ["/terms/","2026-09-22"]
];
export async function onRequest({request}){const u=new URL(request.url);const origin=u.origin;const last="2026-09-22";const body=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(([path,last])=>`\n<url><loc>${origin}${path}</loc><lastmod>${last}</lastmod></url>`).join("")}\n</urlset>`;return new Response(body,{headers:{"content-type":"application/xml; charset=utf-8","cache-control":"public, max-age=3600"}})}
