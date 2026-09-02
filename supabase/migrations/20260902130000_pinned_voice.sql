alter table public.community_quotes
  add column if not exists is_pinned boolean not null default false;

create index if not exists community_quotes_pinned_sort_idx
  on public.community_quotes (is_pinned desc, sort_order, created_at desc)
  where status = 'published';

insert into public.community_quotes (
  id,
  text,
  speaker,
  cover_path,
  sort_order,
  status,
  is_pinned
) values (
  'q-pinned-host-note',
  '这里可以投稿，也可以在别人的卡片下接着聊。',
  '范米花儿 × Conceal',
  null,
  -1000,
  'published',
  true
)
on conflict (id) do update
set
  text = excluded.text,
  speaker = excluded.speaker,
  cover_path = excluded.cover_path,
  sort_order = excluded.sort_order,
  status = excluded.status,
  is_pinned = excluded.is_pinned,
  updated_at = now();

comment on column public.community_quotes.is_pinned is
  '公开原话板的站主置顶标记；置顶内容始终排在访客排序之前。';
