create extension if not exists pgcrypto;

create table if not exists public.community_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.community_quotes (
  id text primary key default ('q-' || replace(gen_random_uuid()::text, '-', '')),
  text text not null,
  speaker text not null default '匿名坑底人',
  cover_path text,
  sort_order integer not null default 0,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_quotes_id_check check (id ~ '^q-[a-z0-9][a-z0-9-]{1,63}$'),
  constraint community_quotes_text_check check (char_length(btrim(text)) between 2 and 120),
  constraint community_quotes_speaker_check check (char_length(btrim(speaker)) between 1 and 40),
  constraint community_quotes_status_check check (status in ('draft', 'published', 'hidden'))
);

insert into public.community_quotes (id, text, speaker, cover_path, sort_order)
values
  ('q-01', '这次真的不一样。', '匿名坑底人', 'assets/column/rival-lover/overview/01-kqpjbbks9obs.webp', 10),
  ('q-02', '两眼一睁就是磕。', '匿名坑底人', null, 20),
  ('q-03', '正主虚情热演，粉丝假意上头。', '匿名坑底人', 'assets/column/us/overview/01-jxntbv0oxoli.webp', 30),
  ('q-04', '卖得专业就打赏，惹怒粉丝就换推。', '匿名坑底人', null, 40),
  ('q-05', '只是售后，入坑三月都懂。', '匿名坑底人', null, 50),
  ('q-06', '可以嗑，但不要嗑得那么执着。', '匿名坑底人', 'assets/column/designing-love/overview/01-ft0abcnezobo.webp', 60),
  ('q-07', '每对 CP 在自己 CP 粉眼中都是真情侣。', '匿名坑底人', null, 70),
  ('q-08', '在别家 CP 粉眼里都一眼假。', '匿名坑底人', 'assets/column/poisonous-love/overview/01-uksdb8nmjojx.webp', 80),
  ('q-09', '路过的狗都得说一句好配。', '匿名坑底人', null, 90),
  ('q-10', '谁家 CP 这么好磕？哦，原来是我家的。', '匿名坑底人', null, 100),
  ('q-11', '般配，已经说累了。', '匿名坑底人', 'assets/column/my-secret-words/overview/01-suakby2xcohn.webp', 110),
  ('q-12', '剧外也是一种浪漫。', '匿名坑底人', null, 120),
  ('q-13', '我不入蛊谁入蛊？', '匿名坑底人', null, 130),
  ('q-14', '滞后磕 CP 就是爽。', '匿名坑底人', 'assets/column/affair/overview/01-biwwbh7aeo6p.webp', 140),
  ('q-15', '早期的糖也是糖。', '匿名坑底人', null, 150),
  ('q-16', '只是同事？只是姐妹？谈了两年了？', '匿名坑底人', null, 160),
  ('q-17', '谁嗑谁上头。', '匿名坑底人', null, 170),
  ('q-18', '现实比剧本会写。', '匿名坑底人', null, 180)
on conflict (id) do nothing;

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null default '匿名坑底人',
  body text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references auth.users(id) on delete set null,
  constraint community_comments_target_check check (
    (target_type = 'page' and target_id = 'tide-words')
    or (target_type = 'quote' and target_id ~ '^q-[a-z0-9][a-z0-9-]{1,63}$')
  ),
  constraint community_comments_nickname_check check (
    char_length(btrim(nickname)) between 1 and 24
  ),
  constraint community_comments_body_check check (
    char_length(btrim(body)) between 2 and 400
  ),
  constraint community_comments_status_check check (
    status in ('pending', 'published', 'hidden')
  )
);

create table if not exists public.community_reactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id),
  constraint community_reactions_target_check check (
    (target_type = 'page' and target_id = 'tide-words')
    or (target_type = 'quote' and target_id ~ '^q-[a-z0-9][a-z0-9-]{1,63}$')
  )
);

create table if not exists public.community_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  view_count bigint not null default 1 check (view_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id),
  constraint community_views_target_check check (
    (target_type = 'page' and target_id = 'tide-words')
    or (target_type = 'quote' and target_id ~ '^q-[a-z0-9][a-z0-9-]{1,63}$')
  )
);

create index if not exists community_comments_target_status_created_idx
  on public.community_comments (target_type, target_id, status, created_at desc);

create index if not exists community_comments_user_created_idx
  on public.community_comments (user_id, created_at desc);

create index if not exists community_reactions_target_idx
  on public.community_reactions (target_type, target_id);

create index if not exists community_views_target_idx
  on public.community_views (target_type, target_id);

create index if not exists community_quotes_status_sort_idx
  on public.community_quotes (status, sort_order, created_at);

alter table public.community_admins enable row level security;
alter table public.community_quotes enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_views enable row level security;

create or replace function public.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.community_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_community_admin() from public;
grant execute on function public.is_community_admin() to authenticated;

drop policy if exists "community admins can read own role" on public.community_admins;
create policy "community admins can read own role"
  on public.community_admins
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "public can read published community quotes" on public.community_quotes;
create policy "public can read published community quotes"
  on public.community_quotes
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "community admins can read all quotes" on public.community_quotes;
create policy "community admins can read all quotes"
  on public.community_quotes
  for select
  to authenticated
  using ((select public.is_community_admin()));

drop policy if exists "community admins can insert quotes" on public.community_quotes;
create policy "community admins can insert quotes"
  on public.community_quotes
  for insert
  to authenticated
  with check ((select public.is_community_admin()));

drop policy if exists "community admins can update quotes" on public.community_quotes;
create policy "community admins can update quotes"
  on public.community_quotes
  for update
  to authenticated
  using ((select public.is_community_admin()))
  with check ((select public.is_community_admin()));

