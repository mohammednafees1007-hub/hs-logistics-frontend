# Frontend delivery tracker

Handoff: 12 November 2026. “Implemented” means the UI is wired to the local API. Browser or device verification is listed separately.

| Area | Completed | Left |
|---|---|---|
| Partner home | Sign-in shell, partner/guest home, Add bill / Questions / Records layout | Accessibility and real-device acceptance |
| Session and recovery | Sign-in, logout, session-expiry checks, recovery controls | Test recovery with real partner setup and device sessions |
| Invitations and viewer controls | Partner invite, named viewer invite, acceptance, suspend viewer | Browser/device walkthrough; invite usability |
| Add bill | Multiple photo/PDF selection, limits, save state, server receipt and failure handling | Test camera/gallery/PDF pickers on Android; optional Tamil audio and text, interrupted upload recovery |
| Questions | Interactive sample flow in demo | Connect real clarification inbox, replies and evidence links when API ships |
| Records and review | Sample bill, trips and review in demo; read-only submissions and draft endpoints are documented | Connect real receipt list and draft statuses now; wire correction and approval when write APIs ship |
| Jobsheets, expenses and payments | Design examples | Real screens, forms, validation and reporting once APIs exist |
| Viewer sharing | Guest shell and simulated countdown | Real scoped access, revocation, expiry, watermark and audit views |
| Reports and assistant | Product roadmap | Reports, Tamil/English Q&A, citations and missing-data states |
| Release | Local static preview and local API integration | Hosted connection, mobile/browser verification and production acceptance |

Start with the Add bill Android walkthrough, then design the real Records review states using sample fixtures. Coordinate new endpoint shapes with the backend owner before wiring them. Backend security checks and AI processing are owned in the separate backend repository.
