> Historical notes for version 4. See [the October 23 expansion](EXPANSION.md) for the current 11-customer, 22-mission rules.

# Shift update — 2026-10-22

## Playing and rebuilding

Open `index.html` with its `assets` directory, or open the standalone `offline.html` without any other files. Select Easy, Normal or Hard before starting. Existing saved difficulty is shown when resuming; a fresh shift requires a new selection. `python build.py` rebuilds both pages from `src/` and the existing assets.

Run the current checks with:

```text
node --test tests/engine.test.cjs tests/app.test.cjs
```

`tests/app.test.cjs` executes the real application handlers with a small DOM stub. It does not render a browser.

The earlier update recorded 39 passing tests, two completed HTML builds and a successful `git diff --check`. See the packaging follow-up below for the checks repeated against the current files. All pre-existing image and font assets remain unchanged.

## Current design

Each of the five customers has exactly two retained missions. The USB customer's second mission retains the receipt-alteration dilemma. Each visit has one mission, with separate acceptance, work, delivery and departure. The customer leaves nine seconds after delivery, or immediately through the goodbye button. The counter is empty for four seconds before the next arrival. A saved randomized schedule contains two appearances per customer, never consecutive; the second appearance unlocks their second mission. No second order is shown during the first visit.

The speech bubble is inside the shop scene to the right of the portrait, with a tail pointing toward the customer. Speech clicks only advance text. Acceptance, delivery, goodbye, equipment and the order card have separate controls. Customer dialogue is available while a job runs; opening a modal hides the scene bubble.

| Difficulty | Tasks | Portal recovery | Work speed | Waiting pressure | Extra checks |
| --- | --- | --- | --- | --- | --- |
| Easy | 2, with automatic preparation | First attempt | 0.7× base duration | Low | Choice hints |
| Normal | 3 | Third attempt | Base | Moderate | No mandatory reference |
| Hard | 3 | Fourth attempt | 1.45× base duration | High | Four-digit fictional reference at each step |

Easy preserves a mission's core portal query when simplifying preparation. The router can reduce Normal/Hard portal recovery to the second attempt. Persian and Arabic-Indic digits are accepted for Hard reference checks.

## Stress and equipment

Stress rises with work, waiting, incorrect choices, portal failures, complaints and mistakes. Finishing steps and deliveries brings relief. Tea, breathing and explaining a delay lower stress; the idle counter allows gradual recovery. The percentage uses one decimal place, shows a marked 50% boundary, changes color and displays the cause of pressure. Above 50%, probabilistic involuntary mistakes become possible, increasingly likely as stress rises; at 100%, the shift ends with a keyboard animation and a restart option.

An incorrect entry caused by stress leaves the step incomplete. A spoiled print consumes paper but does not advance the mission. A fumble during work adds delay. An 18-second mistake cooldown prevents immediate chains of errors. Pausing or hiding the page freezes stress, visits, jobs and cooldowns.

Four visible scene objects were added: router, fan, telephone and desk lamp. The equipment panel also offers printer maintenance, a radio with a quiet synthesized melody when sound is enabled, and a breathing break. Fan/radio reduce pressure; the lamp reveals choice hints; router restarts help portal retries; the phone resets waiting pressure; maintenance protects the next print. Cooldowns and active jobs prevent spamming restorative actions.

## Persistence and validation

Version 4 saves include difficulty, visit schedule, current arrival/departure delay, task/reference, completions, paper, earnings, stress, equipment and active work. Version 1–3 saves migrate, retaining earnings and completions of retained missions. A compatible active print resumes without charging paper twice. Historical third missions are removed from the new campaign; their already-earned money remains. Old saves which completed all retained missions open at the completed shift.

The test suite covers full completion of all ten visits on all three difficulties, real UI acceptance/work/delivery controls, dialogue isolation, seeded randomized schedules, save/restore, legacy migration, stress threshold and consequences, utility effects/cooldowns, pause, game over, digit entry, translations, asset availability and offline packaging.

Chrome verification was requested. The installed Chrome skill was read, but its required execution tool and tool discovery are not exposed in this session. No Chrome render, screenshot or viewport verification was performed for this update. A real visual pass of desktop, narrow portrait and landscape layouts remains outstanding. The historical validation documents describe earlier builds.

## Packaging and bilingual documentation follow-up — 2026-10-22

Fixed the five portrait paths in `src/strings.json` to use the existing descriptive filenames in `assets/`. Rebuilt `index.html` with external assets (159,630 bytes) and generated the missing self-contained `offline.html` (8,683,381 bytes). The build resolves all embedded assets before replacing either output, so a missing asset cannot leave a newly written, broken hosted page behind.

Replaced the README and player guide with matching Persian and English instructions for the current ten-order game. Added GitHub Pages setup instructions, `.nojekyll`, common local-file ignores and historical notices on earlier design/validation documents. No game mechanics or original image/font bytes were changed. No repository push or deployment was performed.

Validation: all 39 Node engine/UI tests pass, including additional assertions that each hosted portrait points to its catalog file and every standalone portrait decodes to the original bytes. The earlier missing-standalone packaging failure is resolved. Visual browser verification remains pending; the tests use a DOM stub.
