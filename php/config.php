<?php
require_once __DIR__ . '/../vendor/autoload.php';
/**
 * config.php — Database connections: MySQL, MongoDB, Redis
 * All credentials configurable via environment variables for security.
 */

// ── MySQL Configuration ──
define('MYSQL_HOST',   getenv('MYSQL_HOST')   ?: '127.0.0.1');
define('MYSQL_USER',   getenv('MYSQL_USER')   ?: 'root');
define('MYSQL_PASS',   getenv('MYSQL_PASS')   ?: '');
define('MYSQL_DB',     getenv('MYSQL_DB')     ?: 'nexus_auth');
define('MYSQL_PORT',   getenv('MYSQL_PORT')   ?: 3307);

// ── MongoDB Configuration ──
define('MONGO_URI',    getenv('MONGO_URI')    ?: 'mongodb://localhost:27017');
define('MONGO_DB',     getenv('MONGO_DB')     ?: 'nexus_profiles');

// ── Redis Configuration ──
define('REDIS_HOST',   getenv('REDIS_HOST')   ?: '127.0.0.1');
define('REDIS_PORT',   getenv('REDIS_PORT')   ?: 6379);
define('REDIS_PASS',   getenv('REDIS_PASS')   ?: null);
define('SESSION_TTL',  60 * 60 * 24 * 7); // 7 days

// ── App Config ──
define('APP_NAME',    'Nexus');
define('TOKEN_LEN',    64);

/**
 * Get MySQL PDO connection (singleton pattern)
 */
function getMySQL(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            MYSQL_HOST, MYSQL_PORT, MYSQL_DB
        );
        $pdo = new PDO($dsn, MYSQL_USER, MYSQL_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

/**
 * Get MongoDB collection
 */
function getMongoDB(): MongoDB\Database {
    static $db = null;
    if ($db === null) {
        $client = new MongoDB\Client(MONGO_URI);
        $db     = $client->selectDatabase(MONGO_DB);
    }
    return $db;
}

/**
 * Get Redis connection (singleton)
 */
function getRedis(): Redis {
    static $redis = null;
    if ($redis === null) {
        $redis = new Redis();
        $redis->connect(REDIS_HOST, (int) REDIS_PORT);
        if (REDIS_PASS) {
            $redis->auth(REDIS_PASS);
        }
    }
    return $redis;
}

/**
 * Generate a cryptographically secure token
 */
function generateToken(int $length = TOKEN_LEN): string {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Validate a session token against Redis
 * Returns user_id or false
 */
function validateSession(string $token): string|false {
    try {
        $redis  = getRedis();
        $userId = $redis->get('session:' . $token);
        return $userId ?: false;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Standardised JSON response helper
 */
function jsonResponse(bool $success, string $message = '', array $data = [], string $code = ''): never {
    header('Content-Type: application/json');
    $payload = ['success' => $success, 'message' => $message];
    if ($code)   $payload['code'] = $code;
    if ($data)   $payload = array_merge($payload, $data);
    echo json_encode($payload);
    exit;
}

/**
 * Setup MySQL tables on first run
 */
function ensureMySQLSchema(): void {
    $pdo = getMySQL();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
            username   VARCHAR(40)       NOT NULL UNIQUE,
            email      VARCHAR(180)      NOT NULL UNIQUE,
            name       VARCHAR(120)      NOT NULL,
            password   VARCHAR(255)      NOT NULL,
            created_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_email    (email),
            INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
}
