/**
 * Schemes CRUD - owner only
 */

const express = require('express');
const { query, queryOne } = require('../db');

const router = express.Router();

function rowToScheme(row) {
  return {
    id: row.id,
    name: row.name,
    months: row.months,
    isActive: !!row.is_active,
  };
}

// GET /api/schemes/all (must be before /:id)
router.get('/all', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM schemes ORDER BY months');
    res.json(rows.map(rowToScheme));
  } catch (e) {
    console.error('Get all schemes error:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch schemes' });
  }
});

// GET /api/schemes (active only)
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM schemes WHERE is_active = 1 ORDER BY months');
    res.json(rows.map(rowToScheme));
  } catch (e) {
    console.error('Get schemes error:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch schemes' });
  }
});

// POST /api/schemes
router.post('/', async (req, res) => {
  try {
    const { id, name, months, isActive } = req.body;
    if (!id || !name || months == null) {
      return res.status(400).json({ error: 'Missing id, name or months' });
    }
    await query(
      'INSERT INTO schemes (id, name, months, is_active) VALUES (?, ?, ?, ?)',
      [id, name, months, isActive !== false ? 1 : 0]
    );
    res.status(201).json({ id });
  } catch (e) {
    console.error('Add scheme error:', e);
    res.status(500).json({ error: e.message || 'Failed to add scheme' });
  }
});

// PUT /api/schemes/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, months, isActive } = req.body;
    await query(
      'UPDATE schemes SET name=?, months=?, is_active=? WHERE id=?',
      [name, months, isActive !== false ? 1 : 0, req.params.id]
    );
    res.json({ id: req.params.id });
  } catch (e) {
    console.error('Update scheme error:', e);
    res.status(500).json({ error: e.message || 'Failed to update scheme' });
  }
});

// DELETE /api/schemes/:id (soft delete - set is_active=0)
router.delete('/:id', async (req, res) => {
  try {
    await query('UPDATE schemes SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete scheme error:', e);
    res.status(500).json({ error: e.message || 'Failed to delete scheme' });
  }
});

module.exports = router;
