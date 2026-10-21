create table profiles (id uuid primary key references auth.users on delete cascade, exam_date date, weekly_hours int default 6);
create table questions (id uuid primary key default gen_random_uuid(), cert text not null, domain int not null, objective text not null,
  stem text not null, options jsonb not null, correct int not null, explanation text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')), created_at timestamptz default now());
create table attempts (id bigserial primary key, user_id uuid not null references auth.users on delete cascade,
  question_id text not null, domain int not null, correct boolean not null, created_at timestamptz default now());
create table cards (user_id uuid not null references auth.users on delete cascade, question_id text not null,
  box int not null default 0, due timestamptz not null default now(), primary key (user_id, question_id));
alter table profiles enable row level security; alter table attempts enable row level security;
alter table cards enable row level security; alter table questions enable row level security;
create policy own_profile on profiles for all using (auth.uid() = id);
create policy own_attempts on attempts for all using (auth.uid() = user_id);
create policy own_cards on cards for all using (auth.uid() = user_id);
create policy read_approved on questions for select using (status = 'approved');
