-- NexAuth MySQL Schema
-- Run this once to set up the database

CREATE DATABASE IF NOT EXISTS nexus_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nexus_auth;

CREATE TABLE IF NOT EXISTS users (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username   VARCHAR(40)  NOT NULL UNIQUE,
    email      VARCHAR(180) NOT NULL UNIQUE,
    name       VARCHAR(120) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email    (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
