# ROUNDWORK 1.12.1

An English/Spanish boxing gym companion for Android, iPhone and desktop browsers. The boxing-focused gym weeks adapt to level, time, equipment and recovery. The established lifting-week routine is unchanged.

App: https://bastian333221.github.io/roundwork/

## Automatic workout-log sync

Open **Sync & devices**:

1. On your first device, enter your email and a password, select **Create account**, and confirm your email using the verification message.
2. Return to ROUNDWORK and select **Sign in with password**.
3. Select **Enable automatic sync** to merge this browser's workout history with your private account.
4. On your other phone and computer, sign in with the same email/password and enable sync once on each device.
5. Wait for **Workouts synced** before switching devices.

The email-link option remains available. Password sign-in lets you sign in directly within an installed phone app. Email verification is required. A downloaded HTML guide saves locally and directs users to the hosted app for sync.

Saved and partial sessions sync with exercise details, actual weights/sets/repetitions, time, distance, customizations, notes, recorded level/time budget, readiness snapshots and recoverable deletions. Selected week/day, planner preferences and global gym inventory stay on each device. Downloaded sessions appear in Log; they do not automatically take over that device's active workout.

Sync runs while the app is open, after local changes, on reconnection and on return to the foreground. A phone lock screen can pause it. Offline work remains on the device until sync succeeds. Local-save and sync statuses are separate.

Distinct sessions merge by identity. Concurrent edits to the same session retain a separate conflict entry with the original actuals. Deletions propagate with recovery records. Revision checks reject outdated cloud saves. These behaviors have regression coverage; see the verification notes for the limits of live/device checks.

A local recovery copy is verified before the first cloud merge. Export/import remains available for manual recovery. Disconnect sync before replacing browser data with a backup; reconnection merges the imported history with cloud records. Signing out keeps downloaded workouts in the browser. Use trusted devices. The app refuses to upload an existing account's browser history into a different account.

Supabase's default email provider is currently configured. It sends verification emails only to Supabase organization members and has a low email-send limit. Configure custom SMTP before offering account creation to other users. No paid plan was enabled for this feature. The deployed project settings and live verification results are recorded in SYNC-STATUS.md (beside dist in the saved project).

## Recover password or account access

Open Sync & devices and choose Forgot password or need account access?. Enter the existing account email and select Send recovery email. Open the latest email link, choose and confirm a new password, then save it. A valid authenticated recovery session is required; expired links offer a new-email request. Sync pauses during the password update. Workout records are not used to store passwords or recovery tokens.

For access without a password, the sign-in email option is still available. If email access is lost, recover the email account through its provider first. The in-app help links to Gmail recovery and advises exporting a workout backup from any trusted device that is still signed in. A new account does not automatically inherit another account's cloud records. Default email-provider delivery restrictions apply to recovery emails as well.

## Data and access

The frontend includes only a Supabase project URL and publishable client key. Authentication credentials are separate from workout exports. The database restricts account history reads to the authenticated owner. The public save RPC uses an invoker wrapper around a private-schema writer that derives the owner from auth.uid(), serializes writes, checks revisions and retains history keys. Anonymous access and direct client writes are revoked.

Backend setup and rollback-based isolation tests: backend/ in the public source, or beside dist in the saved project. The pinned Supabase JavaScript client is bundled locally. Rebuild tooling and lockfile are under sync-tooling/ in the public source, or work/sync-tooling in the saved project. Personal recovery JSON files must not be published to GitHub.

## Phone and offline use

On iPhone, open the app in Safari, select Share, then Add to Home Screen. On Android, open it in Chrome and select Install app or Add to Home screen. Open once online to cache the written guides and illustrations. Videos and external evidence links require internet. Timers catch up when the app is visible again; lock screens may suspend alerts.

## Training features

- Exercise-card movement options, independent equipment checklists and completion marks.
- Illustrated mechanics plus optional videos, written setup and evidence links.
- Rookie, Intermediate and Advanced levels, with 30–120-minute budgets.
- Movable boxing-week routines, optional recovery days and separate session attempts.
- Custom exercises and measured actuals, separated from prescribed work.
- Weekly/all-week logs, editing, comparison, recoverable deletion and backups.

The exact workout programming and readiness rules are app design choices informed by the cited sources, not a clinically validated complete intervention. Use coaching for technique and competition preparation.

## Local development

Serve this directory over HTTP. From the saved project root, run:

    node work/serve.cjs

The local preview uses separate browser storage from the public app.

Tests from the app source directory (work/boxing-companion/dist in the saved project):

    node tests/check-sync.cjs
    node tests/check-sync-ui.cjs
    node tests/check-log-management.cjs
    node tests/check-readiness.cjs

Other regression suites in tests cover app behavior, language/content, videos, planning/choices, history, actual performance and custom exercises. The sync tests cover independent stores, concurrent edits, deletion conflicts, offline work, storage failure, account boundaries, email/password registration, confirmation, alternative email/code sign-in and Spanish labels.

See SYNC-STATUS.md (beside dist in the saved project) for what was verified live and which physical-device checks remain.
