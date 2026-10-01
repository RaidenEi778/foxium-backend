/**
 * Converts a raw points total into the gamified level shown on the frontend.
 * Thresholds mirror the ones used client-side in foxium-shared.js.
 */
function levelFromPoints(points) {
  if (points >= 5000) return 6;
  if (points >= 3000) return 5;
  if (points >= 1000) return 4;
  if (points >= 500) return 3;
  if (points >= 100) return 2;
  return 1;
}

/**
 * Maps a `users` DB row to the camelCase shape the frontend (api.js) expects.
 */
function toUserJson(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    grade: row.grade,
    points: row.points,
    level: row.level,
    avatarColor: row.avatar_color,
  };
}

/**
 * Wraps an async Express handler so thrown errors become clean 500 responses
 * instead of crashing the process or leaving the request hanging.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
  };
}

module.exports = { levelFromPoints, toUserJson, asyncHandler };
