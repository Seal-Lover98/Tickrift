const INDEXABLE = [
  { path:'/', lastmod:'2026-09-17' },
  { path:'/learn/paper-trading/', lastmod:'2026-09-17' },
  { path:'/learn/long-term-investing/', lastmod:'2026-09-17' },
  { path:'/data-sources/', lastmod:'2026-09-17' },
  { path:'/privacy/', lastmod:'2026-09-17' },
  { path:'/terms/', lastmod:'2026-09-17' }
];

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === '/robots.txt') {
    return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
    });
  }

  if (url.pathname === '/sitemap.xml') {
    const urls = INDEXABLE.map(item => `  <url><loc>${escapeXml(url.origin + item.path)}</loc><lastmod>${item.lastmod}</lastmod></url>`).join('\n');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
      headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
    });
  }

  const upstream = await context.next();
  const headers = new Headers(upstream.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'DENY');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  if (url.protocol === 'https:') headers.set('strict-transport-security', 'max-age=31536000');
  if (upstream.status >= 400) headers.set('x-robots-tag', 'noindex, nofollow');
  headers.set('content-security-policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");

  const type = headers.get('content-type') || '';
  if (!type.includes('text/html')) return new Response(upstream.body, { status: upstream.status, headers });

  let html = await upstream.text();
  const canonical = url.origin + normalizePath(url.pathname);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${escapeAttr(canonical)}" />`);
  const socialImage = escapeAttr(url.origin + '/og-card.png');
  html = html.replace(/<meta property="og:image" content="\/og-card\.png"\s*\/>/i, `<meta property="og:image" content="${socialImage}" />`);
  html = html.replace(/<meta name="twitter:image" content="\/og-card\.png"\s*\/>/i, `<meta name="twitter:image" content="${socialImage}" />`);
  if (!/<link rel="canonical"/i.test(html)) {
    html = html.replace('</head>', `  <link rel="canonical" href="${escapeAttr(canonical)}" />\n</head>`);
  }
  return new Response(html, { status: upstream.status, headers });
}

function normalizePath(path) {
  if (path === '/') return '/';
  return path.endsWith('/') ? path : path + '/';
}
function escapeAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function escapeXml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
