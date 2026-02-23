-- Run after at least one user exists in public.users.
-- This assigns seeded markets to the first user.

insert into public.markets (creator_id, title, description, category, source_link, close_date)
select
  u.id,
  s.title,
  s.description,
  s.category,
  s.source_link,
  s.close_date
from (
  values
    (
      'Will SpaceX launch Starship to orbit before July 1, 2026?',
      'Resolves YES if a Starship mission reaches orbit before 2026-07-01 00:00 UTC.',
      'Science',
      'https://www.spacex.com/updates/',
      '2026-06-30 23:00:00+00'::timestamptz
    ),
    (
      'Will the US Fed cut rates by at least 25 bps before September 2026?',
      'Resolves YES if an official FOMC decision includes a cumulative 25 bps cut before 2026-09-01.',
      'Economy',
      'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
      '2026-08-31 23:00:00+00'::timestamptz
    ),
    (
      'Will an AI model score above 95% on MMLU-Pro in 2026?',
      'Resolves YES if a credible benchmark report in 2026 shows >95% score.',
      'Technology',
      'https://paperswithcode.com/',
      '2026-12-01 00:00:00+00'::timestamptz
    )
) as s(title, description, category, source_link, close_date)
cross join lateral (
  select id from public.users order by created_at asc limit 1
) u;
