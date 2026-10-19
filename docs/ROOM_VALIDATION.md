# Room build validation — 14 October 2026

## Scope

The latest requested deliverable is an HTML room foundation using the user's supplied image. Starting the game reveals the same behind-the-counter view. Customer generation and the earlier three-shift experiment are deliberately absent from this build. The retained earlier engine is for future development.

The single file `بازی.html` embeds the original 1088 × 736 PNG, Vazirmatn font and license, both translation catalogs, CSS and JavaScript. No external requests are used; the Content Security Policy disables network connections. The browser address displayed inside the game is fictional and never navigates anywhere.

## Automated checks executed

- **12 JavaScript room tests passed:** starting, no customer queue, interaction guards, all six discovered objects, tea cooldown, one-time print consumption, paper refill cap, bounded portal failures, USB/console completion, pausing, persistence, malformed saves and invalid intents.
- **7 HTML/content checks passed:** one-file offline packaging, unique element IDs, English/Persian keys and placeholders, translation references, DOM references, six hotspots with no customers, embedded font license.
- **10 earlier Python/content tests remain passing.** These cover the retained earlier gameplay foundation, not the room UI.
- Current JavaScript source passed syntax checks in the JavaScript runtime.

## Chrome checks executed

The game was served only on `127.0.0.1:8765` for browser testing through the Chrome skill. The test window was approximately 846 × 455 pixels.

- Opening screen visually inspected: Persian text joined correctly, image and font loaded, readable start button.
- Start button revealed the supplied shop image and the unobtrusive HUD.
- Computer hotspot opened the local portal. A retry produced the intended 502 result and incremented the visible attempt count.
- Files tab scan completed with the visible healthy-files result.
- Printing consumed one sheet (20 → 19), completed, and incremented test-page count (0 → 1).
- Tea reduced visible stress (21 → 13).
- English switching translated the HUD, object labels, dialogue and panels. English console panel was visually inspected.
- PS3 selection and boot test completed.
- Paperwork refill increased sheets (19 → 39).
- Entrance interaction described the empty street without spawning a customer.
- Pause/resume panel worked.
- DOM layout check found no horizontal overflow. The scene image reported natural width 1088 and the embedded font was ready.

The browser automation policy rejected direct navigation to a `file://` URL. That restriction was not bypassed. Browser interaction checks therefore apply to the localhost copy, which is byte-identical to the standalone deliverable. Direct file execution is supported by the self-contained design, but the automated direct-file navigation itself was not completed.

One captured console error originated from a separate `chrome-extension://…/popup.js`; it was not an error from the game. No game-origin JavaScript error was observed during these checks.

## Practical limits

Equipment state and preferences persist in browser storage when available. Transient running jobs are not resumed after a reload; a sheet already fed into the printer remains consumed. This version is room exploration before the first customer, with no shift countdown or campaign loss. Audio is synthesized and optional. The image is a static background with small light/steam/paper overlays; the objects have interaction zones rather than separate animated sprites.
