/**
 * SQLite-backed storage for Ganesh Jewellers.
 * Replaces AsyncStorage with a proper database.
 */

import type { Customer, User, Installment, Scheme } from '../types';
import { getDb } from './db';

const KEY_LOGGED_IN_CUSTOMER = '@ganesh_logged_in_customer_id';
const KEY_REMINDERS = '@ganesh_reminders';
const KEY_MINIMUM_AMOUNT = '@ganesh_minimum_amount';
const KEY_PAYMENT_API_URL = '@ganesh_payment_api_url';

function rowToCustomer(row: Record<string, unknown>): Omit<Customer, 'installments'> {
  return {
    id: row.id as string,
    name: row.name as string,
    mobile: row.mobile as string,
    whatsappNumber: (row.whatsappNumber as string) || undefined,
    address: (row.address as string) || undefined,
    idProofUrl: (row.idProofUrl as string) || undefined,
    customerPin: (row.customerPin as string) || undefined,
    schemeType: row.schemeType as 5 | 11,
    monthlyEmiAmount: row.monthlyEmiAmount as number,
    startDate: row.startDate as string,
    status: row.status as 'active' | 'completed' | 'closed',
    completedDate: (row.completedDate as string) || undefined,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
    documentStatus: (row.documentStatus as 'pending' | 'verified' | 'rejected') || undefined,
    documentVerifiedAt: (row.documentVerifiedAt as string) || undefined,
    documentVerifiedBy: (row.documentVerifiedBy as string) || undefined,
    autoPayEnabled: row.autoPayEnabled === 1,
    schemeId: (row.schemeId as string) || undefined,
  };
}

function rowToInstallment(row: Record<string, unknown>): Installment {
  return {
    id: row.id as string,
    monthNumber: row.monthNumber as number,
    dueDate: row.dueDate as string,
    amount: row.amount as number,
    status: row.status as 'pending' | 'paid' | 'overdue',
    paidDate: (row.paidDate as string) || undefined,
    paidAmount: row.paidAmount != null ? (row.paidAmount as number) : undefined,
    note: (row.note as string) || undefined,
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const database = getDb();
  const customerRows = await database.getAllAsync<Record<string, unknown>>('SELECT * FROM customer ORDER BY createdAt DESC');
  const result: Customer[] = [];

  for (const row of customerRows) {
    const instRows = await database.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM installment WHERE customerId = ? ORDER BY monthNumber',
      row.id as string
    );
    result.push({
      ...rowToCustomer(row),
      installments: instRows.map(rowToInstallment),
    });
  }

  return result;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const database = getDb();
  const row = await database.getFirstAsync<Record<string, unknown>>('SELECT * FROM customer WHERE id = ?', id);
  if (!row) return null;

  const instRows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM installment WHERE customerId = ? ORDER BY monthNumber',
    id
  );

  return {
    ...rowToCustomer(row),
    installments: instRows.map(rowToInstallment),
  };
}

