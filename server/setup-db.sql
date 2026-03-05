-- One-time setup: run as MySQL root to create database and app user.
-- Usage: mysql -u root -p < setup-db.sql
-- Enter your root password when prompted.
-- If user 'ganesh' already exists, you can skip this or run: DROP USER 'ganesh'@'localhost'; first.

CREATE DATABASE IF NOT EXISTS ganesh_jewellers;

CREATE USER 'ganesh'@'localhost' IDENTIFIED BY 'ganesh';
GRANT ALL PRIVILEGES ON ganesh_jewellers.* TO 'ganesh'@'localhost';
FLUSH PRIVILEGES;
