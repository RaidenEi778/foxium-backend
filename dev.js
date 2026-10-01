const { Router } = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { levelFromPoints } = require('../utils/helpers');
const { JWT_SECRET } = require('../middleware/auth');

const router = Router();

const DEMO_ACCOUNTS = [
  { email: 'student@foxium.uz', password: '123456', firstName: 'Алишер', lastName: 'Каримов', role: 'student', grade: '9A', points: 1250 },
  { email: 'teacher@foxium.uz', password: '123456', firstName: 'Андрей', lastName: 'Петров', role: 'teacher', grade: '', points: 5000 },
  { email: 'admin@foxium.uz', password: 'admin123', firstName: 'Андрей', lastName: '(Admin)', role: 'admin', grade: '', points: 9999 },
];

/**
 * One-time convenience route to seed demo accounts from a browser, for hosts
 * (like Render's free tier) where an interactive shell isn't available.
 * Protected by JWT_SECRET as a shared-secret token — only someone who has
 * access to the environment variables can trigger it. Safe to leave in
 * place: it skips any account that already exists.
 *
 * Usage: GET /api/dev/seed?token=YOUR_JWT_SECRET
 */
router.get('/seed', async (req, res) => {
  if (!req.query.token || req.query.token !== JWT_SECRET) {
    return res.status(403).json({ error: 'Invalid or missing token' });
  }

  const results = [];
  try {
    for (const account of DEMO_ACCOUNTS) {
      const existing = await pool.query('select id from users where email = $1', [account.email]);
      if (existing.rows[0]) {
        results.push(`skipped (already exists): ${account.email}`);
        continue;
      }
      const passwordHash = await bcrypt.hash(account.password, 10);
      await pool.query(
        `insert into users (email, password_hash, first_name, last_name, role, grade, points, level)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [account.email, passwordHash, account.firstName, account.lastName, account.role, account.grade, account.points, levelFromPoints(account.points)]
      );
      results.push(`created: ${account.email}`);
    }
    res.json({ ok: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Seeding failed', details: err.message });
  }
});

module.exports = router;
