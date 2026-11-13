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
| GET /api/visible-records | — | `{records: [{submission_id, expires}], server_time}` for the signed-in viewer |

Submission reads are partner-only. Processing status is `queued`, `running`, `draft_ready` or `failed`. A returned draft contains nullable `vendor`, `bill_date`, `category`, `total_minor` and `currency`. Submission detail includes a nullable `version`; both list and detail include nullable `review_status` (`needs_review`, `approved` or `rejected`). Each file entry has `position`, `filename`, `media_type` and `checksum`. Pass `next_before` to fetch the next page, stopping when it is null.

An upload receipt confirms that the originals were saved. Use 401 to return to sign-in, 403 for denied access, 404 for a missing or out-of-scope record, 409 for a conflicting write, 413 for an oversized upload, and 429 with `Retry-After` for rate limits. Validation errors include a JSON `detail` field. Epoch times are seconds. To retry an upload after a lost response, send the same optional UUID `Idempotency-Key` header and the same ordered files and names.

## Bill review and clarifications

Routes below are relative to `/api/submissions/{id}`. Writes use the signed-in partner session and `X-HS-Request: 1`.

| Request | JSON body or query |
|---|---|
| GET /files/{position} | Zero-based file position. Returns original image inline or PDF attachment. |
| POST /manual-draft | `fields` object with all five draft keys. Available after extraction fails. |
| PATCH /draft | `version` and `fields` with only the keys to correct. Returns new version and draft. |
| POST /approve | `version`. Requires complete fields and resolved questions. |
| POST /reject | `version` and `reason`. Returns rejected version and reason. |
| GET /review-history | Optional `limit` and `after`. Returns `events` and `next_after`. |
| GET /processing-history | Returns `status`, `attempts` and `history`. |
| GET /questions | Optional `limit` and `after`. Returns `questions` and `next_after`. |
| POST /questions | `version` and `question`. |
| GET /questions/{question_id}/replies | Optional `limit` and `after`. Returns `replies` and `next_after`. |
| POST /questions/{question_id}/replies | `reply`. |
| POST /questions/{question_id}/resolve | `reply_id`. Selects one reply explicitly. |

Question entries include `id`, `version`, `question`, `partner_id`, `created`, `status` and nullable `resolution`. Replies include `id`, `reply`, `partner_id` and `created`. Resolution records the reply ID, resolving partner and timestamp. Review history retains original, corrected, approved and rejected snapshots with version, actor and time, plus a reason for rejection.

## Timed viewer access

| Request | Contract |
|---|---|
| POST /api/viewer-grants | Partner sends `viewer_id`, `minutes` (2 or 5), and `submission_ids` (approved bills). Returns scope and expiry. |
| GET /api/guests/{id}/grants | Partner lists grants. Optional `include_inactive=true`. |
| POST /api/viewer-grants/{id}/revoke | Partner revokes one grant. |
| GET /api/guests/{id}/access-history | Partner reads served and denied access events. Optional `limit` and `after`. |
| GET /api/visible-records/{id} | Viewer reads approved `record`, file metadata, `expires` and `server_time`. |
| GET /api/visible-records/{id}/files/{position} | Viewer retrieves an original in the active grant. |

Use server time to display the countdown, clear the view when the grant expires, and recheck access when reopening the view. Expiry and revocation are enforced by the API on each read.

## Jobsheets, payments, expenses and reports

Money uses integer paise. Dates use YYYY-MM-DD. List endpoints support `limit` and the opaque `before` cursor returned as `next_before`.

| Request | Contract |
|---|---|
| POST /api/jobsheets | `job_date`, `customer`, `route`, `lines`, optional `printed_total_minor`. Each line uses `basis` (trip or tonne), `quantity` (integer trips or decimal tonne string) and `rate_minor`. |
| GET /api/jobsheets or /api/jobsheets/{id} | Jobsheet list or detail. Detail includes linked bills, payments and balance. |
| PATCH /api/jobsheets/{id} | `version` and `fields` containing the complete corrected creation payload. |
| POST /api/jobsheets/{id}/approve | `version`, with `reason` required if the printed amount differs from the calculation. |
| GET /api/jobsheets/{id}/history | Version history with `limit` and `after`. |
| POST /api/jobsheets/{id}/bills | `submission_id` of an approved bill. |
| POST /api/payments | Client UUID `id`, `paid_date`, `customer`, `amount_minor`, and `allocations` (array of jobsheet ID and paise amount, or empty). |
| GET /api/payments or /api/payments/{id} | Payment list or detail including allocations and unallocated amount. |
| POST /api/payments/{id}/allocations | `jobsheet_id` and `amount_minor` to allocate unused money. |
| POST /api/expenses | Approved `submission_id`, `scope` (truck or company), optional `reference`. |
| GET /api/expenses or /api/expenses/{id} | Expense list or detail including settlements, outstanding amount and partner amount due. |
| POST /api/expenses/{id}/settlements | Client UUID `id`, `paid_date`, `amount_minor`, `source` (company or partner) and `funded_by` (partner ID or null for company). |
| POST /api/expenses/{id}/settlements/{settlement_id}/reimbursements | Client UUID `id`, `paid_date` and `amount_minor`. |
| GET /api/reports/summary | Optional inclusive `start` and `end`. Returns jobs, expenses, payments and customers. Balances use all transactions against the selected records at read time. |
