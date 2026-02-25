create or replace function public.resolve_market_backend(
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
    return;
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
  values (p_market_id, p_resolver_id, p_outcome, p_notes)
  on conflict (market_id) do nothing;

  update public.markets
  set status = 'resolved',
      resolved_outcome = p_outcome,
      updated_at = now()
  where id = p_market_id
    and status <> 'resolved';
end;
$$;

grant execute on function public.resolve_market_backend(uuid, public.market_side, uuid, text) to service_role;
