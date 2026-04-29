-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Roles enum ────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE map_permission AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'viewer',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  avatar_color  TEXT NOT NULL DEFAULT '#6C63FF',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

-- ── Refresh tokens ────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  user_agent  TEXT,
  ip_address  INET
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ── Maps ──────────────────────────────────────────────────────
CREATE TABLE maps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL DEFAULT 'Untitled Map',
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  thumbnail   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maps_owner_id ON maps(owner_id);

-- ── Map nodes ─────────────────────────────────────────────────
CREATE TABLE map_nodes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id        UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  node_type     TEXT NOT NULL,
  title         TEXT NOT NULL,
  x             REAL NOT NULL DEFAULT 0,
  y             REAL NOT NULL DEFAULT 0,
  w             REAL NOT NULL DEFAULT 210,
  h             REAL NOT NULL DEFAULT 88,
  properties    JSONB NOT NULL DEFAULT '{}',
  custom_props  JSONB NOT NULL DEFAULT '{}',
  notes         TEXT NOT NULL DEFAULT '',
  z_index       INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_map_nodes_map_id ON map_nodes(map_id);

-- ── Map edges ─────────────────────────────────────────────────
CREATE TABLE map_edges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id       UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  from_node    UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
  to_node      UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT '',
  style        TEXT NOT NULL DEFAULT 'arrow',
  color        TEXT NOT NULL DEFAULT '#58a6ff',
  from_anchor  JSONB,
  to_anchor    JSONB,
  mid_off      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_map_edges_map_id ON map_edges(map_id);

-- ── Map collaborators (RBAC per map) ──────────────────────────
CREATE TABLE map_collaborators (
  map_id      UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission  map_permission NOT NULL DEFAULT 'viewer',
  invited_by  UUID REFERENCES users(id),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (map_id, user_id)
);

-- ── Audit log ─────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT,
  resource_id UUID,
  ip_address  INET,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ── Updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_maps_updated_at
  BEFORE UPDATE ON maps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_map_nodes_updated_at
  BEFORE UPDATE ON map_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── LLM Providers (per user) ──────────────────────────────────
CREATE TABLE llm_providers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,                -- "My GPT-4", "Local Ollama"
  provider     TEXT NOT NULL,               -- openai | anthropic | gemini | ollama | groq | mistral | custom
  base_url     TEXT NOT NULL,               -- https://api.openai.com/v1
  model        TEXT NOT NULL,               -- gpt-4o, claude-sonnet-4-5, etc.
  api_key_enc  TEXT,                        -- AES-256-GCM encrypted, NULL for Ollama
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_providers_user_id ON llm_providers(user_id);

-- ── LLM Conversations (per map) ───────────────────────────────
CREATE TABLE llm_conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id       UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL REFERENCES llm_providers(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'New Chat',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  group_boxes  JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_llm_conversations_map_id ON llm_conversations(map_id);

-- ── LLM Messages ─────────────────────────────────────────────
CREATE TABLE llm_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES llm_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  tokens_used     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_messages_conv_id ON llm_messages(conversation_id);

-- ── Map Version History ───────────────────────────────────────
CREATE TABLE map_versions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id      UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT '',
  nodes_json  JSONB NOT NULL DEFAULT '[]',
  edges_json  JSONB NOT NULL DEFAULT '[]',
  node_count  INTEGER NOT NULL DEFAULT 0,
  edge_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_map_versions_map_id ON map_versions(map_id);

-- ── Migration: add anchor columns to map_edges if not exists ──
ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS from_anchor JSONB;
ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS to_anchor   JSONB;
ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS mid_off     JSONB;

-- ── Map change log (collaboration history) ───────────────────────────
CREATE TABLE IF NOT EXISTS map_changelog (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id      UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT,
  action      TEXT NOT NULL,  -- 'add_node','delete_node','move_node','edit_node','add_edge','delete_edge'
  target_id   TEXT,           -- node/edge id affected
  target_label TEXT,          -- node title or edge label for readability
  meta        JSONB,          -- extra context
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_map_changelog_map ON map_changelog(map_id, created_at DESC);

ALTER TABLE llm_conversations ADD COLUMN IF NOT EXISTS model_override TEXT;
