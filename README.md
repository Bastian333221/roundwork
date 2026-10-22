# ROUNDWORK 1.10.1

Warm-up feedback now explains the selected response directly beneath the menu and shows the current exercise set changes and omissions there. The unanswered state is a disabled placeholder, not a selectable workout response. Existing pending records remain compatible. Coaching, recovery, missing initial readiness and pain/illness overrides are described without claiming gym adjustments that are not applied. Training rules and stored record formats are unchanged.

The readiness update adds a check for each session, fatigue reasons and affected areas, a post-warm-up response, and a separate pause for pain, injury concerns or feeling unwell. Recent hard boxing and week-specific coaching confirmations govern conditioning. Readiness is applied once before the time-budget trim: general fatigue reduces three-set main lifts to two, preserves two-set main lifts for experienced levels, reduces accessory work, retains full rests and limits easy cardio. Rookie uses easier work with at least four repetitions in reserve. Power waits for a normal warm-up; reduced sessions omit demanding conditioning. Start another session resets the check. Saved logs and backups retain the initial/final selection, reasons, warm-up result and optional session effort rating. The precise rules are programming choices and have not been clinically validated.

Custom exercises can retain their library illustrations and videos, explicitly link to a related library guide, or attach a user-selected HTTPS demonstration plus setup/technique notes. Recognized YouTube links load in a privacy-enhanced player only after a tap; other references open externally. Missing demonstrations are marked Guide needed. Related guides are not automatically treated as exact variants or professional endorsement. Guide details survive backups and archived attempts; notes remain available offline.

Saves now detect an intervening change to the main storage record and refuse to overwrite it from a stale tab. Storage failures display an unsaved warning instead of a successful save. Backup export reads the current in-memory state so unsaved work can be recovered. Reopen updated tabs after exporting conflicting edits; import replaces device data rather than merging it. This does not add cross-device synchronization.

Run node tests/check-readiness.cjs for the readiness flow, production-mode time budgets, log/backup records, guide routing, safe video embeds and storage failure/conflict regressions.

This release adds personal exercise entries to Your session and saved Log sessions. Use Add exercise or Customize exercise to select a library movement or enter a custom name, choose its section and either replace an original movement or add alongside it. Record individual sets, kg/lb and repetitions, time in seconds/minutes, distance in metres/yards, equipment details and notes. The Log includes these entries in comparisons and backups. Unknown values stay blank. Original prescribed details are retained when replaced and excluded from completion totals. User additions are not part of the planner's time estimate or its exercise recommendations.

Boxing gym sessions include a Choose movement dropdown inside every exercise card, beside its timers and guide, with 3–6 catalog options per slot. Level, available equipment and existing choices can restrict those options; Rookie has no explosive drills. Selections replace a slot and replan the session. A Done checkbox in each card saves its actual movement and dose in the selected week/day log. Uncheck to undo completion. Completed slots are locked. Short sessions may omit selected slots, while retaining the saved choice for later.

The library now has 52 illustrated guides, 50 on-demand video mappings and 18 evidence summaries. New options include easy jump-rope warm-ups, bodyweight/dumbbell/barbell walking lunges, seated cable rows and easy rowing. Barbell walking lunges require Advanced, familiar technique and a coach-checked rack/bar setup. Trunk options identify rotation control (Pallof press), extension control (dead bug/forearm plank), combined control (bird dog) and lateral support (side plank/suitcase carry). These roles and exercise alternatives are not identical stimuli or proof of greater punch force. Exact doses remain programming choices rather than experimentally validated prescriptions for this app.

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

Lifting weeks preserve the existing chest/back, legs, shoulders/arms rotation. Boxing-focused weeks use two power/strength days and an aerobic/technique day, Thursday/Saturday coaching and optional Friday/Sunday skills and easy aerobic sessions. Choose recovery on any weekday from its menu. Intermediate starting doses are sled pushes 4 x 15 m with 120 s rest and battle ropes 6 x 20 s work / 40 s rest. Coaching intensity and recovery adjust conditioning. Later boxing weeks progress gradually.

Demonstrations teach movement, not a form assessment or proof of boxing transfer. Follow the app dose rather than a video’s workout. The backup diagrams show simplified positions. Expert sources and transfer limitations are included in the app. Have a trainer demonstrate unfamiliar movements and review the gym load with your boxing coach.