export async function addCustomer(customer: Customer): Promise<void> {
  const database = getDb();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO customer (id, name, mobile, whatsappNumber, address, idProofUrl, customerPin, schemeType, monthlyEmiAmount, startDate, status, completedDate, createdAt, updatedAt, documentStatus, documentVerifiedAt, documentVerifiedBy, autoPayEnabled, schemeId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      customer.id,
      customer.name,
      customer.mobile,
      customer.whatsappNumber ?? null,
      customer.address ?? null,
      customer.idProofUrl ?? null,
      customer.customerPin ?? null,
      customer.schemeType,
      customer.monthlyEmiAmount,
      customer.startDate,
      customer.status,
      customer.completedDate ?? null,
      customer.createdAt,
      customer.updatedAt,
      customer.documentStatus ?? 'pending',
      customer.documentVerifiedAt ?? null,
      customer.documentVerifiedBy ?? null,
      customer.autoPayEnabled ? 1 : 0,
      customer.schemeId ?? null
    );
    for (const inst of customer.installments) {
      await database.runAsync(
        `INSERT INTO installment (id, customerId, monthNumber, dueDate, amount, status, paidDate, paidAmount, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        inst.id,
        customer.id,
        inst.monthNumber,
        inst.dueDate,
        inst.amount,
        inst.status,
        inst.paidDate ?? null,
        inst.paidAmount ?? null,
        inst.note ?? null
      );
    }
  });
}

export async function updateCustomer(updated: Customer): Promise<void> {
  const database = getDb();
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE customer SET name=?, mobile=?, whatsappNumber=?, address=?, idProofUrl=?, customerPin=?, schemeType=?, monthlyEmiAmount=?, startDate=?, status=?, completedDate=?, updatedAt=?, documentStatus=?, documentVerifiedAt=?, documentVerifiedBy=?, autoPayEnabled=?, schemeId=?
       WHERE id = ?`,
      updated.name,
      updated.mobile,
      updated.whatsappNumber ?? null,
      updated.address ?? null,
      updated.idProofUrl ?? null,
      updated.customerPin ?? null,
      updated.schemeType,
      updated.monthlyEmiAmount,
      updated.startDate,
      updated.status,
      updated.completedDate ?? null,
      now,
      updated.documentStatus ?? 'pending',
      updated.documentVerifiedAt ?? null,
      updated.documentVerifiedBy ?? null,
      updated.autoPayEnabled ? 1 : 0,
      updated.schemeId ?? null,
      updated.id
    );
    await database.runAsync('DELETE FROM installment WHERE customerId = ?', updated.id);
    for (const inst of updated.installments) {
      await database.runAsync(
        `INSERT INTO installment (id, customerId, monthNumber, dueDate, amount, status, paidDate, paidAmount, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        inst.id,
        updated.id,
        inst.monthNumber,
        inst.dueDate,
        inst.amount,
        inst.status,
        inst.paidDate ?? null,
        inst.paidAmount ?? null,
        inst.note ?? null
      );
    }
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM installment WHERE customerId = ?', id);
  await database.runAsync('DELETE FROM customer WHERE id = ?', id);
}

export async function getUser(): Promise<User | null> {
  const database = getDb();
  const row = await database.getFirstAsync<Record<string, unknown>>('SELECT * FROM user LIMIT 1');
  if (!row) return null;
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as 'owner' | 'staff',
    pin: (row.pin as string) || undefined,
  };
}

export async function saveUser(user: User | null): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM user');
  if (user) {
    await database.runAsync(
      'INSERT INTO user (id, name, role, pin) VALUES (?, ?, ?, ?)',
      user.id,
      user.name,
      user.role,
      user.pin ?? null
    );
  }
}

export async function getLoggedInCustomerId(): Promise<string | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM key_value WHERE key = ?',
    KEY_LOGGED_IN_CUSTOMER
  );
  return row?.value ?? null;
}

export async function saveLoggedInCustomerId(customerId: string | null): Promise<void> {
  const database = getDb();
  if (customerId) {
    await database.runAsync(
      'INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)',
      KEY_LOGGED_IN_CUSTOMER,
      customerId
    );
  } else {
    await database.runAsync('DELETE FROM key_value WHERE key = ?', KEY_LOGGED_IN_CUSTOMER);
  }
}

export async function getReminderDueDates(): Promise<Record<string, string[]>> {
  const database = getDb();
  const row = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM key_value WHERE key = ?',
    KEY_REMINDERS
  );
  if (!row?.value) return {};
  try {
    return JSON.parse(row.value);
  } catch {
    return {};
  }
}

export async function setReminderDueDates(map: Record<string, string[]>): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)',
    KEY_REMINDERS,
    JSON.stringify(map)
  );
}

// Minimum payment amount (owner setting)
export async function getMinimumAmount(): Promise<number> {
  const database = getDb();
  const row = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM key_value WHERE key = ?',
    KEY_MINIMUM_AMOUNT
  );
  if (!row?.value) return 0;
  const n = parseInt(row.value, 10);
  return isNaN(n) ? 0 : n;
}

export async function setMinimumAmount(amount: number): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)',
    KEY_MINIMUM_AMOUNT,
    String(Math.max(0, amount))
  );
}

// Schemes (owner-managed)
export async function getSchemes(): Promise<Scheme[]> {
  const database = getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM scheme WHERE isActive = 1 ORDER BY months'
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    months: r.months as number,
    isActive: (r.isActive as number) === 1,
  }));
}

export async function getAllSchemes(): Promise<Scheme[]> {
  const database = getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM scheme ORDER BY months'
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    months: r.months as number,
    isActive: (r.isActive as number) === 1,
  }));
}

export async function addScheme(scheme: Scheme): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'INSERT INTO scheme (id, name, months, isActive) VALUES (?, ?, ?, ?)',
    scheme.id,
    scheme.name,
    scheme.months,
    scheme.isActive ? 1 : 0
  );
}

export async function updateScheme(scheme: Scheme): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'UPDATE scheme SET name=?, months=?, isActive=? WHERE id=?',
    scheme.name,
    scheme.months,
    scheme.isActive ? 1 : 0,
    scheme.id
  );
}

export async function deleteScheme(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('UPDATE scheme SET isActive = 0 WHERE id = ?', id);
}

// Payment API URL (owner sets this in Settings; used for UPI/Card payments)
export async function getPaymentApiUrl(): Promise<string> {
  const database = getDb();
  const row = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM key_value WHERE key = ?',
    KEY_PAYMENT_API_URL
  );
  return normalizeServerUrl(row?.value?.trim() || '');
}

export async function setPaymentApiUrl(url: string): Promise<void> {
  const database = getDb();
  const val = normalizeServerUrl(url.trim());
  if (val) {
    await database.runAsync(
      'INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)',
      KEY_PAYMENT_API_URL,
      val
    );
  } else {
    await database.runAsync('DELETE FROM key_value WHERE key = ?', KEY_PAYMENT_API_URL);
  }
}

/** Ensure URL has a scheme; use https for non-localhost (required on iOS). */
function normalizeServerUrl(url: string): string {
  if (!url) return '';
  const lower = url.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return url;
  const host = url.split('/')[0];
  const isLocalhost = host === 'localhost' || host.startsWith('127.') || host.includes('localhost');
  return isLocalhost ? `http://${url}` : `https://${url}`;
}
