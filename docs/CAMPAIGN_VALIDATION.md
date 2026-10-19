# Five-customer campaign — 2026-10-15

Current build: `web/build.py`, `web/campaign-engine.js`, `web/missions.json`, `web/room.js`, `web/room.html`, `web/room.css`, `web/customer.css`, and bilingual string catalogs. `web/create_campaign.py` is the editable content authoring script that generates `missions.json`. `room-engine.js` and `customer.test.cjs` preserve the previous two-customer engine and its legacy checks.

## Mission catalog

| Customer | Mission 1 | Mission 2 | Mission 3 |
| --- | --- | --- | --- |
| Mr. Rahimi | Pension copies | Organized PDF archive | Pension appointment |
| Mrs. Naderi | Subsidy inquiry | Parcel tracking | Keepsake photo |
| Arin | PS4 inspection and bargaining | Controller drift | Save backup and disc installation |
| USB customer | Inspect and quarantine | Consented sample recovery | Refuse alteration; print original receipt |
| Sara | Exam registration | Program-code correction | Receipt verification and printing |

Each mission has three authored dialogue lines in Persian and English, three equipment tasks, a separate delivery/payment, and a recorded completion. Five original portraits are embedded without modification. All operations are fictional and offline.

Dialogue appears automatically on the scene. Clicking advances one line, then accepts the order. During work it provides a shortcut to the current station. After delivery, two farewell lines lead to the next mission. Enter/Space work through the native button. Menus and pause hide the bubble. Language toggling keeps the current line; autosave preserves it.

## Verification

Build: `python web/build.py`.

Tests: `node --test web/room.test.cjs web/campaign.test.cjs web/customer-app.test.cjs`.

Result: 27 tests passed. The rebuilt ZIP was checked for integrity and its HTML/guide entries match the current files.

Coverage: all fifteen missions and payouts; all equipment types through real UI event handlers in a DOM stub; automatic dialogue and next-line clicks; language changes and line persistence; pause/menu; wrong-choice feedback; portal retries; paper shortage and print restoration; v2 migration of both completed and active orders; duplicate payment prevention; invalid saves; five portrait byte comparisons; translation parity; embedded-script syntax; identical standalone and preview files.

Chrome visual verification remains unavailable in this session because the Chrome skill's required execution/discovery tools are not exposed. DOM-stub tests are not visual/browser tests. Prior screenshots do not verify the new overlay. A real viewport pass is still needed for portrait/bubble placement, narrow screens and mouse interactions.
