# Net Nights — The Secret of Zeus / Version 9

Current implementation notes, 2026-10-23. The user-authored source narrative is preserved in STORY.fa.md. THREE_DAYS.md retains the previous release’s 33-mission table; its old billionaire plot and ending conditions are superseded.

## Playable scope

Amirali owns Zeus in rainy Tehran. Days 1–3 use a persistent five-customer selection, one per category. Those five return with missions one, two and three on the matching day (15 visits per campaign, from a catalog of 14 customers and 42 missions). The daybook marks the selected five and retains the entire library. Six desktop apps, difficulty, patience, stress and paid upgrades remain. Days 4–10 are seven branching night chapters with Shahin, Maryam and Uncle Rahim. Night chapters use the supplied market and street scenes, plus portraits of Amirali, Maryam, Shahin and Uncle Rahim, text and choices; there is no freely navigable city or motorcycle driving model.

| Day | Chapter | Decision |
| --- | --- | --- |
| 1 | Ink and a 320 GB drive | Serve first daily orders; learn the copy-cover mechanic |
| 2 | Ten invisible gigabytes | Second daily orders; discover the hidden encrypted sector |
| 3 | The rent cheque | Third daily orders; leave for Jomhouri |
| 4 | Enter Aladdin Passage | Reject transit deal / take 300,000 advance |
| 5 | Unlabelled box | Require a receipt / take 80,000 without one |
| 6 | Rain alley | Cancel delivery / hand over data for 250,000 |
| 7 | Three times the rent | Leave arrangement / hand over data for 450,000 |
| 8 | Maryam’s warning | Listen / dismiss her warning |
| 9 | Uncle Rahim | Erase hidden sectors / hand over drive for 600,000 |
| 10 | The final shutter | Refuse / final delivery for 1,000,000 |

The good ending requires an inactive transit deal, no data handover, and erasure with Uncle Rahim. Refusing later never retrieves already handed-over data. An initial advance allows redemption before any handover. Refusing all illicit deliveries keeps Zeus open without a billionaire outcome. Otherwise the closing ending shows the 03:00 raid and red judicial-seizure screen. Stress reaching 100% remains an immediate keyboard-smash failure and does not falsely narrate the raid before its chapter.

## Architecture and persistence

`src/missions.json` stores the bilingual prologue, ten chapters, per-choice flags, reactions, fictional payouts and two endings. `Room.chooseStory` records one choice per sequential chapter; `Room.plotFlags` derives irreversible handovers and the ending. `STORY_DAYS=10` is separate from `DAYS=3` shop workdays and `COUNT=14` catalog entries, `DAILY_COUNT=5` daily visits and `TOTAL=15` campaign visits. Story choices run while the day report pauses the simulation.

Save format 7 introduced `plot.day`, ordered `plot.choices` and a simulated transfer state. Version 6 active work retains its timer, draft, money and job. A completed version 6 campaign continues at chapter 4; a stress failure stays failed. Older migrations continue to preserve credits and upgrades. Story saves validate chapter order, option membership, resolution conditions and transfer state. Earnings and choice flags are applied only once.

The File Manager contains an optional local copy simulation during workdays: 8 seconds of exposed copying, inspection after 3 seconds, 2.5-second response window. C or the Cover button shows a vehicle-registration form, freezes copying and clears inspection; uncover to resume. Alt+Tab works only if the browser receives it. Exposure adds 12 stress and one risk; completion grants 15,000 once per workday. Pause and saves retain the response deadline; an unfinished copy stops at the day boundary.

Version 9 adds a saved five-person roster and migrates older 33/42-visit saves while preserving their paid/failed ledgers, earnings, upgrades and story choices. The currently active customer is included. Active drafts, jobs and patience are restored immediately when possible or bookmarked until that mission is reached. Legacy ledger entries outside the selected roster remain historical; the HUD and receipts count only scheduled visits. Fully served version-eight campaigns resume night choices immediately.

The console shelf displays `assets/mohit/miz-bazi.png`: PS3 is clickable on the left and PS4 on the right, including their controllers. Image selection performs an active matching-console task through the same difficulty/error rules as other choices. Ordinary console testing remains separate from mission delivery.

The daybook remembers whether it was opened from a day opening, night choice, computer or the counter. Close, Escape/native cancel and backdrop dismissal return to that parent; a day-opening parent stays paused until Begin day. Closing from the computer resumes jobs and patience without dropping the player into an unreachable day break.

## Build and validation

Run `python build.py`, then `node --test tests/engine.test.cjs tests/app.test.cjs`. Build produces hosted `index.html` and self-contained `offline.html`; neither needs a package install to play. The 135 passing automated tests cover five-person selection, all 42 catalog missions at every difficulty, old active jobs on all three workdays, parent-window return, console hotspots, embedded images and all 128 combinations of night choices, reload after each decision, irreversible handovers, version-six migration, copy deadlines and actual UI handlers via a DOM stub. These tests are not a visual Chrome review.

Use the browser’s language toggle for Persian RTL and English LTR. Original room/customer images remain untouched. The original user images are used without modification. All eight environment/story image references, including the original shop, are embedded in the standalone build. Source paths remain in the hosted build.


## Full-screen conversation presentation

Day openings, night chapters and closing endings now use a full-viewport story page within the standalone game. The ordinary equipment-window frame and café HUD are hidden during this view. The original `nima.png` asset represents the protagonist Amirali from the supplied narrative, always physically on the right. Maryam, Shahin or Uncle Rahim stands on the left, with a separate speech bubble beside each portrait. Layout direction is fixed independently of Persian RTL or English LTR text; compact screens retain both sides with the bubbles below their portraits.

`src/story-scenes.json` contains three paired dialogue beats for each of ten chapters and two paired beats for each closing ending. Both bubbles and Continue advance reading only. At the last beat, Replay starts the conversation again. Begin day, branching decisions, the daybook and returning to the menu remain separate controls. Original chapter narration, prologue, financial reports and epilogues remain in expandable records. The bad ending retains the visible seizure message; 100% stress remains its separate keyboard failure.

The UI stores `{day, ending, beat}` under the existing settings save. It validates the cursor before rendering, resets it for each new chapter/ending and a new run, and keeps it through language changes, daybook navigation and reload. Campaign format 9, money, story decisions and clocks are unchanged. Time remains paused for all story reading. The language switch is inside the full-screen view so native modal focus does not block it.

Automated regression tests cover both bubble controls, no campaign mutation while reading, language switching, fixed portrait roles, all dialogue data, ending transitions, daybook return, menu/reload resume, new-run reset and invalid cursor recovery. They exercise actual handlers through a DOM stub; they are not a visual browser review.
