const { Router } = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = Router();

// GET /api/courses
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('select * from courses order by created_at desc');
  res.json({ courses: rows });
}));

// POST /api/courses
router.post('/', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { title, subject, grade, description } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Course title is required' });

  const { rows } = await pool.query(
    `insert into courses (title, subject, grade, description, created_by)
     values ($1, $2, $3, $4, $5) returning *`,
    [title, subject || '', grade || '', description || '', req.user.id]
  );
  res.status(201).json({ course: rows[0] });
}));

// PUT /api/courses/:id
router.put('/:id', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { title, subject, grade, description } = req.body || {};
  const { rows } = await pool.query(
    `update courses set
       title = coalesce($1, title),
       subject = coalesce($2, subject),
       grade = coalesce($3, grade),
       description = coalesce($4, description)
     where id = $5
     returning *`,
    [title, subject, grade, description, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Course not found' });
  res.json({ course: rows[0] });
}));

// DELETE /api/courses/:id
router.delete('/:id', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  await pool.query('delete from courses where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
