-- ============================================================
--  Foxium — PostgreSQL schema
--  Run once in your database's SQL editor (e.g. Supabase SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text not null,
  first_name text default '',
  last_name text default '',
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  grade text default '',
  points integer not null default 50,
  level integer not null default 1,
  avatar_color text default '#FF6B2B',
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subject text default '',
  grade text default '',
  description text default '',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists homework (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  subject text default '',
  deadline text default '',
  points integer not null default 10,
  student_id uuid references users(id) on delete cascade, -- null = assigned to everyone
  status text not null default 'progress'
    check (status in ('progress', 'submitted', 'done', 'rejected', 'overdue')),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists game_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  game_id text not null,
  score integer not null default 0,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists rewards (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  cost_points integer not null default 100,
  icon text default '🎁',
  created_at timestamptz not null default now()
);

create table if not exists reward_claims (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  reward_id uuid references rewards(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_homework_student on homework(student_id);
create index if not exists idx_game_scores_user on game_scores(user_id);
create index if not exists idx_reward_claims_user on reward_claims(user_id);

-- Starter rewards catalog — safe to edit or remove later from the admin panel
insert into rewards (title, cost_points, icon) values
  ('Значок «Знаток»', 200, '🏅'),
  ('Значок «Эксперт»', 500, '🎖️'),
  ('Виртуальный кубок', 1000, '🏆')
on conflict do nothing;
