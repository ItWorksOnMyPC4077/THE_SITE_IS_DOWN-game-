# Customer edition validation — 2026-10-14

## Implemented

- Both original PNGs from `image/` are embedded in the standalone HTML, used at the counter and in customer conversations.
- Sequential orders: pension-document selection, contrast preparation and two copies; fictional account recovery, two failed portal attempts followed by success, and one receipt.
- Orders only pay on delivery (30,000 + 45,000 tomans). Repeat delivery cannot pay twice.
- Persistent objective card, station shortcuts, current-task controls, localized dialogue, shift report, replay, Persian RTL and English LTR.
- Original v1 equipment saves migrate to v2. In-progress print, recovery and retry jobs resume without charging paper twice.
- Existing room equipment remains available. Test prints do not fulfill customer orders.

## Automated checks

`python web/build.py` succeeded. Both standalone outputs are identical and contain their font, scene, portraits, scripts and translations without external dependencies.

`node --test web/room.test.cjs web/customer.test.cjs web/customer-app.test.cjs`: 27 passed. These cover both complete orders, state transitions, wrong-document feedback, insufficient paper, pause, occupied equipment, payment idempotence, save migration, restore during jobs, malformed saves, general equipment isolation, translation-key parity, byte-for-byte preservation of the original portraits, and syntax of the embedded scripts. Three application integration tests use a small DOM stub to execute the real UI event handlers through both deliveries, language toggling, menu return and saved-order restoration. They do not validate browser layout or rendering.

`node --check web/room.js`: passed.

## Browser verification limitation

Chrome interaction was requested and the installed Chrome skill was read. Its required browser execution tool and discovery tool are not exposed in this session. No Chrome screenshot, real browser interaction or responsive visual pass was performed for this customer update. Previous room-only browser checks do not validate these changes.

Manual visual pass still needed: Start → portrait and order card; complete both orders; switch FA/EN; narrow window; pause; refresh during printing; finish shift; replay. The portrait presentation uses CSS feathering, preserving the original raster files.
