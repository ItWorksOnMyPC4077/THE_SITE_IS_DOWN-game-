# UI layout and art implementation plan

## Screen hierarchy

Base UI design: **1280 × 800**, minimum window **1024 × 720**. The root scroll container protects content at smaller supported window sizes. The scene has a 24-pixel outer margin and 14–24-pixel gaps. This is a desktop layout; narrow/mobile reflow is not implemented.

English layout:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ THE SITE IS DOWN!                   [فارسی / English] [CRT] [Pause]     │
│ Time   |   Credits   |   Reputation   |   Waiting   |   Served          │
│ STRESS  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]             │
├─────────────────────────┬───────────────────────────────────────────────┤
│ PIXEL ROOM              │ CUSTOMER NAME                 patience       │
│ fluorescent tube        │ “Request text…”                             │
│ CRT / RTX case / tea    │                                               │
│ keyboard / papers       │ Current task stage                           │
│                         │ Progress [██████░░░░░░░░░░░░░░]              │
│ Posted shop policy      │ CAPTCHA: ۱۲۳۴                [input]         │
│                         │ [Perform step / Retry / Next customer]        │
│ Discovered details      │ [Ask for details]       [Talk them down]     │
│                         │ [Tea / cooldown]        [Decline job]         │
├─────────────────────────┴───────────────────────────────────────────────┤
│ Outcome / inner monologue / complaint / inspection result              │
│ [Open shop / New shift — only at the beginning or after the run]        │
└─────────────────────────────────────────────────────────────────────────┘
```

Persian uses the same structure with the two main columns and control rows mirrored. Text aligns to the right. The physical room drawing is **not** reflected: the tea remains on the same side of the keyboard. Latin text and digit sequences retain their natural internal direction.

| Region | Purpose | Starter behavior |
|---|---|---|
| Header | Identity and reversible settings | Locale and effects remain accessible during pause/game over |
| HUD | Time, money, reputation, waiting count, served count | Localized digits; labels wrap if necessary |
| Stress | Primary failure resource | Always visible, numeric and graphical |
| Room | Mood and status | Procedural low-resolution art; no essential text hidden inside art |
| Policy/details | Evidence and fair choices | Policy always visible; clue revealed with Ask |
| Work area | One active customer and service | Stage label, progress bar, optional CAPTCHA, context button |
| Outcome | Consequences and personality | Whole localized sentences; handoff freezes time for reading |

## Typography and RTL implementation

Vazirmatn Regular is bundled with its license and set as the root Theme font. The starter uses approximately 20 px body text, 18 px secondary text, 24 px ticket headings and 28 px title. Keep these values readable before adding more decorative pixel typography.

The Locale autoload registers `en` and `fa` translations, selects a saved preference (or Persian for a Persian system locale), and emits `changed` when toggled. `main.gd` explicitly sets the root layout direction and regenerates display strings from stable keys. `text_direction` stays automatic for natural-language labels; the numeric CAPTCHA input is explicitly LTR. Named placeholders allow translators to reorder values naturally.

Rules:

1. Store normal Unicode Persian in logical order. Never reverse strings or manually reshape already-shaped text.
2. Keep zero-width non-joiners in words such as «نیمه‌کاره» and «می‌گوید». Do not split labels one code point at a time for a typewriter effect; later animation should reveal shaped text safely.
3. Translate complete sentences. Do not concatenate English word order or append a currency unit after an RTL sentence by hand.
4. Render local UI numerals as Persian digits in Persian mode. Accept ASCII, Persian and Arabic-Indic digits for numeric answers. Preserve raw identifiers and filenames instead of indiscriminately translating their characters.
5. Give future filename/URL widgets their own LTR or structured-bidi handling. Do not force the entire Persian paragraph LTR because it contains “PS4” or “Error 502”.
6. Mirror directional navigation and container order. Do not mirror logos, room art, controller diagrams or photographs.
7. Keep the language toggle self-identifying as **فارسی / English** in both locales. No flags are needed.
8. Test a complete standard Godot build with advanced text support. Font availability alone does not prove glyph shaping or line wrapping is correct.

All current customer dialogue, task labels, hints, outcomes and button captions exist in both languages. Brand markings in room art remain brand markings. Narrative text is not baked into sprites. Campaign prose added later must enter the same catalog pipeline.

## Art tokens and asset plan

| Role | Color / direction |
|---|---|
| Outer background | `#0D1112` |
| Wall | `#252B2D` with sparse `#303637` mortar |
| Desk | `#614D40`, worn edges `#987A55` |
| CRT dark glass | `#111F20` |
| Terminal glow | `#6C9977` on `#254743` |
| Paper and text | `#E1DCC5`, darker stained paper `#C1B798` |
| Focus and warm accents | `#D5A95B` |
| Tea | `#945929` |

