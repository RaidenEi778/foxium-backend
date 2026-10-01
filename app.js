const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const homeworkRoutes = require('./routes/homework');
const gameRoutes = require('./routes/games');
const rewardRoutes = require('./routes/rewards');
const adminRoutes = require('./routes/admin');
const devRoutes = require('./routes/dev');

function createApp() {
  const app = express();

  const origin = process.env.CORS_ORIGIN || '*';
  app.use(cors({ origin: origin === '*' ? true : origin.split(',').map((o) => o.trim()) }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/homework', homeworkRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/rewards', rewardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/dev', devRoutes);

  // 404 fallback for unknown API routes
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}

module.exports = createApp;
