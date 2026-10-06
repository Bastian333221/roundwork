# ROUNDWORK

A visual boxing gym companion for Android and iPhone. Alternate unchanged lifting weeks with progressive boxing-focused gym weeks. Includes equipment choices and substitutes, illustrated exercise guides, session timers and local workout logs.

Version 1.1.0 adds English/Español controls (saved per browser), bilingual exercise search and a dedicated Evidence/Fuentes section. It includes nine source summaries, publication metadata, original links, limitations, a workout-to-source map and an exercise-reference directory. Each exercise guide can open its relevant evidence block. Bibliographic titles remain in the original publication language; personal notes are never translated. Workout data and prescriptions are unchanged.

## Use

Open https://bastian333221.github.io/roundwork/ in Safari on iPhone or Chrome on Android. Confirm your equipment in My gym, select your week/day, and set readiness and coaching intensity before training.

iPhone: Share > Add to Home Screen. Android: browser menu > Add to Home screen / Install app.

Settings and logs remain on the device. Use export/import backups to transfer between phones; there is no automatic sync. Core guides are available offline after a successful initial online load. External expert references need internet. Timer sounds may be suspended when the screen locks; the countdown catches up when you return.

## Program

Lifting weeks preserve the existing chest/back, legs, shoulders/arms rotation. Boxing-focused weeks use two power/strength days and an aerobic/technique day, Thursday/Saturday coaching and Friday/Sunday recovery. Intermediate starting doses are sled pushes 4 x 15 m with 120 s rest and battle ropes 6 x 20 s work / 40 s rest. Coaching intensity and recovery adjust conditioning. Later boxing weeks progress gradually.

The diagrams are simplified guides, not a form assessment. Expert sources and transfer limitations are included in the app. Have a trainer demonstrate unfamiliar movements and review the gym load with your boxing coach.

## Verification

Content/program checks and browser checks covered progression, equipment substitutions, guide navigation, timers and narrow responsive layouts. Actual Android/iPhone hardware verification is still needed.

Run `node tests/check-app.cjs` and `node tests/check-language.cjs` from this directory. Bilingual checks cover all guide fields, numeric dose preservation, diagram captions, evidence mappings, persistence and unchanged canonical training data. Browser verification covers language changes during a running timer and open guide, Spanish search, notes/log persistence and a 375px viewport. Source review: 6 October 2026; research summaries identify whether the abstract or public guidance was consulted. The exact app routine is a programming adaptation and has not been tested as a complete intervention.

## Development

Static HTML/CSS/JavaScript with no build dependencies. Serve this directory with a local HTTP server. All paths are relative for GitHub Pages hosting. Do not publish exported personal workout backups.
