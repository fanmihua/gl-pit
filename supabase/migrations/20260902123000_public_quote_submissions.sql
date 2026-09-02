alter table public.community_quotes
  add column if not exists submitted_by uuid references auth.users(id) on delete set null;

create index if not exists community_quotes_submitter_created_idx
  on public.community_quotes (submitted_by, created_at desc)
  where submitted_by is not null;

create or replace function public.submit_community_quote(
  p_speaker text,
  p_text text
)
returns table (
  id text,
  text text,
  speaker text,
  cover_path text,
  sort_order integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_speaker text := coalesce(nullif(btrim(p_speaker), ''), '匿名坑底人');
  v_text text := btrim(p_text);
  v_quote_id text;
  v_sort_order integer;
begin
  if v_user_id is null then
    raise exception 'community_session_required';
  end if;

  if char_length(v_speaker) > 24 then
    raise exception 'nickname_invalid';
  end if;

  if char_length(v_text) < 2 or char_length(v_text) > 120 then
    raise exception 'quote_text_invalid';
  end if;

  if (
    select count(*)
    from public.community_quotes q
    where q.submitted_by = v_user_id
      and q.created_at > now() - interval '10 minutes'
  ) >= 3 then
    raise exception 'quote_rate_limit';
  end if;

  if exists (
    select 1
    from public.community_quotes q
    where q.submitted_by = v_user_id
      and q.text = v_text
      and q.created_at > now() - interval '24 hours'
  ) then
    raise exception 'quote_duplicate';
  end if;

  select coalesce(min(q.sort_order), 10) - 10
  into v_sort_order
  from public.community_quotes q;

  insert into public.community_quotes (
    text,
    speaker,
    sort_order,
    status,
    submitted_by
  ) values (
    v_text,
    v_speaker,
    v_sort_order,
    'published',
    v_user_id
  )
  returning community_quotes.id
  into v_quote_id;

  return query
  select q.id, q.text, q.speaker, q.cover_path, q.sort_order
  from public.community_quotes q
  where q.id = v_quote_id;
end;
$$;

revoke all on function public.submit_community_quote(text, text) from public;
grant execute on function public.submit_community_quote(text, text) to authenticated;

comment on column public.community_quotes.submitted_by is
  '匿名登录用户投稿原话时的用户标识，仅用于限流与事后管理。';

comment on function public.submit_community_quote(text, text) is
  '提交后立即公开的坑底原话投稿；每位匿名用户十分钟最多三条。';
