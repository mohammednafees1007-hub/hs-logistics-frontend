# Frontend delivery tracker

Handoff: 12 November 2026. “Implemented” means the UI is wired to the local API. Browser or device verification is listed separately.

| Area | Completed | Left |
|---|---|---|
| Partner home | Sign-in shell, partner/guest home, Add bill / Questions / Records layout | Accessibility and real-device acceptance |
| Session and recovery | Sign-in, logout, session-expiry checks, recovery controls | Test recovery with real partner setup and device sessions |
| Invitations and viewer controls | Partner invite, named viewer invite, acceptance, suspend viewer | Browser/device walkthrough; invite usability |
| Add bill | Multiple photo/PDF selection, limits, save state, server receipt and failure handling | Test camera/gallery/PDF pickers on Android; optional Tamil audio and text, interrupted upload recovery |
| Questions | Interactive sample flow; per-bill clarification, reply and resolution APIs documented | Wire real questions in bill detail and design the cross-bill inbox |
| Records and review | Partner-only historical Records viewer with sheet filters and original downloads; verified in Edge at mobile width with synthetic data | Wire new bill receipt list and review actions; Android acceptance |
| Jobsheets, expenses and payments | Design examples and available backend API contract | Build real screens and forms from the documented routes |
| Viewer sharing | Guest shell and simulated countdown; scope, expiry, revocation and access history APIs documented | Wire partner controls, viewer countdown, watermark and access history |
| Reports and assistant | Partner summary API documented | Wire summary; Tamil/English assistant still pending |
| Release | Standalone Windows window, installable web manifest and signed Android preview build | Shared HTTPS backend, real Android verification and production acceptance |

Start with the Add bill Android walkthrough, then design the real Records review states using sample fixtures. Coordinate new endpoint shapes with the backend owner before wiring them. Backend security checks and AI processing are owned in the separate backend repository.
