<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Method not allowed');
}

// Read JSON body OR regular POST
$raw = file_get_contents('php://input');
$json = json_decode($raw, true);

// Merge json into POST so both methods work
if ($json && is_array($json)) {
    $_POST = array_merge($_POST, $json);
}

$action = trim($_POST['action'] ?? 'register');

match ($action) {
    'check_username' => handleCheckUsername(),
    'register'       => handleRegister(),
    default          => handleRegister(),
};

function handleCheckUsername(): never {
    $username = trim($_POST['username'] ?? '');
    if (strlen($username) < 3) {
        jsonResponse(false, 'Too short', ['available' => false]);
    }
    try {
        $pdo  = getMySQL();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $exists = (bool) $stmt->fetch();
        jsonResponse(true, '', ['available' => !$exists]);
    } catch (Throwable $e) {
        jsonResponse(false, $e->getMessage(), ['available' => false]);
    }
}

function handleRegister(): never {
    // Support both first_name/last_name and full name field
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName  = trim($_POST['last_name']  ?? '');
    $name      = trim($_POST['name']       ?? '');

    // Build full name from either format
    if (!$name && ($firstName || $lastName)) {
        $name = trim($firstName . ' ' . $lastName);
    }

    $username = trim($_POST['username'] ?? '');
    $email    = trim(strtolower($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    $dob      = trim($_POST['dob']     ?? '');
    $gender   = trim($_POST['gender']  ?? '');
    $phone    = trim($_POST['phone']   ?? '');
    $country  = trim($_POST['country'] ?? '');

    // Validation
    $errors = [];

    if (strlen($name) < 2 || strlen($name) > 120) {
        $errors[] = 'Please enter your full name.';
    }
    if (!preg_match('/^[a-zA-Z0-9_]{3,40}$/', $username)) {
        $errors[] = 'Invalid username format.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email address.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters.';
    }

    if (!empty($errors)) {
        jsonResponse(false, implode(' ', $errors));
    }

    try {
        $pdo = getMySQL();
        ensureMySQLSchema();

        // Check duplicate
        $stmt = $pdo->prepare(
            'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1'
        );
        $stmt->execute([$email, $username]);

        if ($stmt->fetch()) {
            jsonResponse(false, 'Email or username already registered.');
        }

        // Hash password
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        // Insert user
        $stmt = $pdo->prepare(
            'INSERT INTO users (username, email, name, password, created_at)
             VALUES (?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$username, $email, $name, $hash]);
        $userId = (string) $pdo->lastInsertId();

        // MongoDB profile (optional fields)
        try {
            $mongo    = getMongoDB();
            $profiles = $mongo->profiles;
            $profiles->insertOne([
                'user_id'    => $userId,
                'phone'      => $phone,
                'dob'        => $dob,
                'gender'     => $gender,
                'country'    => $country,
                'bio'        => '',
                'created_at' => new MongoDB\BSON\UTCDateTime(),
                'updated_at' => new MongoDB\BSON\UTCDateTime(),
            ]);
        } catch (Throwable $mongoErr) {
            error_log('MongoDB profile error: ' . $mongoErr->getMessage());
        }

        jsonResponse(true, 'Account created successfully!', [
            'user_id' => $userId
        ]);

    } catch (Throwable $e) {
        jsonResponse(false, $e->getMessage());
    }
}
