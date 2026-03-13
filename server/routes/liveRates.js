/**
 * Live rates CRUD - GET is public; POST/PUT/DELETE require owner auth
 */

const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../db');

const router = express.Router();
let authMiddleware, ownerOnly;
try {
  const auth = require('../middleware/auth');
  authMiddleware = auth.authMiddleware;
  ownerOnly = auth.ownerOnly;
} catch (_) {}

function rowToBuySell(row) {
  return {
    id: row.id,
    product: row.product,
    buyValue: row.buy_value || undefined,
    sellValue: row.sell_value || '',
    sortOrder: row.sort_order ?? 0,
  };
}

function rowToBidAsk(row) {
  return {
    id: row.id,
    product: row.product,
    bid: row.bid || undefined,
    ask: row.ask || undefined,
    high: row.high || undefined,
    low: row.low || undefined,
    sortOrder: row.sort_order ?? 0,
  };
}

// GET /api/live-rates (public - no auth)
router.get('/', async (req, res) => {
  try {
    const buySellRows = await query(
      'SELECT * FROM live_rates_buy_sell ORDER BY sort_order ASC, created_at ASC'
    );
    const bidAskRows = await query(
      'SELECT * FROM live_rates_bid_ask ORDER BY sort_order ASC, created_at ASC'
    );
    res.json({
      buySell: buySellRows.map(rowToBuySell),
      bidAsk: bidAskRows.map(rowToBidAsk),
    });
  } catch (e) {
    console.error('Get live rates error:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch live rates' });
  }
});

// POST /api/live-rates/buy-sell
router.post('/buy-sell', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { product, buyValue, sellValue, sortOrder } = req.body;
    if (!product || sellValue === undefined) {
      return res.status(400).json({ error: 'product and sellValue are required' });
    }
    const id = req.body.id || crypto.randomUUID();
    await query(
      `INSERT INTO live_rates_buy_sell (id, product, buy_value, sell_value, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [id, String(product).trim(), buyValue != null ? String(buyValue) : null, String(sellValue), sortOrder ?? 0]
    );
    const row = await queryOne('SELECT * FROM live_rates_buy_sell WHERE id = ?', [id]);
    res.status(201).json(rowToBuySell(row));
  } catch (e) {
    console.error('Add buy-sell rate error:', e);
    res.status(500).json({ error: e.message || 'Failed to add rate' });
  }
});

// POST /api/live-rates/bid-ask
router.post('/bid-ask', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { product, bid, ask, high, low, sortOrder } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'product is required' });
    }
    const id = req.body.id || crypto.randomUUID();
    await query(
      `INSERT INTO live_rates_bid_ask (id, product, bid, ask, high, low, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(product).trim(),
        bid != null ? String(bid) : null,
        ask != null ? String(ask) : null,
        high != null ? String(high) : null,
        low != null ? String(low) : null,
        sortOrder ?? 0,
      ]
    );
    const row = await queryOne('SELECT * FROM live_rates_bid_ask WHERE id = ?', [id]);
    res.status(201).json(rowToBidAsk(row));
  } catch (e) {
    console.error('Add bid-ask rate error:', e);
    res.status(500).json({ error: e.message || 'Failed to add rate' });
  }
});

// PUT /api/live-rates/buy-sell/:id
router.put('/buy-sell/:id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const id = req.params.id;
    const { product, buyValue, sellValue, sortOrder } = req.body;
    const row = await queryOne('SELECT * FROM live_rates_buy_sell WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Rate not found' });
    await query(
      `UPDATE live_rates_buy_sell SET product=?, buy_value=?, sell_value=?, sort_order=? WHERE id=?`,
      [
        product != null ? String(product).trim() : row.product,
        buyValue !== undefined ? (buyValue != null ? String(buyValue) : null) : row.buy_value,
        sellValue !== undefined ? String(sellValue) : row.sell_value,
        sortOrder !== undefined ? sortOrder : row.sort_order,
        id,
      ]
    );
    const updated = await queryOne('SELECT * FROM live_rates_buy_sell WHERE id = ?', [id]);
    res.json(rowToBuySell(updated));
  } catch (e) {
    console.error('Update buy-sell rate error:', e);
    res.status(500).json({ error: e.message || 'Failed to update rate' });
  }
});

// PUT /api/live-rates/bid-ask/:id
router.put('/bid-ask/:id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const id = req.params.id;
    const { product, bid, ask, high, low, sortOrder } = req.body;
    const row = await queryOne('SELECT * FROM live_rates_bid_ask WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Rate not found' });
    await query(
      `UPDATE live_rates_bid_ask SET product=?, bid=?, ask=?, high=?, low=?, sort_order=? WHERE id=?`,
      [
        product != null ? String(product).trim() : row.product,
        bid !== undefined ? (bid != null ? String(bid) : null) : row.bid,
        ask !== undefined ? (ask != null ? String(ask) : null) : row.ask,
        high !== undefined ? (high != null ? String(high) : null) : row.high,
        low !== undefined ? (low != null ? String(low) : null) : row.low,
        sortOrder !== undefined ? sortOrder : row.sort_order,
        id,
      ]
    );
    const updated = await queryOne('SELECT * FROM live_rates_bid_ask WHERE id = ?', [id]);
    res.json(rowToBidAsk(updated));
  } catch (e) {
    console.error('Update bid-ask rate error:', e);
    res.status(500).json({ error: e.message || 'Failed to update rate' });
  }
});

// DELETE /api/live-rates/buy-sell/:id
router.delete('/buy-sell/:id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const pool = require('../db').getPool();
    const [r] = await pool.execute('DELETE FROM live_rates_buy_sell WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Rate not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete buy-sell rate error:', e);
    res.status(500).json({ error: e.message || 'Failed to delete rate' });
  }
});

// DELETE /api/live-rates/bid-ask/:id
router.delete('/bid-ask/:id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const pool = require('../db').getPool();
    const [r] = await pool.execute('DELETE FROM live_rates_bid_ask WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Rate not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete bid-ask rate error:', e);
    res.status(500).json({ error: e.message || 'Failed to delete rate' });
  }
});

module.exports = router;
