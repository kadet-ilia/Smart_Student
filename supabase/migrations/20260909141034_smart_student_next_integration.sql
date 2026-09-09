-- Production support for the Next.js Smart Student interface.
-- Keeps the legacy token/PIN model and existing learner data intact.

alter table public.edu_students
  add column if not exists current_grade smallint not null default 5
  check (current_grade in (4, 5));

create unique index if not exists edu_students_student_code_key
  on public.edu_students (upper(student_code));

drop function if exists public.edu_student_profile(uuid);
create function public.edu_student_profile(p_student_token uuid)
returns table(
  nickname text,
  parent_code text,
  student_code text,
  current_math_topic text,
  current_russian_topic text,
  xp integer,
  created_at timestamptz,
  has_pin boolean,
  current_grade smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select s.nickname, s.parent_code, s.student_code,
         s.current_math_topic, s.current_russian_topic,
         s.xp, s.created_at, (s.pin_hash is not null), s.current_grade
  from public.edu_students s
  where s.student_token = p_student_token;
$$;

create or replace function public.edu_update_student_profile(
  p_student_token uuid,
  p_nickname text,
  p_current_grade smallint
)
returns table(nickname text, current_grade smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.edu_students%rowtype;
begin
  if p_nickname is null
     or char_length(btrim(p_nickname)) < 1
     or char_length(btrim(p_nickname)) > 40
     or p_current_grade not in (4, 5) then
    raise exception 'invalid profile';
  end if;

  update public.edu_students
     set nickname = btrim(p_nickname),
         current_grade = p_current_grade,
         updated_at = now()
   where student_token = p_student_token
   returning * into v;

  if not found then raise exception 'student not found'; end if;
  return query select v.nickname, v.current_grade;
end;
$$;

create or replace function public.edu_student_summary(p_student_token uuid)
returns table(
  total_attempts bigint,
  total_correct bigint,
  accuracy numeric,
  active_days bigint,
  current_day_streak integer,
  last_activity timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with learner as (
    select id from public.edu_students where student_token = p_student_token
  ),
  base as (
    select a.* from public.edu_attempts a join learner l on l.id = a.student_id
  ),
  dates as (
    select distinct created_at::date as day from base
  ),
  anchor as (
    select case when max(day) >= current_date - 1 then max(day) end as day from dates
  ),
  numbered as (
    select d.day, row_number() over (order by d.day desc)::integer as rn
    from dates d, anchor a
    where a.day is not null and d.day <= a.day
  ),
  streak as (
    select coalesce(
      min(rn) filter (where day <> (select day from anchor) - (rn - 1)) - 1,
      count(*)::integer,
      0
    )::integer as value
    from numbered
  )
  select count(*)::bigint,
         count(*) filter (where is_correct)::bigint,
         coalesce(round(100.0 * count(*) filter (where is_correct) / nullif(count(*), 0), 1), 0),
         (select count(*) from dates)::bigint,
         (select value from streak),
         max(created_at)
  from base;
$$;

create or replace function public.edu_recent_activity(p_student_token uuid)
returns table(day date, attempts bigint, correct bigint, accuracy numeric)
language sql
stable
security definer
set search_path = public
as $$
  with learner as (
    select id from public.edu_students where student_token = p_student_token
  ),
  days as (
    select generate_series(current_date - 6, current_date, interval '1 day')::date as day
  ),
  activity as (
    select a.created_at::date as day,
           count(*)::bigint as attempts,
           count(*) filter (where a.is_correct)::bigint as correct
    from public.edu_attempts a join learner l on l.id = a.student_id
    where a.created_at >= current_date - 6
    group by a.created_at::date
  )
  select d.day,
         coalesce(a.attempts, 0),
         coalesce(a.correct, 0),
         case when coalesce(a.attempts, 0) = 0 then 0
              else round(100.0 * a.correct / a.attempts, 1) end
  from days d left join activity a using (day)
  order by d.day;
$$;

revoke all on function public.edu_student_profile(uuid) from public;
revoke all on function public.edu_update_student_profile(uuid, text, smallint) from public;
revoke all on function public.edu_student_summary(uuid) from public;
revoke all on function public.edu_recent_activity(uuid) from public;

grant execute on function public.edu_student_profile(uuid) to anon, authenticated, service_role;
grant execute on function public.edu_update_student_profile(uuid, text, smallint) to anon, authenticated, service_role;
grant execute on function public.edu_student_summary(uuid) to anon, authenticated, service_role;
grant execute on function public.edu_recent_activity(uuid) to anon, authenticated, service_role;
