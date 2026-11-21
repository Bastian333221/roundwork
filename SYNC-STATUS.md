# ROUNDWORK 1.12.0 automatic workout-log sync

Configuration and validation recorded on 21 November 2026.

## Configured backend
Dedicated Supabase project ROUNDWORK: rxfyylrjcjxaxlgimcdp, organization Bastian333221, us-east-2.
Site URL: https://bastian333221.github.io/roundwork/
Redirect allowlist: production app above and http://127.0.0.1:4324/.

Email accounts are enabled; verification is required; anonymous accounts are disabled. Multiple device sessions are allowed. Create an account, confirm email once, sign in with email/password on each device, then enable sync on each device. Alternative sign-in email remains available.

Supabase's default email provider is configured. Verification delivery is restricted to Supabase organization members, with a low send limit. Custom SMTP is needed for other users. No paid plan or custom SMTP was enabled. The provider rejected custom templates on the current free/default-email setup. Standard confirmation links remain; a code is not promised in every email.

Auth settings were completed through the connected Supabase management API via Composio. Browser extension changes were unnecessary. No extension was disabled or uninstalled.

## Data and security
The table public.roundwork_workout_history is keyed by authenticated owner and has row-level security. Clients can read only their own history. Anonymous reads and RPC execution, and direct client insert/update/delete, are revoked.

The public save RPC is a SECURITY INVOKER wrapper. Its private-schema writer derives the owner from auth.uid(), uses an empty search path, serializes owner writes, checks revisions and document size/shape, and retains history keys for recoverable deletion.

Live rollback-based SQL checks passed: anonymous denial, owner isolation, stale-save rejection, required authentication, retained history keys, payload checks and direct-write denial. A subsequent count found zero authentication users and zero workout accounts. No personal logs were uploaded or real accounts created during implementation. Supabase's security advisor returned no findings after the private-writer migration. This targeted review is not a penetration test or security certification.

HTTP checks: Auth settings 200; anonymous table reads and saves 401.

## Client behavior
Sync includes saved/partial history, exercises, actual weights/sets/repetitions, time, distance, customizations, recorded level/time budget, notes, readiness snapshots and deleted-session recovery. Selected week/day, planner choices and global gym inventory stay local. Downloaded sessions appear in Log and do not become another device's active workout. Lifting programming is unchanged.

Distinct session identities merge. Concurrent edits retain a separate conflict entry. Offline changes retry on reconnection. Sync runs while the app is open; phone locks/background suspension can pause it. Wait for Workouts synced before switching devices.

A recovery copy is saved and read back before the first merge. Disconnect before replacing browser data with a backup; reconnection merges imported and cloud history. Sign-out retains downloaded workouts locally. Account binding refuses upload into a different account.

Only the project URL and publishable key are included in the client. Authentication storage is excluded from workout exports. The pinned official supabase-js 2.119.2 browser bundle and dependency license notices are included.

## Verification
- 76 sync core/controller checks.
- 104 account/UI checks, including password registration/login, confirmation, alternative email/code, Spanish, consent, recovery, disconnect and downloaded-guide behavior.
- Existing app, language, video, planner/choices, history, performance, customization, readiness and log-management suites passed after the release update.
- Sign-in layout inspected at 390 x 844 and 1280 x 900, in English and Spanish.
- Independent-store simulations cover upload/download, concurrency, offline retry, edits during upload, deletion recovery, storage failure and account boundaries.
- Older test storage mocks now return previous writes, matching real localStorage behavior and stale-tab protection.

Real email delivery, authenticated browser-to-browser transfers, and physical Android/iPhone sync have not yet been verified. The user must create the real account and connect devices. Do not use personal history as disposable test data.

Deployment commit/run evidence is recorded separately in project outputs. Repository Actions: https://github.com/Bastian333221/roundwork/actions

## Source layout
Local: work/boxing-companion/dist, backend beside dist, build tooling at work/sync-tooling.
Public repository/source ZIP: app at root, backend/, SYNC-STATUS.md, sync-tooling/.

## References
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