drop policy if exists "public can read published community comments" on public.community_comments;
create policy "public can read published community comments"
  on public.community_comments
  for select
  to anon, authenticated
  using (
    status = 'published'
    and (
      (target_type = 'page' and target_id = 'tide-words')
      or (
        target_type = 'quote'
        and exists (
          select 1
          from public.community_quotes q
          where q.id = target_id
            and q.status = 'published'
        )
      )
    )
  );

drop policy if exists "community admins can read all comments" on public.community_comments;
create policy "community admins can read all comments"
  on public.community_comments
  for select
  to authenticated
  using ((select public.is_community_admin()));

drop policy if exists "community admins can update comments" on public.community_comments;
create policy "community admins can update comments"
  on public.community_comments
  for update
  to authenticated
  using ((select public.is_community_admin()))
  with check ((select public.is_community_admin()));

drop policy if exists "community admins can delete comments" on public.community_comments;
create policy "community admins can delete comments"
  on public.community_comments
  for delete
  to authenticated
  using ((select public.is_community_admin()));

revoke all on table public.community_admins from anon, authenticated;
revoke all on table public.community_quotes from anon, authenticated;
revoke all on table public.community_comments from anon, authenticated;
revoke all on table public.community_reactions from anon, authenticated;
revoke all on table public.community_views from anon, authenticated;

grant select on table public.community_admins to authenticated;
grant select on table public.community_quotes to anon, authenticated;
grant insert, update on table public.community_quotes to authenticated;
grant select on table public.community_comments to anon, authenticated;
grant update, delete on table public.community_comments to authenticated;

create or replace function public.get_community_stats()
returns table (
  target_type text,
  target_id text,
  comment_count bigint,
  reaction_count bigint,
  unique_visitor_count bigint,
  view_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with targets as (
    select c.target_type, c.target_id from public.community_comments c
    union
    select r.target_type, r.target_id from public.community_reactions r
    union
    select v.target_type, v.target_id from public.community_views v
  )
  select
    t.target_type,
    t.target_id,
    (
      select count(*)
      from public.community_comments c
      where c.target_type = t.target_type
        and c.target_id = t.target_id
        and c.status = 'published'
    ) as comment_count,
    (
      select count(*)
      from public.community_reactions r
      where r.target_type = t.target_type
        and r.target_id = t.target_id
    ) as reaction_count,
    (
      select count(*)
      from public.community_views v
      where v.target_type = t.target_type
        and v.target_id = t.target_id
    ) as unique_visitor_count,
    (
      select coalesce(sum(v.view_count), 0)
      from public.community_views v
      where v.target_type = t.target_type
        and v.target_id = t.target_id
    ) as view_count
  from targets t
  where (t.target_type = 'page' and t.target_id = 'tide-words')
    or (
      t.target_type = 'quote'
      and exists (
        select 1
        from public.community_quotes q
        where q.id = t.target_id
          and q.status = 'published'
      )
    );
$$;

revoke all on function public.get_community_stats() from public;
grant execute on function public.get_community_stats() to anon, authenticated;

create or replace function public.get_my_community_reactions()
returns table (target_type text, target_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.target_type, r.target_id
  from public.community_reactions r
  where r.user_id = (select auth.uid());
$$;

revoke all on function public.get_my_community_reactions() from public;
grant execute on function public.get_my_community_reactions() to authenticated;

create or replace function public.record_community_view(
  p_target_type text,
  p_target_id text
)
returns table (unique_visitor_count bigint, view_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
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

  insert into public.community_views (
    user_id,
    target_type,
    target_id,
    view_count,
    first_seen_at,
    last_seen_at
  ) values (
    v_user_id,
    p_target_type,
    p_target_id,
    1,
    now(),
    now()
  )
  on conflict (user_id, target_type, target_id)
  do update set
    view_count = case
      when public.community_views.last_seen_at < now() - interval '30 minutes'
        then public.community_views.view_count + 1
      else public.community_views.view_count
    end,
    last_seen_at = now();

  return query
  select
    count(*)::bigint as unique_visitor_count,
    coalesce(sum(v.view_count), 0)::bigint as view_count
  from public.community_views v
  where v.target_type = p_target_type
    and v.target_id = p_target_id;
end;
$$;

revoke all on function public.record_community_view(text, text) from public;
grant execute on function public.record_community_view(text, text) to authenticated;

create or replace function public.toggle_community_reaction(
  p_target_type text,
  p_target_id text
)
returns table (liked boolean, reaction_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted integer := 0;
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

  delete from public.community_reactions r
  where r.user_id = v_user_id
    and r.target_type = p_target_type
    and r.target_id = p_target_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    insert into public.community_reactions (user_id, target_type, target_id)
    values (v_user_id, p_target_type, p_target_id);
  end if;

  return query
  select
    (v_deleted = 0) as liked,
    count(*)::bigint as reaction_count
  from public.community_reactions r
  where r.target_type = p_target_type
    and r.target_id = p_target_id;
end;
$$;

revoke all on function public.toggle_community_reaction(text, text) from public;
grant execute on function public.toggle_community_reaction(text, text) to authenticated;

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

  return query select v_comment_id, 'pending'::text, v_created_at;
end;
$$;

revoke all on function public.submit_community_comment(text, text, text, text) from public;
grant execute on function public.submit_community_comment(text, text, text, text) to authenticated;

comment on table public.community_comments is 'glfans 坑底文学的页面留言与卡片评论；公开前必须经过审核。';
comment on table public.community_quotes is '坑底文学原话卡片；管理员可编辑、排序或隐藏。';
comment on table public.community_reactions is '匿名身份对页面或原话卡片的唯一心动记录。';
comment on table public.community_views is '按匿名身份与目标聚合的浏览记录；30 分钟内重复打开不增加浏览量。';
