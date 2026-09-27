# Phase 1 implementation status

## Continuation — credential storage, exports and session revocation

This section supersedes the earlier checkpoint limitations below where explicitly stated. These continuation changes are local and not deployed.

- Integration configurations now use AES-256-GCM encrypted server records and opaque references. The stored destination and credential are resolved together, with ownership checks for standalone records and fresh map-editor checks for map records. Map reads and WS snapshots never return raw integration credentials, including to editors. Creating a map connection requires the node to have been saved first.
- Configure a stable, separate `INTEGRATION_ENCRYPTION_KEY` as 64 random hex characters. Back it up securely with the database; do not rotate it with JWT secrets. The Compose environment and `.env.example` document the setting. This change does not yet migrate the separate LLM-provider encryption scheme away from JWT-derived keys.
- Backend startup completes schema and legacy credential migration before listening. Map credentials migrate transactionally; changed map revisions advance; historical snapshot integration secrets are removed. Errors stop startup instead of being silently swallowed. Browser-only standalone connections ask before migration into the signed-in account. If migration fails, old browser records remain intact and an error is displayed; they are not silently erased or polled.
- Password changes increment `auth_version` atomically with the password update. Access authentication, refresh rotation and WS authorization reject older session versions. Disabling an account through admin PATCH also advances its version.
- Markdown, HTML and normal Word/PDF exports read current note bodies; HTML escapes user content. Publication exports omit private note bodies. Native exports retain authorized private note content and legacy notes while stripping integration/custom-property secrets. Native import preserves description/body/privacy and remaps IDs; group boxes are included in export/import and version snapshots.
- Integration HTTP requests have total timeouts and an 8 MB response limit. Probes accept GET/HEAD only. URL-embedded credentials and additional local IPv6 forms are rejected. Full DNS destination pinning is still an audit follow-up.

Latest local verification: 147 backend tests, 200 frontend tests, ten backend audit regressions and five frontend export regressions pass. Both linters have zero errors; frontend retains 26 warnings. Unlike the original audit, all current export audit assertions now assert desired behavior. Database migration, backup restore and deployed multi-user checks still require server access.

Test deployment gate:

1. Identify the disposable test checkout and inspect its Compose configuration and current Git/image versions. Do not run against production.
2. Stop writes and take a PostgreSQL custom-format backup without a shell pipeline that can hide errors. Confirm `pg_restore --list` succeeds; restore into a separate temporary database and verify representative map/note counts before migrating. Keep the original backup and encryption key outside version control.
3. Set `INTEGRATION_ENCRYPTION_KEY` only if not already present; never overwrite an existing key. Deploy matching backend/frontend from this branch after the backup is verified. Old clients must reload; legacy bcrypt refresh sessions must sign in again.
4. Confirm backend startup completes and health responds; inspect migration results without printing plaintext credentials. Exercise synthetic note create/edit/delete/reload, native round trip, group/version retention, viewer versus editor reads, simultaneous-save conflict, and password/session revocation.
5. Do not call real appliances during tests. Use synthetic integrations/mocked endpoints or explicitly provided disposable appliance targets. Verify reference access with separate users.
6. Retain the backup until accepted. Rollback after credential migration requires restoring the matching database backup and old images together; image-only rollback is insufficient. No production deployment or main-branch merge is authorized by this document.

## Earlier checkpoint (historical)

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

### Isolated server validation (2026-09-27)

- SSH verified to the authorized test host as `nonote-audit`, with pinned host fingerprint.
- Saved a pre-change database backup on that host and verified its archive directory. Restore validation is still pending user approval.
- Built the backend image and started a separate, internal-only Docker network with fresh PostgreSQL/Redis and generated test credentials. The running application and its database were not changed.
- Real PostgreSQL API checks passed for note body/description persistence, legacy integration credential conversion without returning the raw token, stale revision rejection, and deleting the last node.
- These checks found missing SQL parameter markers in both password update paths. Corrected both; real database checks now pass for self-service/admin password changes and invalidation of old access/refresh tokens. The focused users suite passes (22 tests).
- The validation container contains the corrected source; its image must be rebuilt before deployment. Full frontend validation against this backend and restore/migration checks remain pending.
- Automatic approval review rejected copying the existing backend environment into a persistent file. No existing runtime secrets were copied; the isolated stack uses newly generated credentials.

### Backup restore and migration verification

With explicit user approval, restored `before-phase1.dump` into `nonote_restore_verify` in the separate validation PostgreSQL container using `--no-owner --no-privileges`. The restored copy uses fresh validation credentials; no running-container environment was copied. The rebuilt backend started successfully against that copy and remained healthy after a second startup (migration rerun).

Record counts before and after migration were unchanged: 8 maps, 65 nodes, 54 edges, and 82 saved versions. This confirms record-count preservation, not a field-by-field content comparison. The restored data contains no legacy integration configurations, so the earlier synthetic real-database check supplies coverage for credential conversion. Full browser UI verification remains outstanding. The original app/database remains unchanged.

### Browser verification against isolated PostgreSQL

Verified the current frontend at localhost:4179 through an SSH tunnel to the synthetic validation backend. The original deployed app was not changed.

- Created a notebook and captured a note through the Space quick-capture UI.
- Edited title/description and a multiline body; reloaded and verified the description and complete body persisted.
- Downloaded Markdown through the export menu and inspected the saved file: title, description, and both body lines are present. The browser download-event observer timed out, but the downloaded file was verified directly.
- At a 390x844 phone viewport, discovered that the Notes sheet only displayed legacy note entries. Added a current-body editor preserving the existing privacy flag and legacy entries. Edited the body from the phone layout, saved, reloaded, and verified all three lines persisted.
- Evidence: `ui-desktop-verified.png` and `ui-mobile-verified.png`. Phone secondary labels have weak contrast in the current light theme and reaching the body takes multiple taps; these remain design follow-ups.
- Frontend lint passes with the existing 26 warnings and no errors. This is focused note-flow validation, not exhaustive coverage of all exports, collaboration, integrations, or theme combinations.
