/**
 * MySQL connection pool for Ganesh Jewellers backend.
 */

const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (!pool) {
    const config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'ganesh_jewellers',
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
