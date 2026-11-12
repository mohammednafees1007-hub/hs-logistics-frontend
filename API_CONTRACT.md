# Local frontend API contract

Use relative URLs and same-origin credentials. State-changing calls send `X-HS-Request: 1`. JSON requests use `Content-Type: application/json`. For a multipart upload, let the browser set the content type and boundary. The server sets the HTTP-only session cookie. Do not store a session token in JavaScript or local storage.

| Request | Request body | Success response |
|---|---|---|
| POST /api/login | `login`, `password`, optional boolean `remember` | `{ok: true}` + session cookie |
| GET /api/session | — | `id`, `login`, `display_name`, `role`, `expires`, `server_time`, `idle_expires` |
| POST /api/logout or /api/logout-all | Empty object | `{ok: true}` + cleared cookie |
| POST /api/partner-invitations | `password` | `code`, `expires` |
| POST /api/partner-invitations/accept | `code`, `login`, `name`, `password` | `{ok: true}`; sign in separately |
| POST /api/guest-invitations | `name`, `password` | `code` (starts with `g.`), `expires` |
| POST /api/guest-invitations/accept | `code`, `login`, `password` | `{ok: true}`; sign in separately |
| GET /api/guests | — | `{guests: [{id, login, display_name}]}` |
| POST /api/guests/{guest_id}/suspend | `password` | `{ok: true}` |
| POST /api/recovery/request | `login` | `detail` |
| GET /api/recovery/inbox | — | Array of pending recovery requests |
| POST /api/recovery/issue | `login`, `password` | Recovery code and expiry |
| POST /api/recovery/reset | `login`, `code`, `password` | `detail` + cleared cookie |
| POST /api/submissions | Repeated multipart `files` fields (1–8 images/PDFs; max 10 MiB each, 32 MiB total) | `{submission_id, file_count}` |
| GET /api/visible-records | — | Currently `{records: [], feature_status: "not_implemented"}` |

An upload receipt means the originals were saved, not that AI finished or a bill was approved. Use 401 to return to sign-in, 403 for denied access, 413 for an oversized upload, and 429 with `Retry-After` for rate limits. Validation errors have a JSON `detail` field. Epoch times are seconds. Clarifications, draft review and scoped viewer records do not have public contracts yet.
