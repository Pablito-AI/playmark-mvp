create extension if not exists pgcrypto;

create type public.market_status as enum ('open', 'closed', 'resolved');
create type public.market_side as enum ('yes', 'no');
create type public.transaction_type as enum ('initial', 'bet', 'payout', 'adjustment');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  points integer not null default 100 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id),
  title text not null,
  description text not null,
  category text not null,
  source_link text,
  close_date timestamptz not null,
  status public.market_status not null default 'open',
  resolved_outcome public.market_side,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (close_date > created_at)
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  side public.market_side not null,
  points integer not null check (points > 0),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  market_id uuid references public.markets(id) on delete set null,
  type public.transaction_type not null,
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  description text,
  created_at timestamptz not null default now()
);

create table public.market_resolutions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null unique references public.markets(id) on delete cascade,
  resolver_id uuid not null references public.users(id),
  outcome public.market_side not null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_markets_status_close_date on public.markets(status, close_date);
create index idx_markets_category on public.markets(category);
create index idx_bets_market_id on public.bets(market_id);
create index idx_bets_user_id on public.bets(user_id);
create index idx_transactions_user_created on public.transactions(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

create trigger trg_markets_updated_at
before update on public.markets
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, points)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    100
  );

  insert into public.transactions (user_id, type, amount, balance_after, description)
  values (new.id, 'initial', 100, 100, 'Initial balance');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace view public.market_pools as
select
  m.id as market_id,
  coalesce(sum(case when b.side = 'yes' then b.points else 0 end), 0)::integer as yes_pool,
  coalesce(sum(case when b.side = 'no' then b.points else 0 end), 0)::integer as no_pool,
  coalesce(sum(b.points), 0)::integer as total_pool,
  count(b.id)::integer as bet_count,
  count(distinct b.user_id)::integer as participant_count
from public.markets m
left join public.bets b on b.market_id = m.id
group by m.id;

create or replace view public.user_stats as
select
  u.id as user_id,
  u.points,
  count(b.id)::integer as total_bets,
  coalesce(sum(b.points), 0)::integer as points_staked,
  coalesce(sum(case when mr.outcome = b.side then 1 else 0 end), 0)::integer as winning_bets,
  case
    when count(b.id) = 0 then 0
    else round((sum(case when mr.outcome = b.side then 1 else 0 end)::numeric / count(b.id)::numeric) * 100, 2)
  end as accuracy
from public.users u
left join public.bets b on b.user_id = u.id
left join public.market_resolutions mr on mr.market_id = b.market_id
group by u.id;