## Verification

Content/program checks and browser checks covered progression, equipment substitutions, guide navigation, timers and narrow responsive layouts. Actual Android/iPhone hardware verification is still needed.

Run `node tests/check-app.cjs`, `node tests/check-language.cjs` and `node tests/check-videos.cjs` and `node tests/check-planner.cjs` plus `node tests/check-choices.cjs` from this directory. Bilingual checks cover all guide fields, numeric dose preservation, diagram captions, evidence mappings, persistence and unchanged canonical training data. Browser verification covers language changes during a running timer and open guide, Spanish search, notes/log persistence and a 375px viewport. Source review: 6 October 2026; research summaries identify whether the abstract or public guidance was consulted. The exact app routine is a programming adaptation and has not been tested as a complete intervention.

## Development

Static HTML/CSS/JavaScript with no build dependencies. Serve this directory with a local HTTP server. All paths are relative for GitHub Pages hosting. Do not publish exported personal workout backups.

Each exercise card has independent equipment confirmation for its selected movement, week and day. Equipment ready selects all required items on that card; expand Equipment checklist to select individual items. Checks never select another card or change My gym inventory. Changing the movement clears its card checklist; completed logs are preserved. Backup/import includes these checks. Equipment-free exercises show a checked, disabled control.

Flexible boxing-week schedule: click any weekday tile to open its training-plan dropdown. Select Power & strength A/B, Skills & conditioning, Coaching A/B, or the additional Skills & aerobic A/B routines. Selecting a routine exchanges it with the routine currently assigned to that weekday, then displays the selected plan. The separate Adapt this week editor is removed. Mappings remain per boxing week and routine IDs/log keys stay stable. Exercise choices, doses, gear checks and recorded dates remain attached to their routines. Restore original weekdays resets only assignments. Recovery guidance and consecutive-strength-day warnings remain. Menus support Escape, arrow keys, Home/End, Tab and outside-click dismissal.

Friday/Sunday workouts have separate stable routine IDs and use the existing skills/aerobic prescriptions without extra rope intervals. Each weekday menu has Make this a recovery day / Resume planned session. Recovery choices follow their routines when rescheduled and are saved per boxing week, included in backups, and do not erase exercise records. Older logged recovery sessions retain their recovery choice. Available workouts do not prescribe training seven days a week.

## Session history

Log combines all recorded routines within a selected training week, with an All training weeks filter. Each entry shows its recording dates, saved/partial status, completed exercises and saved prescriptions. Start another session archives the current attempt and opens a new attempt with separate completion and equipment confirmations, preserving movement choices, level and time. Old logs migrate without inventing completion dates. Session instances and active attempt links are included in backup/import. Prescriptions are not measured weights, repetitions or training duration.

Run node tests/check-history.cjs for migration, repeated-session, weekly-summary and backup regressions.

## Actual performance and past sessions

Record actuals on an exercise to enter individual sets, weight, kg/lb, load basis and repetitions. Optional time, distance and notes support timed work or resistance that cannot be quantified. Values are self-reported and remain separate from the prescription. Saving marks that exercise as performed without changing equipment confirmations. Log supports comparisons for the same exercise and displays the original units and load basis. Add past session lets the user select the routine, numbered training week and actual calendar date, then mark remembered exercises and enter optional actuals. No performed values or historical prescriptions are inferred. Manual entries can be edited independently of the active routine, and all entries are included in backups.

Run node tests/check-performance.cjs for actual-load, manual-session, date, comparison and persistence regressions.

## Session personalization

Your session and each Log entry support Add exercise, and planned exercise cards support Customize exercise. Choose a library movement or a custom name, assign a section, and add alongside or replace an original slot. Original data remains stored and is labelled as replaced; replacement slots are excluded from performed totals and comparisons. Custom exercises retain their own equipment details and an optional HTTPS reference. Current additions can be pending or marked done; previous session additions are recorded as performed. Time supports seconds/minutes and distance supports metres/yards, retaining entered units and SI equivalents. Custom names, sections, references, measurements and replacement relationships are included in backups and independent repeated attempts. Planner estimates cover prescribed work only.

Run node tests/check-customization.cjs for custom exercise editor flow, replacement records, unit conversion and retention, archived-session isolation, reload and full backup import.
