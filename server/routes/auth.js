/**
 * Auth routes: owner-login, customer-login
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../db');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ganesh-jewellers-secret-change-in-production';

/** Format DATE/DATETIME from DB to YYYY-MM-DD for API responses */
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

async function getOwnerUser() {
  return queryOne(
    'SELECT id, name, role, pin_hash FROM users WHERE role IN (\'owner\', \'staff\') LIMIT 1'
  );
}

// Owner login: { name, pin }
router.post('/owner-login', async (req, res) => {
  try {
    const { name, pin } = req.body || {};
    const user = await getOwnerUser();
    if (!user) {
      return res.status(401).json({ error: 'No owner configured. Run npm run init-db first.' });
    }
    const match = user.pin_hash ? await bcrypt.compare(String(pin || ''), user.pin_hash) : true;
    if (!match) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    const token = jwt.sign(
      { sub: user.id, role: 'owner', type: 'owner' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (e) {
    console.error('Owner login error:', e);
    res.status(500).json({ error: e.message || 'Login failed' });
  }
});

// GET /api/auth/owner-profile (owner only, JWT)
router.get('/owner-profile', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const user = await getOwnerUser();
    if (!user) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    res.json({ id: user.id, name: user.name, role: user.role });
  } catch (e) {
    console.error('Get owner profile error:', e);
    res.status(500).json({ error: e.message || 'Failed to load owner profile' });
  }
});

// PUT /api/auth/owner-profile (owner only, change name / PIN)
router.put('/owner-profile', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { name, currentPin, newPin } = req.body || {};
    const user = await getOwnerUser();
    if (!user) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const updates = [];
    const params = [];

    if (name && String(name).trim()) {
      updates.push('name = ?');
      params.push(String(name).trim());
    }

    if (newPin) {
      const pinStr = String(newPin || '').trim();
      if (!/^\d{4}$/.test(pinStr)) {
        return res.status(400).json({ error: 'New PIN must be exactly 4 digits' });
      }
      const currentStr = String(currentPin || '');
      const match = user.pin_hash ? await bcrypt.compare(currentStr, user.pin_hash) : true;
      if (!match) {
        return res.status(401).json({ error: 'Current PIN is incorrect' });
      }
      const hash = await bcrypt.hash(pinStr, 10);
      updates.push('pin_hash = ?');
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.json({ id: user.id, name: user.name, role: user.role });
    }

    params.push(user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await getOwnerUser();
    res.json({ id: updated.id, name: updated.name, role: updated.role });
  } catch (e) {
    console.error('Update owner profile error:', e);
    res.status(500).json({ error: e.message || 'Failed to update owner profile' });
  }
});

// Customer login: { mobile, pin }
router.post('/customer-login', async (req, res) => {
  try {
    const { mobile, pin } = req.body || {};
    const trimmed = String(mobile || '').trim().replace(/\D/g, '');
    if (trimmed.length < 10) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }
    const row = await queryOne(
      'SELECT * FROM customers WHERE mobile = ? OR REPLACE(REPLACE(REPLACE(mobile, \' \', \'\'), \'-\', \'\'), \'+\', \'\') = ? LIMIT 1',
      [mobile.trim(), trimmed]
    );
    if (!row) {
      return res.status(401).json({ error: 'No EMI scheme found for this mobile number' });
    }
    const expectedPin = row.customer_pin || String(row.mobile).slice(-4);
    if (String(pin || '') !== expectedPin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    const instRows = await query(
      'SELECT * FROM installments WHERE customer_id = ? ORDER BY month_number',
      [row.id]
    );
    const customer = {
      ...rowToCustomer(row),
      installments: instRows.map(rowToInstallment),
    };
    const token = jwt.sign(
      { sub: row.id, role: 'customer', type: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, customer });
  } catch (e) {
    console.error('Customer login error:', e);
    res.status(500).json({ error: e.message || 'Login failed' });
  }
});

module.exports = { router, JWT_SECRET };
