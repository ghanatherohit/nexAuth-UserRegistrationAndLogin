<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!in_array($method, ['POST', 'DELETE', 'GET'])) {
    jsonResponse(false, 'Method not allowed');
}
// Read JSON body OR regular POST
$raw  = file_get_contents('php://input');
$json = json_decode($raw, true);
if ($json && is_array($json)) {
    $_POST = array_merge($_POST, $json);
}

$action = trim($_POST['action'] ?? 'login');

match ($action) {
    'login'      => handleLogin(),
    'logout'     => handleLogout(),
    'logout_all' => handleLogoutAll(),
    default      => handleLogin(),
};

function handleLogin(): never {
    $identifier = trim($_POST['identifier'] ?? '');
    $password   = $_POST['password']        ?? '';
    $remember   = ($_POST['remember']       ?? '0') === '1';

    if (!$identifier || !$password) {
        jsonResponse(false, 'Email and password are required.');
    }

    try {
        $pdo = getMySQL();

        // Check if identifier is email or username
        $isEmail = str_contains($identifier, '@');
        $column  = $isEmail ? 'email' : 'username';

        $stmt = $pdo->prepare(
            "SELECT id, username, email, name, password
             FROM   users
             WHERE  {$column} = ?
             LIMIT  1"
        );
        $stmt->execute([$isEmail ? strtolower($identifier) : $identifier]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            usleep(random_int(100000, 300000));
            jsonResponse(false, 'Invalid credentials. Please check and try again.');
        }

        // Generate session token
        $token  = generateToken();
        $userId = (string) $user['id'];
        $ttl    = $remember ? SESSION_TTL * 4 : SESSION_TTL;

        // Store in Redis
        $redis = getRedis();
        $redis->setEx('session:' . $token, $ttl, $userId);
        $redis->sAdd('user_sessions:' . $userId, $token);
        $redis->expire('user_sessions:' . $userId, $ttl);
        $redis->setEx('session_meta:' . $token, $ttl, json_encode([
            'user_id'    => $userId,
            'created_at' => date('c'),
            'remember'   => $remember,
        ]));

        jsonResponse(true, 'Login successful', [
            'token'    => $token,
            'user_id'  => $userId,
            'name'     => $user['name'],
            'username' => $user['username'],
            'email'    => $user['email'],
        ]);

    } catch (Throwable $e) {
        jsonResponse(false, $e->getMessage());
    }
}

function handleLogout(): never {
    $token = trim($_POST['token'] ?? '');

    if ($token) {
        try {
            $redis  = getRedis();
            $userId = $redis->get('session:' . $token);
            $redis->del('session:' . $token);
            $redis->del('session_meta:' . $token);
            if ($userId) {
                $redis->sRem('user_sessions:' . $userId, $token);
            }
        } catch (Throwable $e) {
            error_log('Logout Error: ' . $e->getMessage());
        }
    }

    jsonResponse(true, 'Logged out successfully');
}

function handleLogoutAll(): never {
    $token  = trim($_POST['token']   ?? '');
    $userId = trim($_POST['user_id'] ?? '');

    if (!$token || !$userId) {
        jsonResponse(false, 'Missing parameters');
    }

    try {
        $redis    = getRedis();
        $sessions = $redis->sMembers('user_sessions:' . $userId);
        foreach ($sessions as $sess) {
            $redis->del('session:' . $sess);
            $redis->del('session_meta:' . $sess);
        }
        $redis->del('user_sessions:' . $userId);
    } catch (Throwable $e) {
        error_log('LogoutAll Error: ' . $e->getMessage());
    }

    jsonResponse(true, 'All sessions terminated');
}
