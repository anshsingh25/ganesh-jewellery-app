/**
 * Settings - owner only (min-amount, payment-url)
 */

const express = require('express');
const { query } = require('../db');

const router = express.Router();
const { ownerOnly } = require('../middleware/auth');

const KEY_MIN_AMOUNT = '@ganesh_minimum_amount';
const KEY_PAYMENT_URL = '@ganesh_payment_api_url';

async function getSetting(key) {
  const row = await require('../db').queryOne(
    'SELECT value FROM key_value WHERE key_name = ?',
    [key]
  );
  return row?.value ?? null;
}

async function setSetting(key, value) {
  const pool = require('../db').getPool();
  if (value !== null && value !== undefined && value !== '') {
    await pool.execute(
      'INSERT INTO key_value (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [key, String(value)]
    );
  } else {
    await pool.execute('DELETE FROM key_value WHERE key_name = ?', [key]);
  }
}

// GET /api/settings/min-amount
router.get('/min-amount', async (req, res) => {
  try {
    const val = await getSetting(KEY_MIN_AMOUNT);
    const n = val ? parseInt(val, 10) : 0;
    res.json({ value: isNaN(n) ? 0 : n });
  } catch (e) {
    console.error('Get min amount error:', e);
    res.status(500).json({ error: e.message || 'Failed' });
  }
});

// PUT /api/settings/min-amount (owner only)
router.put('/min-amount', ownerOnly, async (req, res) => {
  try {
    const amount = Math.max(0, parseInt(req.body?.value, 10) || 0);
    await setSetting(KEY_MIN_AMOUNT, String(amount));
    res.json({ value: amount });
  } catch (e) {
    console.error('Set min amount error:', e);
    res.status(500).json({ error: e.message || 'Failed' });
  }
});

// GET /api/settings/payment-url (owner only)
router.get('/payment-url', ownerOnly, async (req, res) => {
  try {
    const val = await getSetting(KEY_PAYMENT_URL);
    res.json({ value: val?.trim() || '' });
  } catch (e) {
    console.error('Get payment url error:', e);
    res.status(500).json({ error: e.message || 'Failed' });
  }
});

// PUT /api/settings/payment-url (owner only)
router.put('/payment-url', ownerOnly, async (req, res) => {
  try {
    const url = (req.body?.value || '').trim();
    await setSetting(KEY_PAYMENT_URL, url);
    res.json({ value: url });
  } catch (e) {
    console.error('Set payment url error:', e);
    res.status(500).json({ error: e.message || 'Failed' });
  }
});

module.exports = router;