create or replace function public.close_expired_markets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.markets
  set status = 'closed', updated_at = now()
  where status = 'open'
    and close_date <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.place_bet(
  p_market_id uuid,
  p_side public.market_side,
  p_points integer
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user public.users%rowtype;
  v_market public.markets%rowtype;
  v_max_bet integer;
  v_new_balance integer;
  v_bet public.bets;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.close_expired_markets();

  select * into v_user from public.users where id = v_user_id for update;
  if not found then
    raise exception 'User not found';
  end if;

  select * into v_market from public.markets where id = p_market_id for update;
  if not found then
    raise exception 'Market not found';
  end if;

  if v_market.status <> 'open' then
    raise exception 'Market is not open';
  end if;

  if v_market.close_date <= now() then
    raise exception 'Market is closed';
  end if;

  if p_points <= 0 then
    raise exception 'Points must be positive';
  end if;

  v_max_bet := greatest(1, floor(v_user.points * 0.2));
  if p_points > v_max_bet then
    raise exception 'Bet exceeds 20%% balance limit';
  end if;

  if p_points > v_user.points then
    raise exception 'Insufficient balance';
  end if;

  insert into public.bets (user_id, market_id, side, points)
  values (v_user_id, p_market_id, p_side, p_points)
  returning * into v_bet;

  v_new_balance := v_user.points - p_points;

  update public.users
  set points = v_new_balance, updated_at = now()
  where id = v_user_id;

  insert into public.transactions (user_id, market_id, type, amount, balance_after, description)
  values (v_user_id, p_market_id, 'bet', -p_points, v_new_balance, 'Bet on ' || p_side::text);

  return v_bet;
end;
$$;

create or replace function public.resolve_market(
  p_market_id uuid,
  p_outcome public.market_side,
  p_resolver_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.markets%rowtype;
  v_total_pool integer;
  v_winning_pool integer;
  v_payout_sum integer;
  v_remainder integer;
  v_resolver_exists boolean;
  v_row record;
  v_balance integer;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'Only service role can resolve markets';
  end if;

  perform public.close_expired_markets();

  select exists(select 1 from public.users where id = p_resolver_id) into v_resolver_exists;
  if not v_resolver_exists then
    raise exception 'Resolver user does not exist';
  end if;

  select * into v_market from public.markets where id = p_market_id for update;
  if not found then
    raise exception 'Market not found';
  end if;

  if v_market.status = 'resolved' then
    raise exception 'Market already resolved';
  end if;

  if v_market.status = 'open' and v_market.close_date > now() then
    raise exception 'Market cannot be resolved before close date';
  end if;

  select coalesce(sum(points), 0)::integer into v_total_pool
  from public.bets
  where market_id = p_market_id;

  select coalesce(sum(points), 0)::integer into v_winning_pool
  from public.bets
  where market_id = p_market_id and side = p_outcome;

  if v_winning_pool > 0 and v_total_pool > 0 then
    create temporary table tmp_payouts on commit drop as
    with winners as (
      select user_id, sum(points)::integer as points_on_outcome
      from public.bets
      where market_id = p_market_id and side = p_outcome
      group by user_id
    ),
    base as (
      select
        user_id,
        points_on_outcome,
        floor((v_total_pool::numeric * points_on_outcome::numeric) / v_winning_pool::numeric)::integer as payout
      from winners
    )
    select
      user_id,
      points_on_outcome,
      payout,
      row_number() over (order by points_on_outcome desc, user_id) as rank_no
    from base;

    select coalesce(sum(payout), 0) into v_payout_sum from tmp_payouts;
    v_remainder := v_total_pool - v_payout_sum;

    if v_remainder > 0 then
      update tmp_payouts
      set payout = payout + 1
      where rank_no <= v_remainder;
    end if;

    for v_row in
      select user_id, payout
      from tmp_payouts
      where payout > 0
    loop
      update public.users
      set points = points + v_row.payout,
          updated_at = now()
      where id = v_row.user_id
      returning points into v_balance;

      insert into public.transactions (user_id, market_id, type, amount, balance_after, description)
      values (v_row.user_id, p_market_id, 'payout', v_row.payout, v_balance, 'Payout for market resolution');
    end loop;
  end if;

  insert into public.market_resolutions (market_id, resolver_id, outcome, notes)
  values (p_market_id, p_resolver_id, p_outcome, p_notes);

  update public.markets
  set status = 'resolved',
      resolved_outcome = p_outcome,
      updated_at = now()
  where id = p_market_id;
end;
$$;

alter table public.users enable row level security;
alter table public.markets enable row level security;
alter table public.bets enable row level security;
alter table public.transactions enable row level security;
alter table public.market_resolutions enable row level security;

create policy "Users are readable" on public.users
for select using (true);

create policy "User can update own profile" on public.users
for update using (auth.uid() = id);

create policy "Markets are readable" on public.markets
for select using (true);

create policy "Authenticated users can create markets" on public.markets
for insert with check (auth.uid() = creator_id);

create policy "Bets are readable" on public.bets
for select using (true);

create policy "Transactions own" on public.transactions
for select using (auth.uid() = user_id);

create policy "Resolutions readable" on public.market_resolutions
for select using (true);

grant execute on function public.close_expired_markets() to anon, authenticated, service_role;
grant execute on function public.place_bet(uuid, public.market_side, integer) to authenticated;
grant execute on function public.resolve_market(uuid, public.market_side, uuid, text) to service_role;
