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
  v_new_balance integer;
  v_bet public.bets;
  v_has_opposite_side boolean;
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

  select exists (
    select 1
    from public.bets b
    where b.user_id = v_user_id
      and b.market_id = p_market_id
      and b.side <> p_side
  ) into v_has_opposite_side;

  if v_has_opposite_side then
    raise exception 'Cannot bet on both sides of the same market';
  end if;

  if p_points <= 0 then
    raise exception 'Points must be positive';
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
