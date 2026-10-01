const { Router } = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { toUserJson, levelFromPoints, asyncHandler } = require('../utils/helpers');

const router = Router();
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [users, courses, homework] = await Promise.all([
    pool.query('select count(*)::int as c from users'),
    pool.query('select count(*)::int as c from courses'),
    pool.query('select count(*)::int as c from homework'),
  ]);
  res.json({
    stats: {
      users: users.rows[0].c,
      courses: courses.rows[0].c,
      homework: homework.rows[0].c,
    },
  });
}));

// GET /api/admin/users
router.get('/users', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('select * from users order by created_at desc');
  res.json({ users: rows.map(toUserJson) });
}));

// PUT /api/admin/users/:id
router.put('/users/:id', asyncHandler(async (req, res) => {
  const { role, points, grade } = req.body || {};
  const { rows } = await pool.query(
    `update users set
       role = coalesce($1, role),
       points = coalesce($2, points),
       level = coalesce($3, level),
       grade = coalesce($4, grade)
     where id = $5
     returning *`,
    [role, points, points != null ? levelFromPoints(points) : null, grade, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toUserJson(rows[0]) });
}));

// DELETE /api/admin/users/:id
router.delete('/users/:id', asyncHandler(async (req, res) => {
  await pool.query('delete from users where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// DELETE /api/admin/courses/:id
router.delete('/courses/:id', asyncHandler(async (req, res) => {
  await pool.query('delete from courses where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// DELETE /api/admin/homework/:id
router.delete('/homework/:id', asyncHandler(async (req, res) => {
  await pool.query('delete from homework where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
