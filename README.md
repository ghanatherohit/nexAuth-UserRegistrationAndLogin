# NexAuth — User Registration and Login System

A full-stack authentication system built with PHP, MySQL, MongoDB, and Redis.

![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=flat&logo=php)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=flat&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=flat&logo=redis)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap)

---

## Features

- User registration with password strength meter
- Login with email or username
- Profile page with age, DOB, contact, city, country, occupation, bio
- Edit and update profile details
- Secure logout — clears Redis session and localStorage
- Bcrypt password hashing (cost 12)
- Redis session validation on every request
- No PHP sessions used anywhere

---

## Flow

```
Register → Login → Profile
```

- **Register** — stores credentials in MySQL, profile skeleton in MongoDB
- **Login** — validates against MySQL, creates Redis session token, stores token in localStorage
- **Profile** — validates token against Redis on every request, loads account from MySQL and profile details from MongoDB
- **Logout** — deletes token from Redis and clears localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 + Bootstrap 5.3 + jQuery AJAX |
| Styling | CSS3 — Dark Glassmorphism theme |
| Auth Database | MySQL — PDO with Real Prepared Statements |
| Profile Database | MongoDB — profiles collection |
| Session Backend | Redis — token with 7 day TTL |
| Session Frontend | localStorage — key: `nexauth_token` |

---

## Folder Structure

```
nexus/
├── assets/
│   ├── schema.sql          ← MySQL table schema
│   └── README_SETUP.md     ← Detailed setup guide
├── css/
│   └── style.css           ← All styles (dark glassmorphism theme)
├── js/
│   ├── login.js            ← Login logic — jQuery AJAX + localStorage
│   ├── profile.js          ← Profile load/edit/save/logout
│   └── register.js         ← Registration logic — jQuery AJAX
├── php/
│   ├── config.php          ← MySQL, MongoDB, Redis connections
│   ├── login.php           ← Login API + Redis session creation
│   ├── profile.php         ← Profile GET/POST/DELETE API
│   └── register.php        ← Registration API
├── index.html              ← Landing page
├── login.html              ← Login page
├── profile.html            ← Profile dashboard
├── register.html           ← Registration page
├── composer.json           ← PHP dependencies
├── .gitignore
└── README.md
```

---

## Prerequisites

- PHP 8.2+
- MySQL 8.0+ or MariaDB (XAMPP default)
- MongoDB 8.0+ with PHP driver
- Redis / Memurai (Windows)
- Composer

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ghanatherohit/nexAuth-UserRegistrationAndLogin.git
cd nexAuth-UserRegistrationAndLogin
```

### 2. Install PHP dependencies

```bash
composer require mongodb/mongodb
```

### 3. MySQL Setup

- Start MySQL in XAMPP Control Panel
- Open phpMyAdmin at `http://localhost/phpmyadmin`
- Create database: `nexus_auth` with collation `utf8mb4_unicode_ci`
- The `users` table is created **automatically** on first registration
- Or run the schema manually:

```bash
mysql -u root < assets/schema.sql
```

### 4. MongoDB Setup

- MongoDB runs as a Windows service (auto-start)
- The `nexus_profiles` database and `profiles` collection are created automatically on first registration

### 5. Redis Setup

- Redis (Memurai) runs as a Windows service (auto-start)
- Verify by opening cmd and running:

```bash
redis-cli ping
```

Should return `PONG`.

### 6. PHP Extensions Required

Add to `php.ini` in XAMPP:

```ini
extension=mongodb
extension=redis
```

Download matching DLLs from [pecl.php.net](https://pecl.php.net) for your exact PHP version, Thread Safety, and architecture.

### 7. Configure Database Connection

Edit `php/config.php` if needed:

```
MYSQL_HOST  → 127.0.0.1
MYSQL_PORT  → 3306 (or 3307 for some XAMPP installs)
MYSQL_DB    → nexus_auth
MYSQL_USER  → root
MYSQL_PASS  → (empty by default)
MONGO_URI   → mongodb://localhost:27017
REDIS_HOST  → 127.0.0.1
REDIS_PORT  → 6379
```

### 8. Run the Project

Place the project folder in:

```
C:\xampp\htdocs\nexus\
```

Then visit:

```
http://localhost/nexus
```

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | `password_hash()` with bcrypt cost 12 |
| SQL injection prevention | 100% PDO prepared statements, `EMULATE_PREPARES = false` |
| Session security | Cryptographically random 64-char token via `random_bytes()` |
| Session storage | Redis with TTL — no PHP `$_SESSION` used anywhere |
| Timing attack prevention | `usleep(random_int())` on failed login |
| Token validation | Every request to profile.php validates token against Redis |

---
