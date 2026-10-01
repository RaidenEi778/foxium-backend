const { Router } = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { levelFromPoints, asyncHandler } = require('../utils/helpers');

const router = Router();

// GET /api/homework — assignments visible to the current student
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select * from homework where student_id = $1 or student_id is null order by created_at desc`,
    [req.user.id]
  );
  res.json({ homework: rows });
}));

// GET /api/homework/all — full list with student info, for teachers/admins
router.get('/all', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select h.*, u.email as student_email, u.first_name, u.last_name
     from homework h
     left join users u on u.id = h.student_id
     order by h.created_at desc`
  );
  res.json({ homework: rows });
}));

// POST /api/homework — create a new assignment
router.post('/', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { courseId, title, subject, deadline, points, studentId } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Assignment title is required' });

  const { rows } = await pool.query(
    `insert into homework (course_id, title, subject, deadline, points, student_id, created_by)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [courseId || null, title, subject || '', deadline || '', points || 10, studentId || null, req.user.id]
  );
  res.status(201).json({ homework: rows[0] });
}));

// PUT /api/homework/:id — generic status update
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const { rows } = await pool.query(
    'update homework set status = $1 where id = $2 returning *',
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
  res.json({ homework: rows[0] });
}));

// POST /api/homework/:id/submit — student marks work as submitted
router.post('/:id/submit', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `update homework set status = 'submitted' where id = $1 returning *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
  res.json({ homework: rows[0] });
}));

// PUT /api/homework/:id/review — teacher grades it, points are credited atomically
router.put('/:id/review', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { userId, status, points } = req.body || {};

  const hw = await pool.query(
    'update homework set status = $1 where id = $2 returning *',
    [status, req.params.id]
  );
  if (!hw.rows[0]) return res.status(404).json({ error: 'Assignment not found' });

  if (status === 'done' && userId && points) {
    const student = await pool.query('select * from users where id = $1', [userId]);
    if (student.rows[0]) {
      const newPoints = Math.max(0, student.rows[0].points + Number(points));
      await pool.query(
        'update users set points = $1, level = $2 where id = $3',
        [newPoints, levelFromPoints(newPoints), userId]
      );
    }
  }

  res.json({ homework: hw.rows[0] });
}));

module.exports = router;
