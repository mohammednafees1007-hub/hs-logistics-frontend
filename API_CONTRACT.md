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
| GET /api/submissions | Optional query: `limit` 1–50 (default 25), `before` receipt cursor | `{submissions: [{submission_id, created, status, file_count}], next_before}` |
| GET /api/submissions/{submission_id} | — | `submission_id`, `created`, `status`, `attempts`, nullable `review_status`, nullable `draft`, `files` |
| GET /api/visible-records | — | Currently `{records: [], feature_status: "not_implemented"}` |

Submission reads are partner-only. Status is `queued`, `running`, `draft_ready` or `failed`. A returned draft contains nullable `vendor`, `bill_date`, `category`, `total_minor` and `currency`; `review_status` is `needs_review` when present. Each file entry has `position`, `filename`, `media_type` and `checksum`; there are no file bytes or public URLs. Pass `next_before` to fetch the next page, stopping when it is null.

An upload receipt means the originals were saved, not that AI finished or a bill was approved. Use 401 to return to sign-in, 403 for denied access, 404 for a missing receipt, 413 for an oversized upload, and 429 with `Retry-After` for rate limits. Validation errors have a JSON `detail` field. Epoch times are seconds. Clarifications, draft writes and scoped viewer records do not have public contracts yet.
