create or replace function public.admin_delete_market_with_refunds(
  p_market_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.markets%rowtype;
  v_row record;
  v_balance integer;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'Only service role can delete markets with refunds';
  end if;

  select * into v_market
  from public.markets
  where id = p_market_id
  for update;

  if not found then
    raise exception 'Market not found';
  end if;

  for v_row in
    select b.user_id, sum(b.points)::integer as refund_points
    from public.bets b
    where b.market_id = p_market_id
    group by b.user_id
  loop
    update public.users
    set points = points + v_row.refund_points,
        updated_at = now()
    where id = v_row.user_id
    returning points into v_balance;

    insert into public.transactions (user_id, market_id, type, amount, balance_after, description)
    values (
      v_row.user_id,
      p_market_id,
      'adjustment',
      v_row.refund_points,
      v_balance,
      'Refund for admin market deletion'
    );
  end loop;

  delete from public.bets where market_id = p_market_id;
  delete from public.market_resolutions where market_id = p_market_id;
  delete from public.markets where id = p_market_id;
end;
$$;

grant execute on function public.admin_delete_market_with_refunds(uuid) to service_role;
