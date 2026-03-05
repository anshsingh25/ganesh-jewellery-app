/**
 * Initialize MySQL database: create tables and seed default owner (pin: 1234).
 * Run: npm run init-db
 * Creates the database if it does not exist.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function init() {
  const database = process.env.MYSQL_DATABASE || 'ganesh_jewellers';
  const configWithoutDb = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  };
  const config = { ...configWithoutDb, database };

  let conn;
  try {
    conn = await mysql.createConnection({ ...configWithoutDb, multipleStatements: true });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await conn.end();
    conn = null;

    conn = await mysql.createConnection({ ...config, multipleStatements: true });
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(schema);

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
