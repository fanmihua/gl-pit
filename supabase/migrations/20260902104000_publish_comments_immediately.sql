alter table public.community_comments
  alter column status set default 'published';

create or replace function public.submit_community_comment(
  p_target_type text,
  p_target_id text,
  p_nickname text,
  p_body text
)
returns table (id uuid, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_nickname text := coalesce(nullif(btrim(p_nickname), ''), '匿名坑底人');
  v_body text := btrim(p_body);
  v_comment_id uuid;
  v_created_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'community_session_required';
  end if;

  if not (
    (p_target_type = 'page' and p_target_id = 'tide-words')
    or (
      p_target_type = 'quote'
      and exists (
        select 1 from public.community_quotes q
        where q.id = p_target_id and q.status = 'published'
      )
    )
  ) then
    raise exception 'community_target_invalid';
  end if;

  if char_length(v_nickname) > 24 then
    raise exception 'nickname_invalid';
  end if;

  if char_length(v_body) < 2 or char_length(v_body) > 400 then
    raise exception 'comment_body_invalid';
  end if;

  if (
    select count(*)
    from public.community_comments c
    where c.user_id = v_user_id
      and c.created_at > now() - interval '10 minutes'
  ) >= 3 then
    raise exception 'comment_rate_limit';
  end if;

  if exists (
    select 1
    from public.community_comments c
    where c.user_id = v_user_id
      and c.target_type = p_target_type
      and c.target_id = p_target_id
      and c.body = v_body
      and c.created_at > now() - interval '24 hours'
  ) then
    raise exception 'comment_duplicate';
  end if;

  insert into public.community_comments (
    target_type,
    target_id,
    user_id,
    nickname,
    body
  ) values (
    p_target_type,
    p_target_id,
    v_user_id,
    v_nickname,
    v_body
  )
  returning community_comments.id, community_comments.created_at
  into v_comment_id, v_created_at;

  return query select v_comment_id, 'published'::text, v_created_at;
end;
$$;

revoke all on function public.submit_community_comment(text, text, text, text) from public;
grant execute on function public.submit_community_comment(text, text, text, text) to authenticated;

comment on table public.community_comments is
  'glfans 坑底文学的页面留言与卡片评论；提交后公开，管理员可事后隐藏。';
