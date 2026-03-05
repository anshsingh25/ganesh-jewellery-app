#!/bin/bash
# Run this AFTER starting MySQL in XAMPP (open XAMPP app → Start MySQL).
# Usage: ./setup-xampp.sh

set -e
cd "$(dirname "$0")"

MYSQL="/Applications/XAMPP/xamppfiles/bin/mysql"

echo "Creating database and user..."

# Try root with no password first, then with password 'root'
if $MYSQL -u root -e "SELECT 1" &>/dev/null; then
  $MYSQL -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS ganesh_jewellers;
DROP USER IF EXISTS 'ganesh'@'localhost';
CREATE USER 'ganesh'@'localhost' IDENTIFIED BY 'ganesh';
GRANT ALL PRIVILEGES ON ganesh_jewellers.* TO 'ganesh'@'localhost';
FLUSH PRIVILEGES;
SQL
elif $MYSQL -u root -proot -e "SELECT 1" &>/dev/null; then
  $MYSQL -u root -proot <<'SQL'
CREATE DATABASE IF NOT EXISTS ganesh_jewellers;
DROP USER IF EXISTS 'ganesh'@'localhost';
CREATE USER 'ganesh'@'localhost' IDENTIFIED BY 'ganesh';
GRANT ALL PRIVILEGES ON ganesh_jewellers.* TO 'ganesh'@'localhost';
FLUSH PRIVILEGES;
SQL
else
  echo "ERROR: Could not connect to MySQL. Is MySQL running in XAMPP?"
  echo "Open XAMPP → Start MySQL, then run this script again."
  exit 1
fi

echo "Running init-db..."
npm run init-db

echo "Done. You can start the server with: npm start"
