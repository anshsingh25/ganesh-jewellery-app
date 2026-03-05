/**
 * Initialize MySQL database: create tables and seed default owner (pin: 1234).
 * Run: npm run init-db (or on server start).
 * Creates the database if it does not exist.
 * Retries connection for Railway/containers where MySQL may start after the app.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connectWithRetry(config, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await mysql.createConnection(config);
    } catch (e) {
      console.warn(`MySQL connection attempt ${attempt}/${maxAttempts} failed:`, e.message || e.code);
      if (attempt === maxAttempts) throw e;
      await sleep(3000);
    }
  }
}

// Railway uses MYSQLHOST, MYSQLPORT, MYSQL_URL, etc.; support both naming styles
function getEnv(name, altName, fallback) {
  return process.env[name] || process.env[altName] || fallback;
}

async function init() {
  const database = getEnv('MYSQL_DATABASE', 'MYSQLDATABASE', 'ganesh_jewellers');
  const configWithoutDb = {
    host: getEnv('MYSQL_HOST', 'MYSQLHOST', 'localhost'),
    port: parseInt(getEnv('MYSQL_PORT', 'MYSQLPORT', '3306'), 10),
    user: getEnv('MYSQL_USER', 'MYSQLUSER', 'root'),
    password: getEnv('MYSQL_PASSWORD', 'MYSQLPASSWORD', ''),
  };
  const config = { ...configWithoutDb, database };

  console.log('MySQL connect:', configWithoutDb.host + ':' + configWithoutDb.port, 'user=' + configWithoutDb.user, 'database=' + database);

  let conn;
  try {
    conn = await connectWithRetry({ ...configWithoutDb, multipleStatements: true });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await conn.end();
    conn = null;

    conn = await connectWithRetry({ ...config, multipleStatements: true });
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(schema);

    // Index may already exist on re-run; ignore duplicate key (Railway MySQL may not support DROP INDEX IF EXISTS)
    try {
      await conn.execute('CREATE INDEX idx_installment_customer ON installments(customer_id)');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME' && e.errno !== 1061) throw e;
    }

    const [users] = await conn.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      const pinHash = await bcrypt.hash('1234', 10);
      await conn.execute(
        'INSERT INTO users (id, name, role, pin_hash) VALUES (?, ?, ?, ?)',
        ['owner-1', 'Owner', 'owner', pinHash]
      );
      console.log('Created default owner (pin: 1234)');
    }

    console.log('Database initialized successfully.');
  } catch (e) {
    const msg = e.message || e.code || String(e);
    console.error('Init failed:', msg);
    if (e.code === 'ECONNREFUSED') {
      console.error('Is MySQL running? Try: mysql.server start (Mac) or start MySQL service.');
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

init();
