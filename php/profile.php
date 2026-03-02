<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: X-Auth-Token, X-User-Id, Content-Type');

require_once __DIR__ . '/config.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Read auth from headers ──
$token  = trim($_SERVER['HTTP_X_AUTH_TOKEN'] ?? '');
$userId = trim($_SERVER['HTTP_X_USER_ID']    ?? '');

if (!$token || !$userId) {
    jsonResponse(false, 'Authentication required', ['auth_error' => true]);
}

// ── Validate session via Redis ──
try {
    $redis         = getRedis();
    $storedUserId  = $redis->get('session:' . $token);

    if (!$storedUserId || $storedUserId !== $userId) {
        jsonResponse(false, 'Session expired. Please sign in again.', ['auth_error' => true]);
    }
} catch (Throwable $e) {
    jsonResponse(false, 'Session validation failed: ' . $e->getMessage(), ['auth_error' => true]);
}

$method = $_SERVER['REQUEST_METHOD'];

// ── Route by HTTP method ──
if ($method === 'GET') {
    handleGetProfile($userId);
} elseif ($method === 'POST') {
    handleUpdateProfile($userId, $token);
} elseif ($method === 'DELETE') {
    handleLogout($token, $userId);
} else {
    jsonResponse(false, 'Method not allowed');
}

// ──────────────────────────────────────
// GET — Load profile (MySQL + MongoDB)
// ──────────────────────────────────────
function handleGetProfile(string $userId): never {
    try {
        // Fetch account from MySQL
        $pdo  = getMySQL();
        $stmt = $pdo->prepare(
            'SELECT id, username, email, name, created_at
             FROM   users
             WHERE  id = ?
             LIMIT  1'
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonResponse(false, 'User not found.');
        }

        // Split name into first/last for the JS renderProfile function
        $nameParts = explode(' ', $user['name'], 2);
        $firstName = $nameParts[0]        ?? '';
        $lastName  = $nameParts[1]        ?? '';

        // Fetch profile from MongoDB
        $profileData = [];
        try {
            $mongo    = getMongoDB();
            $doc      = $mongo->profiles->findOne(['user_id' => $userId]);

            if ($doc) {
                $profileData = [
                    'dob'        => $doc['dob']        ?? '',
                    'gender'     => $doc['gender']     ?? '',
                    'contact'    => $doc['contact']    ?? ($doc['phone'] ?? ''),
                    'city'       => $doc['city']       ?? '',
                    'country'    => $doc['country']    ?? '',
                    'occupation' => $doc['occupation'] ?? '',
                    'bio'        => $doc['bio']        ?? '',
                ];
            }
        } catch (Throwable $mongoErr) {
            error_log('MongoDB fetch error: ' . $mongoErr->getMessage());
        }

        jsonResponse(true, 'Profile loaded', [
            'data' => [
                'id'         => $user['id'],
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'username'   => $user['username'],
                'email'      => $user['email'],
                'created_at' => $user['created_at'],
                'role'       => 'Member',
                'profile'    => $profileData,
            ]
        ]);

    } catch (Throwable $e) {
        jsonResponse(false, 'Failed to load profile: ' . $e->getMessage());
    }
}

// ──────────────────────────────────────
// POST — Update profile (MongoDB)
// ──────────────────────────────────────
function handleUpdateProfile(string $userId, string $token): never {
    // Read JSON body
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || !is_array($data)) {
        jsonResponse(false, 'Invalid request data.');
    }

    $dob        = trim($data['dob']        ?? '');
    $gender     = trim($data['gender']     ?? '');
    $contact    = trim($data['contact']    ?? '');
    $city       = trim($data['city']       ?? '');
    $country    = trim($data['country']    ?? '');
    $occupation = trim($data['occupation'] ?? '');
    $bio        = trim($data['bio']        ?? '');

    // Validate
    if ($dob && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob)) {
        jsonResponse(false, 'Invalid date of birth format.');
    }
    if ($bio && strlen($bio) > 300) {
        jsonResponse(false, 'Bio must be under 300 characters.');
    }

    try {
        $mongo    = getMongoDB();
        $profiles = $mongo->profiles;

        $updateData = [
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ];

        if ($dob !== '')        $updateData['dob']        = $dob;
        if ($gender !== '')     $updateData['gender']     = $gender;
        if ($contact !== '')    $updateData['contact']    = $contact;
        if ($city !== '')       $updateData['city']       = $city;
        if ($country !== '')    $updateData['country']    = $country;
        if ($occupation !== '') $updateData['occupation'] = $occupation;
        if ($bio !== '')        $updateData['bio']        = $bio;

        $profiles->updateOne(
            ['user_id' => $userId],
            ['$set'    => $updateData],
            ['upsert'  => true]
        );

        jsonResponse(true, 'Profile updated successfully.');

    } catch (Throwable $e) {
        jsonResponse(false, 'Failed to update profile: ' . $e->getMessage());
    }
}

// ──────────────────────────────────────
// DELETE — Logout (destroy Redis session)
// ──────────────────────────────────────
function handleLogout(string $token, string $userId): never {
    try {
        $redis = getRedis();
        $redis->del('session:' . $token);
        $redis->del('session_meta:' . $token);
        $redis->sRem('user_sessions:' . $userId, $token);
    } catch (Throwable $e) {
        error_log('Logout error: ' . $e->getMessage());
    }

    jsonResponse(true, 'Logged out successfully.');
}