CREATE TABLE IF NOT EXISTS market_impact (
  symbol TEXT PRIMARY KEY,
  impact REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  volume REAL NOT NULL DEFAULT 0,
  trades INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS processed_orders (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processed_orders_created ON processed_orders(created_at);


CREATE TABLE IF NOT EXISTS leaderboard_players (
  player_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  equity REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_equity ON leaderboard_players(equity DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_updated ON leaderboard_players(updated_at DESC);
