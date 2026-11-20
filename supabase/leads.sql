-- Lead table for the missed-call calculator. Run in the Supabase SQL editor of the project you
-- chose for this site (a NEW free project is recommended, so it stays separate from the voice agent).
-- Safe to re-run.

create table if not exists roi_leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 1 and 100),
  email      text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  business   text check (char_length(business) <= 150),
  phone      text check (char_length(phone) <= 40),
  consent    boolean not null check (consent),                 -- must have ticked the box
  inputs     jsonb check (pg_column_size(inputs) < 4000),      -- what they typed into the calculator
  results    jsonb check (pg_column_size(results) < 4000),     -- what the calculator showed them
  source     text check (char_length(source) <= 100),
  status     text not null default 'new' check (status in ('new', 'contacted', 'invited', 'closed'))
);
create index if not exists roi_leads_created_idx on roi_leads (created_at desc);

-- The public page uses the publishable (anon) key. It may ONLY add rows: nobody can read, change
-- or delete leads through that key. You read leads in the Supabase dashboard (Table editor).
alter table roi_leads enable row level security;
drop policy if exists roi_leads_insert on roi_leads;
create policy roi_leads_insert on roi_leads for insert to anon, authenticated with check (status = 'new');
revoke all on roi_leads from anon, authenticated;
grant insert on roi_leads to anon, authenticated;
