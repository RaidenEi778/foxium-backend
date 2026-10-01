const { Router } = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, signToken } = require('../middleware/auth');
const { toUserJson, asyncHandler } = require('../utils/helpers');

const router = Router();

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, grade } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await pool.query('select id from users where email = $1', [normalizedEmail]);
  if (existing.rows[0]) {
    return res.status(409).json({ error: 'This email is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const safeRole = ['student', 'teacher', 'admin'].includes(role) ? role : 'student';

  const { rows } = await pool.query(
    `insert into users (email, password_hash, first_name, last_name, role, grade, points, level)
     values ($1, $2, $3, $4, $5, $6, 50, 1) returning *`,
    [normalizedEmail, passwordHash, firstName || '', lastName || '', safeRole, grade || '']
  );

  const user = rows[0];
  res.status(201).json({ token: signToken(user), user: toUserJson(user) });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await pool.query('select * from users where email = $1', [
    (email || '').toLowerCase().trim(),
  ]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user: toUserJson(user) });
}));

// GET /api/auth/me
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: toUserJson(req.user) });
}));

// PUT /api/auth/profile
router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { firstName, lastName, grade, avatarColor } = req.body || {};
  const { rows } = await pool.query(
    `update users set
       first_name = coalesce($1, first_name),
       last_name = coalesce($2, last_name),
       grade = coalesce($3, grade),
       avatar_color = coalesce($4, avatar_color)
     where id = $5
     returning *`,
    [firstName, lastName, grade, avatarColor, req.user.id]
  );
  res.json({ user: toUserJson(rows[0]) });
}));

module.exports = router;
