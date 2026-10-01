/**
 * Seeds the database with demo accounts (student / teacher / admin) so the
 * platform can be explored immediately after deployment.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');
const { levelFromPoints } = require('../src/utils/helpers');

const DEMO_ACCOUNTS = [
  {
    email: 'student@foxium.uz',
    password: '123456',
    firstName: 'Алишер',
    lastName: 'Каримов',
    role: 'student',
    grade: '9A',
    points: 1250,
  },
  {
    email: 'teacher@foxium.uz',
    password: '123456',
    firstName: 'Андрей',
    lastName: 'Петров',
    role: 'teacher',
    grade: '',
    points: 5000,
  },
  {
    email: 'admin@foxium.uz',
    password: 'admin123',
    firstName: 'Андрей',
    lastName: '(Admin)',
    role: 'admin',
    grade: '',
    points: 9999,
  },
];

async function seed() {
  for (const account of DEMO_ACCOUNTS) {
    const existing = await pool.query('select id from users where email = $1', [account.email]);
    if (existing.rows[0]) {
      console.log(`↷ Skipped (already exists): ${account.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(account.password, 10);
    await pool.query(
      `insert into users (email, password_hash, first_name, last_name, role, grade, points, level)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        account.email,
        passwordHash,
        account.firstName,
        account.lastName,
        account.role,
        account.grade,
        account.points,
        levelFromPoints(account.points),
      ]
    );
    console.log(`✓ Created: ${account.email}`);
  }

  await pool.end();
  console.log('Done ✅');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
