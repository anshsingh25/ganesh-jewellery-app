/**
 * SQLite database reference and migrations.
 * The db is set by SQLiteProvider's onInit in App.tsx.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;

export function setDb(database: SQLiteDatabase): void {
  db = database;
}

export function getDb(): SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Ensure SQLiteProvider has run onInit.');
  return db;
}

const DATABASE_VERSION = 2;

export async function runMigrations(database: SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');

  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    await seedDefaultSchemes(database);
    // Ensure v2 columns exist on customer (in case DB was at v2 before these were added)
    await ensureCustomerV2Columns(database);
    return;
  }

  if (currentVersion === 0) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        pin TEXT
      );

      CREATE TABLE IF NOT EXISTS customer (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        address TEXT,
        idProofUrl TEXT,
        customerPin TEXT,
        schemeType INTEGER NOT NULL,
        monthlyEmiAmount INTEGER NOT NULL,
        startDate TEXT NOT NULL,
        status TEXT NOT NULL,
        completedDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS installment (
        id TEXT PRIMARY KEY NOT NULL,
        customerId TEXT NOT NULL,
        monthNumber INTEGER NOT NULL,
        dueDate TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        paidDate TEXT,
        paidAmount INTEGER,
        note TEXT,
        FOREIGN KEY (customerId) REFERENCES customer(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_installment_customer ON installment(customerId);

      CREATE TABLE IF NOT EXISTS key_value (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
  }

  if (currentVersion < 2) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS scheme (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        months INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1
      );
      INSERT OR IGNORE INTO scheme (id, name, months, isActive) VALUES ('scheme-5', '5 Months', 5, 1);
      INSERT OR IGNORE INTO scheme (id, name, months, isActive) VALUES ('scheme-11', '11 Months', 11, 1);
    `);
    try {
      await database.execAsync('ALTER TABLE customer ADD COLUMN documentStatus TEXT DEFAULT \'pending\'');
    } catch (_) {}
    try {
      await database.execAsync('ALTER TABLE customer ADD COLUMN documentVerifiedAt TEXT');
    } catch (_) {}
    try {
      await database.execAsync('ALTER TABLE customer ADD COLUMN documentVerifiedBy TEXT');
    } catch (_) {}
    try {
      await database.execAsync('ALTER TABLE customer ADD COLUMN autoPayEnabled INTEGER DEFAULT 0');
    } catch (_) {}
    try {
      await database.execAsync('ALTER TABLE customer ADD COLUMN schemeId TEXT');
    } catch (_) {}
  }

  await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);

  // Always ensure default schemes exist (5 and 11 months)
  await seedDefaultSchemes(database);
  await ensureCustomerV2Columns(database);
}

async function ensureCustomerV2Columns(database: SQLiteDatabase): Promise<void> {
  const columns = [
    { sql: "ALTER TABLE customer ADD COLUMN documentStatus TEXT DEFAULT 'pending'", name: 'documentStatus' },
    { sql: 'ALTER TABLE customer ADD COLUMN documentVerifiedAt TEXT', name: 'documentVerifiedAt' },
    { sql: 'ALTER TABLE customer ADD COLUMN documentVerifiedBy TEXT', name: 'documentVerifiedBy' },
    { sql: 'ALTER TABLE customer ADD COLUMN autoPayEnabled INTEGER DEFAULT 0', name: 'autoPayEnabled' },
    { sql: 'ALTER TABLE customer ADD COLUMN schemeId TEXT', name: 'schemeId' },
    { sql: 'ALTER TABLE customer ADD COLUMN whatsappNumber TEXT', name: 'whatsappNumber' },
  ];
  for (const { sql } of columns) {
    try {
      await database.execAsync(sql);
    } catch (_) {
      // Column already exists
    }
  }
}

async function seedDefaultSchemes(database: SQLiteDatabase): Promise<void> {
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS scheme (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        months INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1
      );
    `);
    await database.runAsync(
      'INSERT OR IGNORE INTO scheme (id, name, months, isActive) VALUES (?, ?, ?, ?)',
      'scheme-5',
      '5 Months',
      5,
      1
    );
    await database.runAsync(
      'INSERT OR IGNORE INTO scheme (id, name, months, isActive) VALUES (?, ?, ?, ?)',
      'scheme-11',
      '11 Months',
      11,
      1
    );
  } catch (_) {
    // ignore
  }
}
