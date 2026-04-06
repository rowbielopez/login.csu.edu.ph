<?php
declare(strict_types=1);

/*
 * Generic Firebase handoff endpoint template.
 *
 * Copy this file into a target system as `api/auth/verify.php`, then customize:
 * 1. require paths
 * 2. database connection
 * 3. user lookup query
 * 4. session mapping
 * 5. redirect mapping
 *
 * This template is intentionally structured so the app-specific parts are isolated
 * in a few small functions near the bottom.
 */

require_once __DIR__ . '/../../vendor/autoload.php';
// require_once __DIR__ . '/../../src/config/bootstrap.php';

const FIREBASE_PROJECT_ID = 'your-firebase-project-id';
const MYCSU_HOME_URL = 'http://localhost/mycsu/';
const SYSTEM_LOGIN_URL = 'http://localhost/your-system/';
const SYSTEM_HOME_URL = 'http://localhost/your-system/';

header('Content-Type: application/json; charset=UTF-8');

handle_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_error('Method not allowed.', 405);
}

$idToken = get_id_token_from_request();
if ($idToken === null) {
    respond_error('Missing Firebase ID token.', 400);
}

try {
    $claims = verify_firebase_id_token($idToken);
    $email = normalize_email((string) ($claims['email'] ?? ''));

    if ($email === '') {
        throw new RuntimeException('Email not found in token.');
    }

    $pdo = get_pdo_connection();
    $user = find_local_user_by_email($pdo, $email);

    if ($user === null) {
        respond_error('Access denied. Your CSU account is not registered in this system.', 403, MYCSU_HOME_URL);
    }

    ensure_user_is_allowed($user);

    session_start();
    session_regenerate_id(true);

    foreach (build_session_payload($user, $email) as $key => $value) {
        $_SESSION[$key] = $value;
    }

    $redirect = build_redirect($user);

    if (is_form_post()) {
        header('Location: ' . $redirect);
        exit;
    }

    echo json_encode([
        'message' => 'Authorized.',
        'redirect' => $redirect,
        'email' => $email,
    ]);
} catch (Throwable $e) {
    $message = $e->getMessage() !== '' ? $e->getMessage() : 'Invalid or expired Firebase token.';
    respond_error($message, 401, MYCSU_HOME_URL);
}

function handle_cors(): void
{
    $allowedOrigins = [
        'http://localhost',
        'http://localhost:80',
        'https://mycsu.csu.edu.ph',
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    }
}

function get_id_token_from_request(): ?string
{
    $input = json_decode(file_get_contents('php://input') ?: '', true);
    $idToken = is_array($input) ? ($input['idToken'] ?? null) : null;

    if (!$idToken && isset($_POST['idToken'])) {
        $idToken = $_POST['idToken'];
    }

    if (!is_string($idToken)) {
        return null;
    }

    $idToken = trim($idToken);
    return $idToken !== '' ? $idToken : null;
}

function verify_firebase_id_token(string $idToken): array
{
    if (class_exists('Kreait\\Firebase\\Factory')) {
        return verify_with_firebase_admin_sdk($idToken);
    }

    if (class_exists('Firebase\\JWT\\JWT') && class_exists('Firebase\\JWT\\JWK')) {
        return verify_with_public_jwks($idToken);
    }

    throw new RuntimeException('No Firebase token verification library is installed.');
}

function verify_with_firebase_admin_sdk(string $idToken): array
{
    $serviceAccountPath = __DIR__ . '/../../config/firebase-service-account.json';
    if (!is_file($serviceAccountPath)) {
        throw new RuntimeException('Firebase service account JSON not found.');
    }

    $factory = (new \Kreait\Firebase\Factory())->withServiceAccount($serviceAccountPath);
    $auth = $factory->createAuth();
    $verifiedToken = $auth->verifyIdToken($idToken);

    return $verifiedToken->claims()->all();
}

function verify_with_public_jwks(string $idToken): array
{
    $issuer = 'https://securetoken.google.com/' . FIREBASE_PROJECT_ID;
    $jwksUrl = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
    $response = file_get_contents($jwksUrl);
    $jwks = json_decode($response ?: '', true);

    if (!is_array($jwks)) {
        throw new RuntimeException('Unable to fetch Firebase public keys.');
    }

    $keys = \Firebase\JWT\JWK::parseKeySet($jwks, 'RS256');
    $decoded = \Firebase\JWT\JWT::decode($idToken, $keys);

    if (($decoded->aud ?? '') !== FIREBASE_PROJECT_ID) {
        throw new RuntimeException('Invalid token audience.');
    }

    if (($decoded->iss ?? '') !== $issuer) {
        throw new RuntimeException('Invalid token issuer.');
    }

    return (array) $decoded;
}

function normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function get_pdo_connection(): PDO
{
    /*
     * Replace this with your actual system connection.
     * Example:
     * return new PDO(
     *     'mysql:host=localhost;dbname=your_system;charset=utf8mb4',
     *     'root',
     *     '',
     *     [
     *         PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
     *         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
     *     ]
     * );
     */
    return new PDO(
        'mysql:host=localhost;dbname=your_system;charset=utf8mb4',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
}

function find_local_user_by_email(PDO $pdo, string $email): ?array
{
    /*
     * Replace this query with the real user table for the target system.
     * Recommended minimum columns:
     * - user id
     * - email
     * - role
     * - active/status
     */
    $stmt = $pdo->prepare(
        'SELECT user_id, username, email, fullname, role, active FROM users WHERE email = :email LIMIT 1'
    );
    $stmt->execute(['email' => $email]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return is_array($user) ? $user : null;
}

function ensure_user_is_allowed(array $user): void
{
    if (array_key_exists('active', $user) && (int) $user['active'] !== 1) {
        throw new RuntimeException('Your account has been deactivated.');
    }

    /*
     * Add role checks here if needed.
     * Example:
     * if (!in_array($user['role'] ?? '', ['Administrator', 'Staff'], true)) {
     *     throw new RuntimeException('Your account is not authorized for this system.');
     * }
     */
}

function build_session_payload(array $user, string $email): array
{
    /*
     * This is the most important customization point.
     * Match the existing login session variables exactly.
     *
     * For legacy systems, include fallback keys if older pages still read them.
     */
    return [
        'user_id' => $user['user_id'] ?? null,
        'user_email' => $email,
        'username' => $user['username'] ?? $email,
        'fullname' => $user['fullname'] ?? '',
        'role' => $user['role'] ?? 'User',
        'is_authenticated' => true,
    ];
}

function build_redirect(array $user): string
{
    /*
     * Replace with the target system's real role-to-path rules.
     */
    $role = (string) ($user['role'] ?? '');

    if ($role === 'Administrator') {
        return SYSTEM_HOME_URL . 'admin/';
    }

    if ($role === 'Campus Admin') {
        return SYSTEM_HOME_URL . 'campus_admin/';
    }

    if ($role === 'Dean') {
        return SYSTEM_HOME_URL . 'dean/';
    }

    return SYSTEM_HOME_URL;
}

function respond_error(string $message, int $statusCode, ?string $redirectUrl = null): void
{
    http_response_code($statusCode);

    if (!wants_json_response()) {
        if ($redirectUrl !== null && $redirectUrl !== '') {
            header('Location: ' . $redirectUrl);
            exit;
        }

        render_error_page($message, $statusCode);
    }

    echo json_encode(['message' => $message]);
    exit;
}

function wants_json_response(): bool
{
    $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    $requestedWith = strtolower((string) ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''));

    return strpos($accept, 'application/json') !== false
        || strpos($contentType, 'application/json') !== false
        || $requestedWith === 'xmlhttprequest';
}

function is_form_post(): bool
{
    return isset($_POST['idToken']);
}

function render_error_page(string $message, int $statusCode): void
{
    header('Content-Type: text/html; charset=UTF-8');

    $safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $safeStatus = htmlspecialchars((string) $statusCode, ENT_QUOTES, 'UTF-8');
    $homeUrl = htmlspecialchars(MYCSU_HOME_URL, ENT_QUOTES, 'UTF-8');
    $systemUrl = htmlspecialchars(SYSTEM_LOGIN_URL, ENT_QUOTES, 'UTF-8');

    echo '<!DOCTYPE html>';
    echo '<html lang="en">';
    echo '<head>';
    echo '<meta charset="UTF-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    echo '<title>Access Error</title>';
    echo '<style>';
    echo 'body{font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;padding:24px;}';
    echo '.card{max-width:520px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,0.08);}';
    echo '.badge{display:inline-block;background:#fee2e2;color:#991b1b;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:16px;}';
    echo 'h1{font-size:20px;margin:0 0 8px;}';
    echo 'p{margin:0 0 20px;color:#475569;line-height:1.5;}';
    echo '.actions{display:flex;gap:12px;flex-wrap:wrap;}';
    echo 'a{display:inline-block;background:#800000;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:700;}';
    echo 'a.secondary{background:#e2e8f0;color:#0f172a;}';
    echo '</style>';
    echo '</head>';
    echo '<body>';
    echo '<div class="card">';
    echo '<div class="badge">Error ' . $safeStatus . '</div>';
    echo '<h1>Unable to Access System</h1>';
    echo '<p>' . $safeMessage . '</p>';
    echo '<div class="actions">';
    echo '<a href="' . $homeUrl . '">Back to MyCSU</a>';
    echo '<a class="secondary" href="' . $systemUrl . '">System Login</a>';
    echo '</div>';
    echo '</div>';
    echo '</body>';
    echo '</html>';
    exit;
}