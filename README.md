# HS Logistics Frontend

The screens, styles, and browser code for HS Logistics. Start with [the frontend tracker](FRONTEND_TRACKER.md) and [the API contract](API_CONTRACT.md).

## Preview without backend access

From this folder run `python -m http.server 8765 --bind 127.0.0.1`. Open `http://127.0.0.1:8765/demo.html` for the interactive sample workflow or `/index.html` for the original product roadmap. The demo uses synthetic data and is separate from the live sign-in screen.

## Connect to the backend

The owner can run the separate backend with `HS_FRONTEND_DIR` set to this checkout. Open the backend URL on port 8766; it serves `signin.html` and the frontend assets alongside the API. The existing browser code uses relative `/api/` URLs and same-origin session cookies. A hosted deployment will need the same route layout or a reverse proxy. The backend does not need to be shared for frontend work on the demo, UI states, and mock API responses.

## Handoff

Keep Add bill, Questions and Records as the primary partner actions. Add optional inputs under a secondary action and retain the no-typing upload path. Update the tracker as each task ships. Verify on an Android-sized viewport and a real Android phone before calling a flow ready. Use synthetic bills and never commit real evidence, passwords or API keys.
