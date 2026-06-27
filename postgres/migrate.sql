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

-- v5.41.2: node-level AI chat conversations
ALTER TABLE llm_conversations ADD COLUMN IF NOT EXISTS node_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_llm_conversations_node_id ON llm_conversations(node_id) WHERE node_id IS NOT NULL;

-- v5.45.0: model override per conversation (Ollama multi-model support)
ALTER TABLE llm_conversations ADD COLUMN IF NOT EXISTS model_override TEXT DEFAULT NULL;

-- v5.48.0: per-user map metadata (group, color, icon) — synced to DB
CREATE TABLE IF NOT EXISTS map_user_meta (
  map_id     UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grp        TEXT NOT NULL DEFAULT '',
  color      TEXT NOT NULL DEFAULT '',
  icon       TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (map_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_map_user_meta_user ON map_user_meta(user_id);
