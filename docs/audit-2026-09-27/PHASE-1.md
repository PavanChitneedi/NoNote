# Phase 1 implementation status

Local changes, 27 September 2026. Not deployed or pushed.

Verification: 137 backend tests and 198 frontend tests passed; ten backend audit regressions and three frontend export checks passed. Backend lint is clean; frontend lint has zero errors and 27 warnings. Production build passed with the existing large-chunk warning. Two frontend export checks still assert known defects; their passing is not evidence those defects are fixed.

Implemented:

- Effective map permission is returned to the desktop client; unknown permission strings fail closed. Viewer responses redact private new/legacy notes and nested credential fields in map reads, search, duplication and version detail (including its embedded snapshot).
- WebSocket join is completed before mutation access is enabled; repeated joins are ignored. Sender and recipient authorization/token validity is rechecked. Viewer mutations and unknown message types are rejected; node payloads are filtered per recipient.
- Admin PATCH protects owner accounts, including a write-time owner guard.
- Refresh tokens use SHA-256 of the full token, exact hash lookup and conditional single-use consumption in the rotation transaction. Legacy bcrypt refresh records require sign-in again after deployment.
- Empty saves delete removed nodes; valid edge IDs remain stable; duplicate IDs, external endpoints and foreign-map node/edge IDs are rejected. Conflict updates are scoped to the target map.
- Additive boot migrations add node description and map revision. Description is stored and copied during duplication. Saves lock the map and reject missing/stale revisions. The browser carries the revision read from the server; conflicts stop desktop retries with an explicit message.
- Desktop saves use current groups, serialize requests and avoid retries of superseded snapshots. Save scheduling is blocked until a map has loaded. Initial room snapshots are gated on loaded/editor state.
- Mobile maps translate node/edge field names, use UUIDs, preserve groups by omitting them from saves and surface save errors.
- Native export recursively strips secret-shaped property/custom-property keys; dashboard export preserves current note/privacy fields and groups.

Remaining work and validation boundaries:

- Credentials still live in legacy document properties for authorized editors. A server-only encrypted credential store and reference-based integration API is not implemented; viewer redaction is immediate containment, not that architecture.
- Document HTML/Markdown/PDF paths and full import/export round-trip migration still require the broader export work in the audit. Native export secret filtering is implemented; not every export issue is closed.
- Optimistic revision conflicts prevent silent stale writes; automatic merge, durable offline drafts and a conflict resolution UI are not implemented. A conflict requires copying local changes before reload. Live simultaneous edits must be tested before rollout.
- No PostgreSQL migration/restore drill or deployed-browser verification of these changes was possible from this checkout (Docker unavailable). The remote test instance is still the original version. Take and verify a backup before deploying migrations. Older clients without revision support cannot save against the updated backend and must reload together with the frontend deployment.
- Password-change session-wide revocation, encryption-key separation and operations/backup hardening remain follow-up work. These changes must not be represented as closing every audit finding or completing the full Phase 1 exit criteria.

The original audit is historical. Backend audit reproductions have been converted to desired-behavior regressions and expanded with foreign-ID, dangling-edge, description/group and stale-revision cases. Frontend export audit cases still intentionally reproduce the unaddressed HTML/Markdown issues; its native-export secret case is now a regression assertion.
