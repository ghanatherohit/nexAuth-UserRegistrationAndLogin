# NexAuth — Setup Guide

## Prerequisites
- PHP 8.2+
- MySQL 8.0+ or MariaDB (XAMPP default)
- MongoDB 8.0+ with PHP driver
- Redis (Memurai for Windows)
- Composer

## Installation Steps

### 1. Clone the repository
```bash
git clone https://github.com/YourUsername/UserRegistrationAndLogin.git
cd UserRegistrationAndLogin
```

### 2. Install PHP dependencies
```bash
composer require mongodb/mongodb
```

### 3. MySQL Setup
- Start MySQL in XAMPP Control Panel
- Open phpMyAdmin at http://localhost/phpmyadmin
- Create database: `nexus_auth` with collation `utf8mb4_unicode_ci`
- The `users` table is created automatically on first registration
- Or run the schema manually:
```bash
mysql -u root < assets/schema.sql
```

### 4. MongoDB Setup
- MongoDB runs as a Windows service (auto-start)
- The `nexus_profiles` database and `profiles` collection
  are created automatically on first registration

### 5. Redis Setup
- Redis (Memurai) runs as a Windows service (auto-start)
- Verify: open cmd and run `redis-cli ping` — should return PONG

### 6. PHP Extensions Required
Add to php.ini in XAMPP:
```
extension=mongodb
extension=redis
```
Download matching DLLs from pecl.php.net for your PHP version.

### 7. Configure Database Connection
Edit `php/config.php` if needed:
- `MYSQL_HOST` — default: 127.0.0.1
- `MYSQL_PORT` — default: 3306 (or 3307 for some XAMPP installs)
- `MYSQL_DB`   — default: nexus_auth
- `MYSQL_USER` — default: root
- `MYSQL_PASS` — default: empty

### 8. Run the Project
Point XAMPP document root to the project folder or place it in:
```
C:\xampp\htdocs\nexus\
```
Then visit: http://localhost/nexus

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 + Bootstrap 5.3 + jQuery AJAX |
| Styling | CSS3 — Dark Glassmorphism theme |
| Auth Database | MySQL — PDO with Real Prepared Statements |
| Profile Database | MongoDB — profiles collection |
| Session Backend | Redis — token with 7 day TTL |
| Session Frontend | localStorage — key: nexauth_token |

## Flow
```
Register → Login → Profile
```
- Register: stores credentials in MySQL, profile skeleton in MongoDB
- Login: validates against MySQL, creates Redis session token,
  stores token in localStorage
- Profile: validates token against Redis on every request,
  loads account from MySQL and profile details from MongoDB
- Logout: deletes token from Redis and localStorage

## Folder Structure
```
nexus/
├── assets/
│   ├── schema.sql
│   └── README_SETUP.md
├── css/
│   └── style.css
├── js/
│   ├── login.js
│   ├── profile.js
│   └── register.js
├── php/
│   ├── config.php
│   ├── login.php
│   ├── profile.php
│   └── register.php
├── index.html
├── login.html
├── profile.html
├── register.html
├── composer.json
├── .gitignore
└── README.md
```