const { Router } = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { toUserJson, levelFromPoints, asyncHandler } = require('../utils/helpers');

const router = Router();

// GET /api/users
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('select * from users order by points desc');
  res.json({ users: rows.map(toUserJson) });
}));

// GET /api/users/list/rating  (must be declared before /:id to avoid route collision)
router.get('/list/rating', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select * from users where role = 'student' order by points desc limit 100`
  );
  res.json({ leaderboard: rows.map(toUserJson) });
}));

// GET /api/users/:id
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('select * from users where id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toUserJson(rows[0]) });
}));

// PUT /api/users/:id/points  (teacher/admin award or deduct points)
router.put('/:id/points', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const delta = Number(req.body?.delta) || 0;
  const { rows } = await pool.query('select * from users where id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });

  const newPoints = Math.max(0, rows[0].points + delta);
  const updated = await pool.query(
    'update users set points = $1, level = $2 where id = $3 returning *',
    [newPoints, levelFromPoints(newPoints), req.params.id]
  );
  res.json({ user: toUserJson(updated.rows[0]) });
}));

module.exports = router;
