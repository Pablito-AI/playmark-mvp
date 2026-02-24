create or replace function public.cancel_bet(
  p_bet_id uuid
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
  v_bet public.bets%rowtype;
  v_new_balance integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.close_expired_markets();

  select * into v_bet
  from public.bets
  where id = p_bet_id
  for update;

  if not found then
    raise exception 'Bet not found';
  end if;

  if v_bet.user_id <> v_user_id then
    raise exception 'Cannot cancel another user''s bet';
  end if;

  select * into v_market
  from public.markets
  where id = v_bet.market_id
  for update;

  if not found then
    raise exception 'Market not found';
  end if;

  if v_market.status <> 'open' or v_market.close_date <= now() then
    raise exception 'Bet cannot be cancelled after market close';
  end if;

  select * into v_user
  from public.users
  where id = v_user_id
  for update;

  delete from public.bets where id = p_bet_id;

  v_new_balance := v_user.points + v_bet.points;

  update public.users
  set points = v_new_balance,
      updated_at = now()
  where id = v_user_id;

  insert into public.transactions (user_id, market_id, type, amount, balance_after, description)
  values (v_user_id, v_bet.market_id, 'adjustment', v_bet.points, v_new_balance, 'Bet cancellation');

  return v_bet;
end;
$$;

grant execute on function public.cancel_bet(uuid) to authenticated;
