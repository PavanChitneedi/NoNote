# INSTRUCTIONS.md — NoNote Project Bootstrap
> When Pavan says "read the instructions file" or "get started" or "load context",
> follow every step in this file before responding to anything else.

---

## Step 1 — Read these files IN ORDER

```
1. INSTRUCTIONS.md        ← you are here
2. CLAUDE.md              ← project overview, stack, rules, owner context
3. docs/ARCHITECTURE.md   ← component tree, API, DB schema, CSS vars
4. docs/SKINS.md          ← skin/theme/design system (most complex part)
5. docs/FEATURES.md       ← full feature inventory
6. docs/TASKS.md          ← current tasks, backlog, in-progress work
```

Read all six before writing a single line of code or making any suggestions.

---

## Step 2 — Confirm what you know

After reading, reply with this exact summary (fill in current values):

```
✅ Context loaded — NoNote vX.X.X

Skin system: [X] skins, [X] themes, [X] designs
Last change: [last entry from TASKS.md]
Open tasks: [count] pending, [count] in-progress

Ready. What are we working on?
```

---

## Step 3 — Before every coding session

1. Check `docs/TASKS.md` — what's in-progress or blocked?
2. Check `CLAUDE.md` → "Current Version" — what version are we on?
3. Verify you understand the skin/theme/design separation (docs/SKINS.md) before touching appearance code
4. If Pavan mentions a bug with screenshots — look at the screenshot carefully before assuming

---

## Step 4 — After every change

### Always do ALL of these before packaging:
- [ ] Run `cd /home/claude/NoNote/frontend && npm run build` — fix any errors
- [ ] Update `frontend/src/changelog.js` — prepend new version entry
- [ ] Update `CLAUDE.md` → "Current Version" field
- [ ] Update `docs/TASKS.md` → move completed items, add new ones
- [ ] Update any relevant section in `docs/FEATURES.md` if a feature changed
- [ ] Update `docs/SKINS.md` if skin/theme/design system changed
- [ ] Package as zip with correct version number (see CLAUDE.md for convention)

---

## Step 5 — Packaging (always this exact sequence)

```bash
# 1. Build
cd /home/claude/NoNote/frontend && npm run build

# 2. Package (replace X.X.X with actual version)
cd /tmp && rm -rf pack && mkdir pack
cp -r /home/claude/NoNote pack/nonote-vX.X.X
rm -rf pack/nonote-vX.X.X/.git \
       pack/nonote-vX.X.X/frontend/node_modules \
       pack/nonote-vX.X.X/frontend/dist \
       pack/nonote-vX.X.X/backend/node_modules
find pack/nonote-vX.X.X -name "*.bak*" -delete
cd /tmp/pack && zip -r /tmp/nonote-vX.X.X.zip nonote-vX.X.X/
cp /tmp/nonote-vX.X.X.zip /mnt/user-data/outputs/nonote-vX.X.X.zip

# 3. Present to Pavan
present_files /mnt/user-data/outputs/nonote-vX.X.X.zip
```

---

## Maintenance Rules (enforce these always)

### On EVERY version bump:
1. `CLAUDE.md` — update "Current version: vX.X.X" in the header
2. `changelog.js` — prepend new entry
3. `docs/TASKS.md` — update task statuses

### On EVERY new feature:
1. `docs/FEATURES.md` — add the feature under correct section
2. `docs/TASKS.md` — close the task, add any follow-ups

### On EVERY skin/theme/design change:
1. `docs/SKINS.md` — update skin table, theme table, or design table
2. If adding a new skin — follow the checklist in SKINS.md

### On EVERY architecture change:
1. `docs/ARCHITECTURE.md` — update component tree, API routes, DB schema

### Files must NEVER be out of date by more than one version.

---

## Communication Style (Pavan's preferences)

- **Concise** — no unnecessary elaboration, no padding
- **No apologies** — just fix it
- **Lead with what changed** — not why you're making the change
- **Token-efficient** — don't repeat the question back, don't summarize what you're about to do
- **Screenshot-first** — if there's a screenshot, analyze it before guessing
- **Ask if blocked** — rather than guessing wrong architecture

---

## Common Commands Pavan Uses

| Pavan says | Claude does |
|---|---|
| "read the instructions file" | Execute all 6 steps above |
| "get started" | Execute all 6 steps above |
| "load context" | Execute all 6 steps above |
| "continue" / "go ahead" | Resume the last in-progress task from TASKS.md |
| "package it" / "zip it" | Run packaging sequence, present zip |
| "increment last octet" | Bump patch version only |
| "increment minor" | Bump minor version |
| "update changelog" | Update changelog.js + TASKS.md |
| "push to git" | Remind that Pavan pushes to GitHub himself after receiving zip |

---

## Red Lines — Never Do These

- **Never set color hex values inside skin CSS** — use `var(--accent)`, `var(--bg)` etc.
- **Never set font or radius inside DesignContext** — only spacing vars
- **Never set spacing/padding inside skins** — only font/radius/shadow/effects
- **Never skip building** before packaging
- **Never skip changelog update** before packaging
- **Never use `localStorage`/`sessionStorage` in artifacts** — use React state
- **Never define React components inside another component's render** — causes remount bugs
- **Never use `zIndex` on the SVG edge layer** — DOM order handles z-stacking
