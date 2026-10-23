create extension if not exists pgcrypto;

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  content text not null check (char_length(content) between 1 and 2000),
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.memos enable row level security;

-- 브라우저(anon)는 공개 컬럼만 읽을 수 있습니다.
-- password_hash는 4자리 비밀번호라 노출되면 쉽게 역산되므로 절대 공개하지 않습니다.
-- 생성·삭제는 서버 API가 service role로만 수행합니다.
revoke all on table public.memos from anon, authenticated;
grant select (id, title, content, created_at) on table public.memos to anon, authenticated;
grant select, insert, delete on table public.memos to service_role;

drop policy if exists "Anyone can read memos" on public.memos;
create policy "Anyone can read memos"
on public.memos
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can create memos" on public.memos;

create index if not exists memos_created_at_idx
on public.memos (created_at desc);