Current room canvas is **384 × 240** in a SubViewport. The texture uses nearest-neighbor filtering inside a 400 × 260 presentation area; this preserves hard edges but is not integer scaling, so pixel widths may vary. For final art, reserve a 384 × 240 or 768 × 480 integer-scaled area and adjust the layout accordingly. UI remains independently rendered at the main viewport resolution.

Planned sprite sheets: room background; layered printer/scanner/console props; six recurring portraits with neutral/tired/relieved expressions; Nima's hands typing, reaching for tea and smashing the keyboard; small queue silhouettes; document overlays; USB puzzle fragments. Portraits should communicate mood through expression and gesture, not caricature.

The CRT shader affects only the art texture. No scanlines, distortion or blur cross the UI. Fluorescent variation is low-amplitude and slow. One effects toggle disables shader flicker and moving fragments; game-over state remains readable as a broken keyboard. Audio toggles and independent motion/CRT settings are future work.

## Input and accessibility

Every action is a labeled button with a 44-pixel minimum height. Tab/Shift+Tab use ordinary control focus; Enter activates a focused button or submits CAPTCHA. Escape toggles pause where input remains unhandled. Focus styling uses an amber border. Essential distinctions appear in words rather than only color.

The current pause freezes gameplay timers while leaving settings accessible. The room stops its movement clock, though the optional shader uses engine TIME and can continue its subtle flicker; turning effects off disables it entirely. Long text wraps, and a scroll container preserves access at minimum size. Separate text-size settings, explicit mirrored focus neighbors, no-pressure story mode and remappable shortcuts are planned accessibility work.

For the full game, offer a no-pressure mode that pauses patience during dialogue and removes queue stress without changing story outcomes. Let users disable shake, flicker and typewriter effects independently. Avoid tiny CAPTCHA distortions: the challenge is attention under pressure, not a vision test.

## Visual acceptance checklist — pending engine review

- Open and finish a shift in each language. Switch locale while idle, working, errored, paused, at a paid ticket and at game over.
- Read «سایت بسته است!»، «می‌گوید»، «ثبت‌نام» and «پشتیبان‌گیری». Verify joined letters, non-joiners, punctuation and no missing-glyph boxes.
- Enter `1234`, `۱۲۳۴`, `١٢٣٤` and a mixed-digit code. Verify the displayed value, caret motion, backspace and Enter with a Persian keyboard layout.
- Test `PS4` and `Error 502` embedded in a Persian sentence, a negative balance, percentages, and a long customer name. Confirm digit sequences are not reversed.
- Inspect 1280 × 800 and 1024 × 720 at normal and high OS scaling. Ensure no horizontal clipping, overlapping buttons, hidden clues or truncated consequence text.
- Complete a ticket with keyboard only. Verify a visible focus indicator and sensible navigation after language changes and after the Open shop button disappears.
- Trigger a failure at 99%, a customer leaving, a caught inspection and stress 100. Verify each consequence appears once and no payout occurs after game over.
- Toggle effects off and confirm the art remains informative, without flicker or flying fragments.
- Test an exported build with JSON catalogs and font assets present, including a system without any Persian fonts installed.

These checks are deliberately listed as pending: the starter has not been run or visually inspected in Godot in this environment.
