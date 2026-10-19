# The Site is Down! / سایت بسته است!

**Game design document • v0.1 • 13 October 2026**

## 1. Pitch and player promise

Run a tiny internet café and service shop where the queue is real, the deadline is real, and the server claims neither exists. Triage paperwork, rescue customers' digital lives, make questionable business decisions, and protect the last intact keyboard in the neighborhood.

You are **Nima**, a sharp-minded gamer with excellent pattern recognition, a cynical internal monologue, and a stubborn habit of helping people. Your raid team believes you work in IT. Your customers believe you personally control every website in the country.

**Genre:** single-player, 2D desk simulation, management and conversational drama. **Initial platform:** desktop, mouse and keyboard. **Audience:** players who enjoy procedural judgment, intimate recurring characters and stressful systems with recoverable mistakes. **Campaign target:** seven shifts, roughly 90–120 minutes for an initial small release. These are design targets, not a production estimate.

The inspiration from *Papers, Please* is reading evidence under pressure; the inspiration from *Coffee Talk* is finding warmth in a small room. Original identity: technical triage as care, with outages turning competence into absurdity. Use original characters, UI, assets, music and dialogue.

## 2. Pillars

1. **The system is absurd; the people are human.** Joke about loading bars, circular procedures and Nima's coping strategies. A forgetful elder can also be perceptive, funny and generous.
2. **Frustration must create a decision.** Retry, switch tasks, explain, decline, or take tea. A spinner that permits no decision is dead time.
3. **Observe before judging.** Evidence is in requests, documents and inconsistencies. Clothing, accent, age and appearance are never inspection tells.
4. **Small kindness has a mechanical cost and a narrative return.** Helping someone recover a password consumes time but builds trust and changes future visits.
5. **Persian is a first-class language.** The jokes, typography, line breaks and controls must work in Persian from the first playable slice.

## 3. Core loop

**Open → inspect ticket → clarify request → accept/decline → perform service → handle interruption → collect payment → recover → next customer → close and reconcile.**

At opening, review the day's notices, budget and available supplies. During service, read the customer's request and evidence, select tools, and manage patience. Between jobs, choose a brief conversation or maintenance action. At closing, reconcile income, consumables, fines, rent and relationships; buy one meaningful upgrade.

The supplied starter implements one five-minute shift with eight preloaded tickets. The first customer is always Mina's printing tutorial; the rest are shuffled using a recorded seed. Only the active customer's patience counts down. Waiting customers add ambient stress. The timer freezes at resolved tickets so the player can read outcomes before choosing **Next customer**. A normal pause is also available. In the campaign, arrivals and parallel workstations can be added after the single-station loop is validated.

**Starter victory:** reach the end of the queue or closing time with stress below 100. **Starter defeat:** stress reaches 100. An inspection is a setback, not an automatic loss. A negative credit balance is permitted in the starter. Campaign debt and rent endings are planned separately.

## 4. Service design

| Service | Full mini-game design | Meaningful mistake | Starter implementation |
|---|---|---|---|
| Faded printing | Compare original and preview; balance contrast, gamma and paper choice. Preserve the stamp and small type. Approve a test sheet before the final batch. | Excess contrast destroys a stamp; another test consumes paper and patience. | Three timed stages: compare, adjust/test, final print. |
| Subsidy / kalabarg registration | Compare fictional ID fields, recover a missing password, transcribe a local CAPTCHA, submit, respond to outages. | Wrong field causes a correctable rejection; repeated reloads discard unsaved fields. | CAPTCHA input, 502/99% failures and bounded retry. Password recovery is dialogue only. |
| Corrupted USB | Make an image, choose a scan, reconstruct directory fragments, export recovered files to a separate target. | Writing to the source reduces recovery quality; rushing skips a recoverable family photo. | Three timed stages: image, scan, export. No real filesystem access. |
| PS3 / PS4 service | Check consent, saves and fictional compatibility cards; order a backup/test workflow; solve a symbolic boot sequence. | Wrong compatibility selection means a harmless simulated failed boot and extra work. | Three timed stages: consent, backup/compatibility, modification/boot test. No actual firmware or exploit steps. |
| Suspicious requests | Compare the request against the posted policy; ask a follow-up; accept, decline, or offer a permitted alternative. | Accepting falsification or concealed access can trigger an undercover penalty. | Two risky tickets, visible clues, seeded undercover identity, accept/refuse consequences. |

### Portal state machine and fairness

