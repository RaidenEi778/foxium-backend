# Contributing to Foxium Backend

Thanks for considering a contribution! This project is intentionally small and
dependency-light, so most changes are easy to review and ship.

## Getting set up

```bash
git clone https://github.com/<your-username>/foxium-backend.git
cd foxium-backend
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm run dev
```

Run the SQL in `schema.sql` once against your database before starting the
server for the first time.

## Project structure

```
src/
  app.js            # Express app assembly (middleware + route mounting)
  server.js          # Entry point — boots the HTTP server
  config/db.js        # PostgreSQL connection pool
  middleware/auth.js   # JWT auth + role guards
  routes/             # One file per resource (auth, users, courses, ...)
  utils/helpers.js     # Shared helpers (level calc, response shaping)
scripts/seed.js        # Demo account seeding script
schema.sql              # Database schema (run once)
```

## Making a change

1. Create a branch: `git checkout -b feature/short-description`
2. Keep route handlers thin — business logic belongs in `utils/` or a
   dedicated module as the project grows.
3. Run `npm run lint` (a basic syntax check) before opening a PR.
4. Describe **what** changed and **why** in the PR description; link any
   related issue.

## Reporting bugs

Open an issue with:
- Steps to reproduce
- What you expected vs. what happened
- Relevant logs (strip out secrets/tokens first!)

## Code style

- Plain CommonJS (`require`/`module.exports`), no build step.
- Prefer small, single-purpose route files over one large router.
- Keep SQL inline and parameterized (`$1`, `$2`, ...) — never string-concatenate
  user input into a query.
