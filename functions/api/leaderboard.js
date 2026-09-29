const MAX_NAME = 16;
const MAX_EQUITY = 1e12;
const STALE_MS = 30 * 24 * 60 * 60 * 1000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}
function cleanId(v) { return String(v || "").trim().slice(0, 80); }
function cleanName(v) { return String(v || "").replace(/[^A-Za-z0-9 _-]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME); }
function cleanEquity(v) { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(MAX_EQUITY, n)) : NaN; }

async function list(env, playerId) {
  const now = Date.now();
  try { await env.MARKET_DB.prepare("DELETE FROM leaderboard_players WHERE updated_at < ?").bind(now - STALE_MS).run(); } catch {}
  const rows = await env.MARKET_DB.prepare(`
    SELECT player_id AS playerId, display_name AS name, equity, updated_at AS updatedAt
    FROM leaderboard_players
    ORDER BY equity DESC, updated_at ASC
    LIMIT 50
  `).all();
  const mapped = (rows.results || []).map((r, i) => ({ playerId: r.playerId, name: r.name, equity: Number(r.equity) || 0, updatedAt: Number(r.updatedAt) || now, rank: i + 1 }));
  let rank = null;
  if (playerId) {
    const me = await env.MARKET_DB.prepare("SELECT equity FROM leaderboard_players WHERE player_id = ?").bind(playerId).first();
    if (me) {
      const rankRow = await env.MARKET_DB.prepare("SELECT COUNT(*) + 1 AS rank FROM leaderboard_players WHERE equity > ?").bind(Number(me.equity) || 0).first();
      if (rankRow && Number.isFinite(Number(rankRow.rank))) rank = Number(rankRow.rank);
    }
  }
  return { rows: mapped, rank };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (!env.MARKET_DB) return json({ ok: false, configured: false, rows: [], rank: null, error: "D1 binding MARKET_DB is not configured." }, 503);
  if (request.method === "GET") {
    const playerId = cleanId(new URL(request.url).searchParams.get("playerId"));
    try { return json(await list(env, playerId)); } catch { return json({ ok: false, configured: true, rows: [], rank: null, error: "leaderboard unavailable" }, 500); }
  }
  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: "invalid json" }, 400); }
    const playerId = cleanId(body.playerId);
    const name = cleanName(body.name);
    const equity = cleanEquity(body.equity);
    if (playerId.length < 8 || name.length < 2 || !Number.isFinite(equity)) return json({ ok: false, error: "invalid player data" }, 400);
    const now = Date.now();
    try {
      await env.MARKET_DB.prepare(`
        INSERT INTO leaderboard_players(player_id, display_name, equity, updated_at)
        VALUES(?,?,?,?)
        ON CONFLICT(player_id) DO UPDATE SET
          display_name=excluded.display_name,
          equity=excluded.equity,
          updated_at=excluded.updated_at
      `).bind(playerId, name, equity, now).run();
      const data = await list(env, playerId);
      return json({ ok: true, configured: true, ...data });
    } catch { return json({ ok: false, configured: true, error: "leaderboard write failed" }, 500); }
  }
  return json({ error: "method not allowed" }, 405);
}
