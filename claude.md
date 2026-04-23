# Project: NodeMap

A production-grade node-based visual architecture + note-taking system.

# Core Idea
- Canvas-based system with draggable nodes and connections
- Used for architecture design, note-taking, and system visualization
- LLM-aware: can export and interact with AI models

# Features (Current Scope)
- Node canvas with drag/drop
- Node types (network, hardware, software, notes, etc.)
- Node properties + custom fields
- Connections (arrows, labeled flows)
- Node library with categories
- Grouping / architecture flows
- LLM-friendly export
- AI chat integration
- Quick capture mode (Space → instant node)
- Mobile compatibility

# Tech Stack
Frontend:
- React (Vite)
- Canvas + SVG rendering

Backend:
- Node.js (Express)
- PostgreSQL (primary DB)
- Redis (sessions, caching)

Infra:
- Docker + docker-compose
- Nginx reverse proxy

# Architecture Principles
- Stateless backend (scale horizontally)
- Secure API (JWT + refresh tokens)
- RBAC system:
  - Owner
  - Admin
  - Editor
  - Viewer

# Security
- JWT auth (short-lived access + refresh tokens)
- bcrypt password hashing
- Helmet + rate limiting
- API keys encrypted (AES-256-GCM)
- Backend-only LLM access (no keys in frontend)

# LLM System
- Multi-provider support:
  - OpenAI
  - Anthropic
  - Gemini
  - Ollama
  - Groq / Mistral
- Backend proxy for all LLM calls
- Per-map chat history
- Canvas auto-injected into context

# UX Features
- Quick capture (Space → type → Enter)
- AI chat panel
- Export to:
  - JSON
  - LLM-readable structured text

# Constraints
- Must run in homelab (Docker)
- Mobile-friendly UI
- Scalable architecture
- Minimize token usage
- Avoid unnecessary rewrites

# Coding Rules
- Do NOT rewrite full files unless required
- Keep changes minimal and targeted
- Maintain architecture consistency
- Prefer modular components
- Backend handles all security

# Important
This file is the single source of truth.
Claude must rely on this instead of asking for context.
