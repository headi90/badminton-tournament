create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format text not null check (format in ('single_elimination', 'round_robin', 'americano')),
  status text not null default 'setup' check (status in ('setup', 'active', 'finished')),
  created_at timestamptz not null default now(),
  date text,
  location text
);

create table tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  seed integer not null,
  unique (tournament_id, player_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round integer not null,
  position integer not null,
  player1_id uuid references players(id) on delete set null,
  player2_id uuid references players(id) on delete set null,
  player3_id uuid references players(id) on delete set null,
  player4_id uuid references players(id) on delete set null,
  score1 integer,
  score2 integer,
  winner_id uuid references players(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed'))
);

-- Enable Row Level Security (allow all for anon — public app)
alter table players enable row level security;
alter table tournaments enable row level security;
alter table tournament_players enable row level security;
alter table matches enable row level security;

create policy "public read/write players" on players for all using (true) with check (true);
create policy "public read/write tournaments" on tournaments for all using (true) with check (true);
create policy "public read/write tournament_players" on tournament_players for all using (true) with check (true);
create policy "public read/write matches" on matches for all using (true) with check (true);
