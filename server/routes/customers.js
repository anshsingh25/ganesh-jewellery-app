/**
 * Customers CRUD - owner only
 */

const express = require('express');
const { query, queryOne } = require('../db');

const router = express.Router();

/** Convert ISO or any date string to MySQL datetime format YYYY-MM-DD HH:MM:SS */
function toMySQLDateTime(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

/** Convert to MySQL DATE format YYYY-MM-DD */
function toMySQLDate(str) {
  if (!str) return null;
  const s = String(str).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Format DATE/DATETIME from DB (Date or string) to YYYY-MM-DD for API responses */
function toApiDate(val) {
  if (val == null || val === '') return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rowToCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    address: row.address || undefined,
    idProofUrl: row.id_proof_url || undefined,
    customerPin: row.customer_pin || undefined,
    schemeType: row.scheme_type,
    monthlyEmiAmount: row.monthly_emi_amount,
    startDate: toApiDate(row.start_date),
    status: row.status,
    completedDate: row.completed_date ? toApiDate(row.completed_date) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    documentStatus: row.document_status || undefined,
    documentVerifiedAt: row.document_verified_at ? toApiDate(row.document_verified_at) : undefined,
    documentVerifiedBy: row.document_verified_by || undefined,
    autoPayEnabled: !!row.auto_pay_enabled,
    schemeId: row.scheme_id || undefined,
  };
}

function rowToInstallment(row) {
  return {
    id: row.id,
    monthNumber: row.month_number,
    dueDate: toApiDate(row.due_date),
    amount: row.amount,
    status: row.status,
    paidDate: row.paid_date ? toApiDate(row.paid_date) : undefined,
    paidAmount: row.paid_amount != null ? row.paid_amount : undefined,
    note: row.note || undefined,
  };
}

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM customers ORDER BY created_at DESC');
    const result = [];
    let totalInstallments = 0;
    for (const row of rows) {
      const instRows = await query(
        'SELECT * FROM installments WHERE customer_id = ? ORDER BY month_number',
        [row.id]
      );
      totalInstallments += instRows.length;
      result.push({
        ...rowToCustomer(row),
        installments: instRows.map(rowToInstallment),
      });
    }
    const sampleDue = result[0]?.installments?.[0]?.dueDate;
    console.log('[API] GET /api/customers:', result.length, 'customers,', totalInstallments, 'installments total. Sample dueDate:', sampleDue || '(none)');
    res.json(result);
  } catch (e) {
    console.error('Get customers error:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    const instRows = await query(
      'SELECT * FROM installments WHERE customer_id = ? ORDER BY month_number',
      [row.id]
    );
    res.json({
      ...rowToCustomer(row),
      installments: instRows.map(rowToInstallment),
    });
  } catch (e) {
    console.error('Get customer error:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch customer' });
  }
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const c = req.body;
    if (!c.id || !c.name || !c.mobile || !c.monthlyEmiAmount || !c.startDate) {
      return res.status(400).json({ error: 'Missing required fields: id, name, mobile, monthlyEmiAmount, startDate' });
    }
    console.log('[API] Adding customer:', c.name, c.mobile);
    const pool = require('../db').getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `INSERT INTO customers (id, name, mobile, address, id_proof_url, customer_pin, scheme_type, monthly_emi_amount, start_date, status, completed_date, created_at, updated_at, document_status, document_verified_at, document_verified_by, auto_pay_enabled, scheme_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.name,
          c.mobile,
          c.address || null,
          c.idProofUrl || null,
          c.customerPin || null,
          c.schemeType ?? 11,
          c.monthlyEmiAmount,
          toMySQLDate(c.startDate),
          c.status || 'active',
          toMySQLDate(c.completedDate),
          toMySQLDateTime(c.createdAt) || toMySQLDateTime(new Date()),
          toMySQLDateTime(c.updatedAt) || toMySQLDateTime(new Date()),
          c.documentStatus || 'pending',
          toMySQLDate(c.documentVerifiedAt),
          c.documentVerifiedBy || null,
          c.autoPayEnabled ? 1 : 0,
          c.schemeId || null,
        ]
      );
      const installments = c.installments || [];
      for (const inst of installments) {
        await conn.execute(
          `INSERT INTO installments (id, customer_id, month_number, due_date, amount, status, paid_date, paid_amount, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inst.id,
            c.id,
            inst.monthNumber,
            toMySQLDate(inst.dueDate),
            inst.amount,
            inst.status || 'pending',
            toMySQLDate(inst.paidDate),
            inst.paidAmount ?? null,
            inst.note || null,
          ]
        );
      }
      await conn.commit();
      console.log('[API] Customer saved to MySQL:', c.id, c.name);
      res.status(201).json({ id: c.id });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Add customer error:', e);
    res.status(500).json({ error: e.message || 'Failed to add customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const c = req.body;
    const id = req.params.id;
    if (!c.name || !c.mobile || !c.monthlyEmiAmount || !c.startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const pool = require('../db').getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const now = toMySQLDateTime(new Date());
      await conn.execute(
        `UPDATE customers SET name=?, mobile=?, address=?, id_proof_url=?, customer_pin=?, scheme_type=?, monthly_emi_amount=?, start_date=?, status=?, completed_date=?, updated_at=?, document_status=?, document_verified_at=?, document_verified_by=?, auto_pay_enabled=?, scheme_id=? WHERE id=?`,
        [
          c.name,
          c.mobile,
          c.address || null,
          c.idProofUrl || null,
          c.customerPin || null,
          c.schemeType ?? 11,
          c.monthlyEmiAmount,
          toMySQLDate(c.startDate),
          c.status || 'active',
          toMySQLDate(c.completedDate),
          now,
          c.documentStatus || 'pending',
          toMySQLDate(c.documentVerifiedAt),
          c.documentVerifiedBy || null,
          c.autoPayEnabled ? 1 : 0,
          c.schemeId || null,
          id,
        ]
      );
      await conn.execute('DELETE FROM installments WHERE customer_id = ?', [id]);
      const installments = c.installments || [];
      for (const inst of installments) {
        await conn.execute(
          `INSERT INTO installments (id, customer_id, month_number, due_date, amount, status, paid_date, paid_amount, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inst.id,
            id,
            inst.monthNumber,
            toMySQLDate(inst.dueDate),
            inst.amount,
            inst.status || 'pending',
            toMySQLDate(inst.paidDate),
            inst.paidAmount ?? null,
            inst.note || null,
          ]
        );
      }
      await conn.commit();
      res.json({ id });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Update customer error:', e);
    res.status(500).json({ error: e.message || 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = require('../db').getPool();
    await pool.execute('DELETE FROM installments WHERE customer_id = ?', [req.params.id]);
    const [r] = await pool.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete customer error:', e);
    res.status(500).json({ error: e.message || 'Failed to delete customer' });
  }
});

module.exports = router;
