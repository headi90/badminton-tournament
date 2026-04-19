-- Run this in your Supabase SQL editor to create all tables

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format text not null check (format in ('single_elimination', 'round_robin')),
  status text not null default 'setup' check (status in ('setup', 'active', 'finished')),
  created_at timestamptz default now()
);

create table tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  seed int not null default 1,
  unique (tournament_id, player_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  round int not null,
  position int not null,
  player1_id uuid references players(id),
  player2_id uuid references players(id),
  score1 int,
  score2 int,
  winner_id uuid references players(id),
  status text not null default 'pending' check (status in ('pending', 'completed'))
);

-- Enable Row Level Security and allow public access (adjust for auth later)
alter table players enable row level security;
alter table tournaments enable row level security;
alter table tournament_players enable row level security;
alter table matches enable row level security;

create policy "public read/write players" on players for all using (true) with check (true);
create policy "public read/write tournaments" on tournaments for all using (true) with check (true);
create policy "public read/write tournament_players" on tournament_players for all using (true) with check (true);
create policy "public read/write matches" on matches for all using (true) with check (true);
