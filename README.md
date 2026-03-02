# NexAuth — User Registration and Login System

A full-stack authentication system built with PHP, MySQL, MongoDB, and Redis.

## Live Demo
GitHub: https://github.com/ghanatherohit/UserRegistrationAndLogin

## Tech Stack
- HTML + Bootstrap 5 + jQuery AJAX
- PHP 8.2
- MySQL — user credentials with prepared statements
- MongoDB — user profile details
- Redis — session token storage (7 day TTL)
- localStorage — frontend session management

## Features
- User registration with password strength meter
- Login with email or username
- Profile page with age, DOB, contact, city, country, occupation, bio
- Edit and update profile details
- Secure logout — clears Redis session and localStorage
- Bcrypt password hashing (cost 12)
- Redis session validation on every request
- No PHP sessions used anywhere

## Flow
Register → Login → Profile

## Setup
See `assets/README_SETUP.md` for full setup instructions.

## Folder Structure
See `assets/README_SETUP.md` for folder structure.
