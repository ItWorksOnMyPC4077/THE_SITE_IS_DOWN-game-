# Validation record

**13 October 2026 — Windows, Python 3.12.**

## Executed

`python -m unittest discover -s tests -v` — **10 tests passed**.

Coverage: matching English/Persian key sets and placeholders; nonempty translations; customer content references; literal UI/status keys; local Godot resource paths; ASCII/Persian/Arabic-Indic digit normalization; invalid CAPTCHA retry accounting; bounded success under worst-case server RNG; terminal stress and payout guards in the Python model; inspection outcomes; reproducible policy runs.

Two 1,000-run reference simulations were executed, beginning at seed 42:

| Automated policy | Mean credits | Mean final stress | Mean portal attempts across two jobs | Stress losses |
|---|---:|---:|---:|---:|
| Decline risky jobs | 205.00 | 5.78 | 3.668 | 0 |
| Accept risky jobs | 234.66 | 13.38 | 3.668 | 0 |

These runs validate the reference model's basic behavior, **not human difficulty**. They omit reading delays, wrong input, abandonment and closing-time pressure; they also use optimal once-per-customer conversation and available tea. Recovery looks generous for a tutorial. Risky work currently has a positive expected cash reward and a reputation/stress cost; the campaign must make those longer-term costs meaningful. Playtest before changing balance.

## Not executed

Godot was not available on PATH. No editor import, GDScript parse/semantic validation, engine smoke test, shader compilation, rendered screenshot review, exported build test or Persian input-method test was run. The ten passing Python tests do not imply that the Godot project has passed those gates.

The engine smoke script is provided in `godot/tests/smoke.gd`. Run it after importing the project, then perform the bilingual visual checklist in `docs/UI_LAYOUT.md`. Confirm there are no parser errors, missing glyphs, reversed punctuation, horizontal overflow or focus traps before treating the starter as validated in-engine.

## Implementation review

Source review added guards for terminal stress and duplicate completion so the intended state machine cannot award the same job twice. Timer processing checks terminal states before work completion. Locale switching only changes presentation and settings. The CRT shader is restricted to the room texture. Font and license assets are present. Resource and catalog checks passed after these edits.
