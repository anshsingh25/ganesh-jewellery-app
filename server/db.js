/**
 * MySQL connection pool for Ganesh Jewellers backend.
 * Supports both MYSQL_HOST and MYSQLHOST (Railway) style env vars.
 */

const mysql = require('mysql2/promise');

let pool = null;

function getEnv(name, altName, fallback) {
  return process.env[name] || process.env[altName] || fallback;
}

function getPool() {
  if (!pool) {
    const config = {
      host: getEnv('MYSQL_HOST', 'MYSQLHOST', 'localhost'),
      port: parseInt(getEnv('MYSQL_PORT', 'MYSQLPORT', '3306'), 10),
      user: getEnv('MYSQL_USER', 'MYSQLUSER', 'root'),
      password: getEnv('MYSQL_PASSWORD', 'MYSQLPASSWORD', ''),
      database: getEnv('MYSQL_DATABASE', 'MYSQLDATABASE', 'ganesh_jewellers'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    pool = mysql.createPool(config);
  }
  return pool;
}

async function query(sql, params = []) {
  const p = getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { getPool, query, queryOne };