The portal begins ready for CAPTCHA input. A correct code starts a four-second request. On the first two valid attempts, each request has a **55%** failure chance: a 502 at 50% or an expired session at 99%, with equal probability. The third correct attempt succeeds. Incorrect CAPTCHAs do not consume the retry guarantee and cost four stress. All codes are generated and checked locally. No real CAPTCHA service is used.

This produces **1 + 0.55 + 0.55² = 1.8525 expected valid attempts**, or 0.8525 expected server failures per portal job before other interruptions. Portal-induced stress therefore averages 10.23 per job in isolation. Human reading time and patience still matter; the guarantee prevents an unlucky infinite failure loop, not every possible loss.

In the full game, show the recovery guarantee as an in-world “saved local draft / priority resend” mechanic after repeated failures. Add deterministic service-state notices so players can learn when retrying immediately is a bad use of time. Cap the total number of outages in a shift and separate narrative outages from randomly rolled ones.

### Stress, patience and recovery

The visible bar is **stress**, increasing toward 100. Do not also display an oppositely directed “sanity” bar. Internally, sanity could be represented as `100 - stress`, but there is only one resource to learn.

| Event | Starter effect |
|---|---|
| Queue pressure | +0.06 stress per waiting customer per active second |
| Server failure | +12 stress |
| Incorrect CAPTCHA | +4 stress |
| Active patience below 20 seconds | +4 stress every five seconds |
| Active patience reaches zero | Customer leaves; +15 stress; −5 reputation |
| Conversation, once per customer | −8 stress; +10 seconds patience |
| Tea, 25-second cooldown | −18 stress |
| Accept an undercover risky job | −60 credits; −15 reputation; +30 stress |
| Decline a risky job | No payment; +2 reputation |
| Decline an ordinary job | No payment; −2 reputation |
| Complete a job | Ticket fee; +2 reputation |

Clamp stress and reputation to 0–100. Stress 100 is terminal: later events in that frame cannot award money or revive the run. In the full game, stress crosses audiovisual thresholds at 40 (faster tapping), 70 (shorter inner monologue), 90 (subtle warning outline). Do not make high stress reduce text legibility or falsify evidence.

Game over: Nima's hands strike the keyboard; several keycaps arc upward, followed by silence and a final line: **“The space bar has entered low orbit.”** The starter animates detached keycaps; the hand animation and sound are planned. Reduced-effects mode shows a static broken keyboard.

### Inspection events

This is a fictional ruleset, not a claim about current Iranian law, institutions or specific products. An in-world cyber inspection unit can visit undercover. Rules are explained before consequences occur; changing rules must appear on the next day's notice board.

Starter risky tickets independently have a 50% undercover chance. The player cannot determine identity with certainty. They can determine whether the job violates policy: a false invoice or an altered approval date is explicit evidence. A normal console-service request is not suspicious merely because it mentions jailbreaking. An elderly client's forgotten password is not suspicious merely because they forgot it.

Choosing the same policy consistently avoids inspection penalties. Accepting a risky job for its high fee is a knowingly risky narrative choice. The full game should also include ordinary ambiguous customers, benign inspectors and a permitted repair alternative, so the optimal strategy does not become “decline every unfamiliar face.”

## 5. Economy and progression

Prototype credits are fictional accounting units. Fees: print 15, portal 30, USB 35, PS3 45, PS4 50, risky requests 80–90. Completing all six ordinary jobs earns **205 credits**. The two suspicious tickets can be declined without reducing this total. There are no consumable or rent deductions yet.

Proposed campaign economy starts with 100 credits; closing costs are 70 per day. Prototype revenue is the balancing baseline, not a promise of final prices. Upgrades compete for the same money: backup UPS (120, cancels one power interruption), reliable toner (90, widens print-quality tolerance), kettle insulation (80, improves tea cooldown), RAM (150, reduces scan time). Each upgrade changes one legible constraint. Never sell a “pay to remove all outages” item; system friction is the game.

| Shift | New pressure | Emotional beat |
|---|---|---|
| 1 — Please Wait | Printing and one recoverable timeout | Mina leaves a handwritten thank-you. |
| 2 — Password Required | Password recovery and patience | Rahimi offers to help Nima's sibling with math. |
| 3 — Safely Remove | USB recovery and a deadline | Sara finds a photo of someone she has lost. |
| 4 — Terms Changed | Announced policy revision; first inspection | Nima must decide whether a regular's trust is enough. |
| 5 — Ninety-Nine Percent | Load spike and a console backlog | Leila recognizes burnout before Nima does. |
| 6 — Offline Mode | Planned outage; prioritize saved local work | The room becomes a place to talk. |
| 7 — Still Open | Combined skills with predictable, bounded failures | People return with help, not just requests. |

