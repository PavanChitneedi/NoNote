# UI Usage Rules

These rules are enforced to prevent UI drift and keep the design system coherent.

## Required

- Use shared primitives from `src/components/ui/uiPrimitivesV2.jsx`.
- Use token-backed values only (`var(--...)`) for color, spacing, radius, motion, and elevation.
- Use shared motion tokens:
  - `var(--motion-transition-interactive)`
  - `var(--motion-transition-layout)`
- Use shared elevation tokens (`--elevation-level0..3`, `--elevation-focus`, `--elevation-insetActive`).

## Forbidden

- Inline style objects in feature components (`style={{...}}`).
- Direct `boxShadow` literals that do not use elevation/shadow tokens.
- Direct `transition` literals that do not use shared motion tokens.
- One-off raw control styling instead of primitives.

## Validation

- `npm run lint:ui-consistency` - hard no-regression guard on core surfaces.
- `npm run lint:ui-usage-warn` - project-wide warnings for rule violations.
- `npm run lint:ui-rules` - full UI rules check.
