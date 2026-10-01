const { Router } = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { levelFromPoints, asyncHandler } = require('../utils/helpers');

const router = Router();

// GET /api/rewards
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('select * from rewards order by cost_points asc');
  res.json({ rewards: rows });
}));

// POST /api/rewards/claim
router.post('/claim', requireAuth, asyncHandler(async (req, res) => {
  const { rewardId } = req.body || {};
  const reward = await pool.query('select * from rewards where id = $1', [rewardId]);
  if (!reward.rows[0]) return res.status(404).json({ error: 'Reward not found' });

  if (req.user.points < reward.rows[0].cost_points) {
    return res.status(400).json({ error: 'Not enough points' });
  }

  const newPoints = req.user.points - reward.rows[0].cost_points;
  await pool.query(
    'update users set points = $1, level = $2 where id = $3',
    [newPoints, levelFromPoints(newPoints), req.user.id]
  );
  await pool.query(
    'insert into reward_claims (user_id, reward_id) values ($1, $2)',
    [req.user.id, rewardId]
  );

  res.json({ ok: true, remainingPoints: newPoints });
}));

module.exports = router;
