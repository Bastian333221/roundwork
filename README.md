# ROUNDWORK 1.4.1

Boxing gym sessions include a Choose your exercises menu with 3–6 catalog options per slot. Level, available equipment and existing choices can restrict those options; Rookie has no explosive drills. Selections replace a slot and replan the session. Completed slots are locked. Short sessions may omit selected slots, while retaining the saved choice for later.

The library now has 52 illustrated guides, 50 on-demand video mappings and 16 evidence summaries. New options include easy jump-rope warm-ups, bodyweight/dumbbell/barbell walking lunges, seated cable rows and easy rowing. Barbell walking lunges require Advanced, familiar technique and a coach-checked rack/bar setup. Trunk options identify rotation control (Pallof press), extension control (dead bug/forearm plank), combined control (bird dog) and lateral support (side plank/suitcase carry). These roles and exercise alternatives are not identical stimuli or proof of greater punch force. Exact doses remain programming choices rather than experimentally validated prescriptions for this app.

Per-day Rookie, Intermediate and Advanced choices plus 30, 45, 60, 75, 90, 105 and 120-minute budgets. The pure planner adapts exercise selection, sets, duration and rests after resolving equipment. Rookie uses simpler resistance work and easy familiarisation; experienced levels retain fully rested power and controlled strength work. Short sessions reduce volume, not rest. Longer budgets cap hard work and extend easy cardio up to level-specific limits; unused time is intentional. Estimates include warm-up, cooldown, every displayed rest and setup/transition allowances. Gym queues and unfamiliar movements can take longer. Stop work in time for cooldown.

Coaching and recovery days are not converted into gym workouts. Existing lifting weeks remain unchanged. Readiness and coaching load override hard conditioning at every level. Later-week progression requires an explicit recovery/technique readiness choice. Day choices, dose snapshots and logs are local; export/import carries the new choices and accepts older backups. No automatic load increases, maximal lifting or all-out intervals. The rules are a conservative programming interpretation, not a clinically validated algorithm or a tournament taper. New planning evidence was consulted on 8 October 2026 and appears in Evidence/Fuentes.

# ROUNDWORK

A visual boxing gym companion for Android and iPhone. Alternate unchanged lifting weeks with progressive boxing-focused gym weeks. Includes equipment choices and substitutes, video exercise guides, session timers and local workout logs.

Version 1.2.0 adds 29 exercise video mappings from NASM, PureGym, OriGym, the Cooper Institute, E3 Rehab, FightCamp and Doctor O’Donovan with physiotherapist Ella Boys. Videos load on demand in a privacy-enhanced YouTube player with inline/fullscreen controls and direct original links. Each guide identifies its publisher and differences from the prescribed exercise. Coaching and rest provide contextual guidance rather than unrelated exercise videos. Videos require internet and are not downloaded or cached; audio and available captions depend on the publisher. Version 1.2.1 restores illustrations as the visible quick mechanics guide, with previous/next frames and slow playback. The optional video demonstration expands below it for more detail; collapsing the section removes the player. Illustrations and written steps remain available offline after the app is saved. Sources were located on 6 October 2026; embed availability and regional playback depend on the provider. The bilingual Evidence/Fuentes section retains nine scientific/practice source summaries and adds a demonstration directory. Bibliographic titles remain in the original publication language; personal notes are never translated. Workout data and prescriptions are unchanged.

## Use

Open https://bastian333221.github.io/roundwork/ in Safari on iPhone or Chrome on Android. Confirm your equipment in My gym, select your week/day, and set readiness and coaching intensity before training.

iPhone: Share > Add to Home Screen. Android: browser menu > Add to Home screen / Install app.

Settings and logs remain on the device. Use export/import backups to transfer between phones; there is no automatic sync. Core guides are available offline after a successful initial online load. External expert references need internet. Timer sounds may be suspended when the screen locks; the countdown catches up when you return.

## Program

Lifting weeks preserve the existing chest/back, legs, shoulders/arms rotation. Boxing-focused weeks use two power/strength days and an aerobic/technique day, Thursday/Saturday coaching and Friday/Sunday recovery. Intermediate starting doses are sled pushes 4 x 15 m with 120 s rest and battle ropes 6 x 20 s work / 40 s rest. Coaching intensity and recovery adjust conditioning. Later boxing weeks progress gradually.

Demonstrations teach movement, not a form assessment or proof of boxing transfer. Follow the app dose rather than a video’s workout. The backup diagrams show simplified positions. Expert sources and transfer limitations are included in the app. Have a trainer demonstrate unfamiliar movements and review the gym load with your boxing coach.

## Verification

Content/program checks and browser checks covered progression, equipment substitutions, guide navigation, timers and narrow responsive layouts. Actual Android/iPhone hardware verification is still needed.

Run `node tests/check-app.cjs`, `node tests/check-language.cjs` and `node tests/check-videos.cjs` and `node tests/check-planner.cjs` plus `node tests/check-choices.cjs` from this directory. Bilingual checks cover all guide fields, numeric dose preservation, diagram captions, evidence mappings, persistence and unchanged canonical training data. Browser verification covers language changes during a running timer and open guide, Spanish search, notes/log persistence and a 375px viewport. Source review: 6 October 2026; research summaries identify whether the abstract or public guidance was consulted. The exact app routine is a programming adaptation and has not been tested as a complete intervention.

## Development

Static HTML/CSS/JavaScript with no build dependencies. Serve this directory with a local HTTP server. All paths are relative for GitHub Pages hosting. Do not publish exported personal workout backups.
