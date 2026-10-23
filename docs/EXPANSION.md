# Customer expansion — October 23, 2026

> Historical 22-order edition. The current three-day, 33-order build is described in [THREE_DAYS.md](THREE_DAYS.md).

The current build has 11 illustrated customers and 22 paid mission opportunities, with exactly two separate visits per person. Existing portraits and the six user-supplied additions are referenced by their descriptive filenames; no image bytes were edited. Customer dialogue is preserved in Persian and translated into English.

## Gameplay and consequences

Each arrival starts a 60-second graphical patience clock. The clock is shared by all stages, dialogue and workstation panels. Crossing 30 seconds triggers one customer taunt and +15 stress points. At 60 seconds an unfinished order is recorded as failed, active work is canceled, and the customer leaves without pay. They say goodbye after five seconds or immediately through the separate departure control; the next arrival takes four seconds. A failed first attempt still resolves that visit, allowing the second mission on the later visit. A lost visit cannot be repaired into a good ending that shift.

Easy provides immediate choice/setup guidance. Normal and Hard keep technical errors hidden until delivery, including wrong Hard reference codes. All stages can be completed with an incorrect draft. At delivery, the customer gives specific feedback and mockery, +25 stress points are applied once, no money is paid, and the order resets to its first work stage. The original patience clock continues. Rework never duplicates payment. Involuntary completion mistakes follow this same delayed behavior on Normal/Hard; fumbles can also delay ongoing work above 50% stress.

Risky story branches are intentional decisions rather than technical errors. False fuel/postcode records and the traveler's opaque deal produce extra earnings and inspection risk on a successful delivery. Declining the two record dilemmas adds five stress points. No real files, websites, CAPTCHA, payment or USB actions occur.

## New interactions

- Taxi presale: rate-limited F5/button refreshes, white Peugeot Pars/dealership 124, 45-second work deadline.
- School portrait: visible crop/background preview, light-gray backdrop and a simulated file-size choice below 50 KB.
- Courier: release a jammed roller, raise barcode contrast and print within a 30-second work deadline; the PDF mission uses a fictional metadata hint.
- OTP man: hotspot toggle and graphical signal bars at three angles. A separate 120-second gateway session is shown while the 60-second patience clock remains authoritative.
- Traveler: scan and individually quarantine four fictional threats; a risky second-visit service decision.
- Grandfather: explain one-time codes, identify the neighbor's water bill and stamp the right receipt.

The scene-local speech bubble remains beside the portrait and only changes dialogue. Equipment windows mirror customer reactions beside a small portrait so a modal cannot hide a complaint or rejection.

## Economy, endings and persistence

Computer and printer have three upgrade levels. Each level removes 20% of base job time for its category, capped at a 60% time reduction. Computer upgrades also reduce refresh counts and, from level 2, one portal retry. Spending is checked atomically against total earned income minus prior upgrade costs. Purchases are unavailable during active work. The upgrade window pauses time; normal equipment windows continue it.

The good ending requires all 22 delivered orders, no failed visits and inspection risk below 2. Stress reaching 100 produces an immediate bad ending with keyboard animation. Failed visits or inspection risk of 2 or greater produce the bad ending at closing. Both endings show income, spending, remaining balance and failure/risk statistics. Ended saves reopen their ending.

Version 5 saves include upgrades/spending, hidden draft errors, customer reactions, special mission clocks, failed visits and ending state. Versions 1–4 migrate, preserving earned income and compatible progress. An active charged print does not consume paper twice. Formerly completed ten-order saves continue with the new customers.

## Validation

`python build.py` builds the hosted `index.html` and self-contained `offline.html`. Run `node --test tests/engine.test.cjs tests/app.test.cjs` for engine and actual handler tests. The suite completes all 22 visits on all three difficulties in both the engine and the DOM harness; it also checks delayed mistakes, exact stress penalties, patience, upgrades, endings, migration, bilingual dialogue and asset bytes in the standalone build.

These tests do not render a browser. The installed Chrome skill was read, but its required browser execution/discovery tools are not exposed in this session. No Chrome screenshot or viewport verification was performed. Desktop, portrait and landscape visual review remains pending.

## Simplified scene

Removed the interactive router, telephone, desk lamp and fan, including their menu actions, sprites, keyboard shortcuts and gameplay effects. The scene now has exactly four workstations: computer, printer, console shelf and desk documents, mapped to keys 1–4. Customer orders retain their dedicated buttons. Tea moved to the existing break/maintenance menu; radio, breathing and printer care remain there. The original background image is unchanged.

Router upgrades are no longer sold. Computer upgrades now cover portal processing and refresh efficiency. Compatible older saves retain their progress; former router upgrade costs are refunded once by reducing historical spending. Retired utility state and active router restarts are removed when loading a save.

Validation after simplification: all 59 engine/UI tests passed, including complete 22-order campaigns on all difficulties, four remaining stations, retired controls, legacy refunds and offline asset packaging. UI verification still uses a DOM harness rather than browser screenshots.
