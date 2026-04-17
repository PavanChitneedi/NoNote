-- ── Safe migrations for existing installs ───────────────────────
-- All statements use IF NOT EXISTS / DO NOTHING so safe to re-run.

-- v4.x anchors
ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS from_anchor JSONB;
ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS to_anchor   JSONB;
ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS mid_off     JSONB;

-- v5.8 group boxes
ALTER TABLE maps ADD COLUMN IF NOT EXISTS group_boxes JSONB NOT NULL DEFAULT '[]'::jsonb;

-- v5.11 map changelog
CREATE TABLE IF NOT EXISTS map_changelog (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id      UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT,
  action      TEXT NOT NULL,
  target_id   TEXT,
  target_label TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_map_changelog_map ON map_changelog(map_id, created_at DESC);