Proposed endings track shop solvency, neighborhood trust and Nima's wellbeing: **Still Open** (sustainable business), **The Last Receipt** (profitable but isolated), **Out of Service** (debt closure), **Keyboard Down** (stress loss). Avoid equating burnout with moral failure. Campaign state and endings are not in the starter.

## 6. Narrative and dialogue

Nima's internal voice is dry and economical: “I have beaten bosses with three health bars. This form has seven tabs.” Spoken dialogue can be gentler. The emotional turn is discovering that technical competence is useful, but explaining a failure without humiliating someone is also a skill.

**Mina:** a student who knows exactly how bad her scan is. She contributes visual humor, then becomes an ally who helps label the queue.

**Mr. Rahimi:** a retired teacher who forgets a password but remembers every former student's name. The joke is the password policy, not his age.

**Sara:** a photographer whose USB recovery makes a routine workflow suddenly personal. Never delete irreplaceable files as an untelegraphed punchline.

**Leila:** a shift worker squeezed by portal deadlines. She is the first customer to say, “I know it is the website, not you.”

**Arash and Navid:** different console owners with different priorities; one cares about old saves, the other about promises made by a previous shop. Avoid presenting them as identical “gamer customer” jokes.

Sample exchange:

> Customer: “The portal says I do not exist. My rent disagrees.”
>
> مشتری: «سامانه می‌گوید وجود ندارم. صاحبخانه‌ام مخالف است.»
>
> Nima: “Your landlord has better servers.”
>
> نیما: «سرورهای صاحبخانه‌ات بهتر است.»

In longer dialogue, offer **practical**, **wry**, and **patient** responses; these are tones, not a morality meter. Recurring characters remember one meaningful decision per day, rather than every line. Store dialogue keys and relationship flags separately from localized prose.

## 7. Art and audio direction

A cramped, dusty shop under tired fluorescent tubes. Olive plaster, tobacco-brown desk edges, oxidized teal shadows, amber tea and a slightly overconfident green RTX sticker. The CRT is the brightest patch until a document appears. Keep desk clutter meaningful: a thermal receipt roll near payment, a USB tray near recovery, a paper stack near printing.

Draw room assets at low resolution with a restricted palette. Preserve sharp silhouettes and clusters of 2–4 pixels; use dirt selectively around edges and contact points. UI text is rendered separately at readable resolution. Avoid putting Persian text into tiny pixel textures.

Audio plan: low fluorescent hum, distant traffic, printer rollers, cheap mouse clicks, a kettle switch and a console fan. Conversation gently ducks machinery; successful completion gets a short mechanical confirmation, not a casino reward burst. Every important audio event also has a text cue. No audio is bundled in the starter.

## 8. Scope and production gates

**Bootstrap delivered:** see README's implemented list. It is a connected starter, with stage placeholders where a finished mini-game would go.

**Next playable milestone:** replace the printing stage with a real preview puzzle; add one illustrated customer portrait and a voiced-by-text branching conversation; visually verify both locales. Keep one shift and one station until this version is fun.

**Vertical slice gate:** every core service has one interactive puzzle, language switching works in every state, no unbounded failure loop, no missing translation, a complete shift can be finished without tutorial intervention, and a player can explain why an inspection penalty happened.

**Campaign gate:** seven shifts, state persistence, progression/economy, branching recurring characters, tuned arrivals, accessible controls, audio and authored art.

**Release gate:** Godot runtime/export testing; human Persian editorial review; RTL/IME checks; keyboard-only completion; reduced-effects validation; save migration tests; and playtesting of frustration versus agency. Suggested telemetry is local and opt-in: retry counts, time spent reading, abandonment reason and stress at exit. No customer-like personal data is needed.

## 9. Risks and mitigations

Repeated errors can feel like waiting rather than play: give alternate work and cap failure streaks. Blanket refusal can dominate: reward permitted alternatives and relationships. Translation can flatten jokes: rewrite punchlines in each language instead of preserving English syntax. Management can overwhelm conversation: freeze the clock for explicit story scenes and resolved tickets. Cultural detail can become stereotype: use specific individuals, local editorial feedback and humor directed at broken systems. Content growth can overwhelm a small team: build one authored shift before adding campaign branches.
