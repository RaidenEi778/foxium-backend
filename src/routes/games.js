const { Router } = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { toUserJson, levelFromPoints, asyncHandler } = require('../utils/helpers');

const router = Router();

// GET /api/games — per-game best score and accumulated points for the current user
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select game_id, max(score) as best_score, sum(points) as total_points
     from game_scores where user_id = $1 group by game_id`,
    [req.user.id]
  );
  res.json({ games: rows });
}));

// POST /api/games/:id/score — log a round and credit points
router.post('/:id/score', requireAuth, asyncHandler(async (req, res) => {
  const { score, points } = req.body || {};

  await pool.query(
    'insert into game_scores (user_id, game_id, score, points) values ($1, $2, $3, $4)',
    [req.user.id, req.params.id, score || 0, points || 0]
  );

  const newPoints = Math.max(0, req.user.points + Number(points || 0));
  const { rows } = await pool.query(
    'update users set points = $1, level = $2 where id = $3 returning *',
    [newPoints, levelFromPoints(newPoints), req.user.id]
  );
  res.json({ user: toUserJson(rows[0]) });
}));

module.exports = router;
