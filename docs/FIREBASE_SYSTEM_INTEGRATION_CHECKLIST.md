# Firebase System Integration Checklist

Use this checklist when connecting another CSU system to MyCSU Google authentication.

## Goal

Make MyCSU the Google sign-in entry point, then hand the Firebase ID token to the target PHP system so it can create its own local session and redirect into its existing dashboard.

## Recommended Pattern

1. MyCSU signs the user in with Firebase Google Auth.
2. MyCSU gets the Firebase ID token from the current user.
3. MyCSU submits the token to the target system's `api/auth/verify.php` endpoint.
4. The target system verifies the token server-side.
5. The target system finds the matching local user by email.
6. The target system creates the same PHP session values its old login already expects.
7. The target system redirects to the correct landing page based on role.

## Before You Start

1. Confirm the target system already has local users stored in its own database.
2. Confirm the local user table has a reliable email column that matches the CSU Google account email.
3. Identify the current login flow and list every session variable it sets after a successful login.
4. Identify the redirect rules for each role.
5. Decide which token verification approach the target system will use:
   - Firebase Admin SDK via service account JSON
   - Firebase public JWK verification via `firebase/php-jwt`

## MyCSU Changes

1. Add a target auth endpoint constant in `app.js`.
2. Add or update the system card click handler so it posts `idToken` to the target system.
3. Keep the handoff as a normal form POST when you want the target system to own the redirect.
4. Keep the Firebase login state in MyCSU only for portal UX, not as the target system session.

## Login Page Changes Are Usually Optional

In most cases, MyCSU does not need to submit users to the target system's old `login.php` page.

Instead, MyCSU should post the Firebase ID token directly to the target system's `api/auth/verify.php` endpoint. That verifier endpoint should:

1. validate the token
2. look up the local user
3. create the same session values as the old login flow
4. redirect into the existing dashboard

Only change the target system login page when one of these is explicitly required:

1. add a `Sign in with MyCSU` button for discoverability
2. change the default entry route
3. deprecate the old username/password login UX
4. show a better unauthorized or back-to-MyCSU experience

## Target System Changes

1. Create `api/auth/verify.php`.
2. Accept both JSON body and form POST body for `idToken`.
3. Reject non-POST requests.
4. Verify the Firebase ID token.
5. Extract and normalize the email from the verified token.
6. Query the local user table by email.
7. Reject users that do not exist locally.
8. Reject users that are inactive, disabled, or the wrong role.
9. Start the PHP session and regenerate the session ID.
10. Set the exact session variables the existing app already uses.
11. Redirect to the role-specific landing page.
12. Return JSON only when the request is expecting JSON.

## Compatibility Check

This is the step most likely to break older systems.

1. Compare the old username/password login flow with the new Firebase handoff flow.
2. Match the old session keys exactly.
3. Match the old value shapes exactly.
4. Match the old redirect behavior exactly.
5. If the old pages read fallback session keys, set those too.

### HRIS Lesson

HRIS is a legacy-style system. It does not only need a verified email and one clean session key. It depends on older session names such as `username1`, `employee_id`, `id`, `user_type`, and `csuhris_login`.

If another system behaves like HRIS, do not try to simplify the session model first. Bridge into the old session contract, then refactor later if needed.

### OFES Lesson

OFES is the cleaner pattern. It already has a stable role-based session shape.

If another system behaves like OFES, the integration is simpler:

1. verify token
2. find local user by email
3. set the existing role session values
4. redirect by role

## Security Checklist

1. Never trust the email from the browser without verifying the Firebase token on the server.
2. Never store the Firebase service account JSON in a public directory.
3. Restrict CORS origins if the endpoint is used cross-origin.
4. Regenerate the PHP session ID after login.
5. Return generic error messages where possible.
6. Log enough details for debugging, but do not log raw tokens.
7. Enforce local account status and role checks even if the Google account is valid.

## Data You Must Inventory Per System

Record these before implementation:

1. Local user table name
2. Email column name
3. Role column name
4. Active/status column name
5. Session variables set by the old login
6. Landing page per role
7. Logout behavior
8. Base URL or app subfolder

## If The Apps Are Live On Different Domains

When moving from local development to live domains, the integration usually does not change structurally. What changes are the environment-specific values.

### Files To Update In MyCSU

1. `mycsu/app.js`
   - `firebaseConfig`
   - target system URLs such as `HRIS_AUTH_URL`, `HRIS_DASHBOARD_URL`, `HRIS_ADMIN_URL`, and `OFES_AUTH_URL`

### Files To Update In HRIS

1. `hris.csu.edu.ph/api/auth/verify.php`
   - allowed origins for CORS
   - MyCSU back-link URL in the access denied page
   - HRIS login URL and logo URL in the access denied page
   - PDO DSN, database username, and database password
   - redirect URLs after authorization
2. `hris.csu.edu.ph/config/firebase-service-account.json`
   - replace with the production service account for the correct Firebase project

If the main HRIS app also uses different database credentials in production, align its existing database connection files too. The Firebase verifier must query the same production user table the live HRIS app is using.

### Files To Update In OFES

1. `ofes/src/config/env.php`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
   - `APP_BASE`
   - `GOOGLE_CLIENT_ID` and `GOOGLE_ALLOWED_DOMAIN` only if OFES direct Google login is used
2. `ofes/api/auth/verify.php`
   - MyCSU fallback URL in unauthorized responses
   - Firebase project ID if production uses a different Firebase project
   - any system-specific redirect assumptions not already covered by `APP_BASE`

### Files To Update In A New Target System

1. the new system's `api/auth/verify.php`
   - token verification project or service account settings
   - database connection
   - local user lookup query
   - session mapping
   - redirect mapping
2. `mycsu/app.js`
   - the new system handoff endpoint URL

### External Settings To Update

1. Firebase Console
   - add the live MyCSU domain to authorized domains
   - replace the Firebase web app config if production uses a different Firebase project
2. DNS / web server / SSL
   - make sure all system URLs use the final `https://` domains
3. Session and cookie behavior
   - verify the target systems are generating local sessions on their own domains after the token handoff

### Practical Rule

If the target app is already working online by itself, do not rewrite the whole app for this integration. Usually you only need to update:

1. MyCSU endpoint URLs
2. the target system verifier endpoint
3. the target system database connection values
4. Firebase project or service-account values

You usually do not need to rewrite the old target-system login page for the first rollout.

## Validation Steps

1. Sign in through MyCSU with an allowed CSU account.
2. Open the target system.
3. Verify the target system creates a valid local PHP session.
4. Verify the correct dashboard opens for each role.
5. Verify an unregistered email is denied.
6. Verify an inactive account is denied.
7. Verify logout clears the local target-system session.
8. Verify the target system still works with its original login if that must remain supported.

## Reuse Order

When integrating a new system, copy this order:

1. clone the generic `verify.php` template
2. customize DB lookup
3. customize session mapping
4. customize redirect mapping
5. wire MyCSU `app.js` to post `idToken` to the new endpoint
6. test with one active user per role

## Current Reference Implementations

1. HRIS: legacy compatibility bridge
   - `hris.csu.edu.ph/api/auth/verify.php`
2. OFES: clean role/session bridge
   - `ofes/api/auth/verify.php`
3. MyCSU handoff source
   - `mycsu/app.js`