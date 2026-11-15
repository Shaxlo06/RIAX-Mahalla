create extension if not exists pgcrypto;

create type public.project_status as enum ('planned','active','review','completed','rejected');
create type public.progress_status as enum ('not_started','in_progress','submitted','approved','rejected');
create type public.report_status as enum ('draft','submitted','approved','rejected');

create table public.roles (
  code text primary key check (code in ('admin','student','mahalla')),
  name text not null,
  created_at timestamptz not null default now()
);
insert into public.roles (code,name) values ('admin','Admin / kafedra mudiri'),('student','Talaba'),('mahalla','Mahalla koordinatori') on conflict do nothing;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  academic_year text,
  program text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mahallas (
  id uuid primary key default gen_random_uuid(),
  name text,
  region text not null,
  district text,
  address text,
  latitude numeric(10,7), longitude numeric(10,7),
  description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(name,region,district)
);
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null references public.roles(code),
  full_name text not null,
  phone text,
  avatar_url text,
  mahalla_id uuid references public.mahallas(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.supervisors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,
  full_name text not null unique,
  title text,
  department text default 'Raqamli iqtisodiyot va axborot xavfsizligi',
  phone text, email text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,
  source_row integer unique,
  full_name text not null,
  phone text,
  group_id uuid references public.groups(id) on delete set null,
  supervisor_id uuid references public.supervisors(id) on delete set null,
  mahalla_id uuid references public.mahallas(id) on delete set null,
  practice_address text,
  practice_start date, practice_end date,
  status text not null default 'active' check (status in ('active','inactive','completed')),
  source_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  problem_statement text,
  goal text,
  expected_result text,
  direction text,
  student_id uuid references public.students(id) on delete cascade,
  supervisor_id uuid references public.supervisors(id) on delete set null,
  mahalla_id uuid references public.mahallas(id) on delete set null,
  status public.project_status not null default 'planned',
  progress smallint not null default 0 check (progress between 0 and 100),
  start_date date, due_date date,
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_key text not null check (stage_key in ('problem','analysis','idea','development','implementation','monitoring','result','final_report')),
  title text not null,
  stage_order smallint not null check (stage_order between 1 and 8),
  status public.progress_status not null default 'not_started',
  started_at timestamptz, completed_at timestamptz,
  unique(project_id,stage_key), unique(project_id,stage_order)
);
create table public.project_progress (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  author_id uuid references public.users(id) on delete set null,
  progress smallint not null check (progress between 0 and 100),
  note text,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  title text not null,
  report_type text not null default 'progress',
  status public.report_status not null default 'draft',
  body text,
  feedback text,
  submitted_at timestamptz, reviewed_at timestamptz, reviewed_by uuid references public.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  file_name text not null, storage_path text not null, mime_type text, size_bytes bigint,
  created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null, message text not null, action_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.analytics (
  id bigint generated always as identity primary key,
  event_name text not null,
  user_id uuid references public.users(id) on delete set null,
  entity_type text, entity_id uuid,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  assignee_id uuid references public.users(id) on delete set null,
  title text not null, description text,
  status text not null default 'todo' check (status in ('todo','in_progress','done','cancelled')),
  due_date date, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.users(id) on delete set null,
  recipient_id uuid references public.users(id) on delete cascade,
  subject text, body text not null, is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['groups','mahallas','users','supervisors','students','projects','reports','tasks'] loop execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', 'touch_'||t, t); end loop; end $$;
create or replace function public.current_role() returns text language sql stable security definer set search_path=public as $$ select role from public.users where id=auth.uid() $$;

alter table public.roles enable row level security;
alter table public.groups enable row level security;
alter table public.mahallas enable row level security;
alter table public.users enable row level security;
alter table public.supervisors enable row level security;
alter table public.students enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.project_progress enable row level security;
alter table public.reports enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics enable row level security;
alter table public.tasks enable row level security;
alter table public.messages enable row level security;

create policy "authenticated read roles" on public.roles for select to authenticated using (true);
create policy "authenticated read groups" on public.groups for select to authenticated using (true);
create policy "authenticated read mahallas" on public.mahallas for select to authenticated using (true);
create policy "authenticated read supervisors" on public.supervisors for select to authenticated using (true);
create policy "users read own or admin" on public.users for select to authenticated using (id=auth.uid() or public.current_role()='admin');
create policy "users update own or admin" on public.users for update to authenticated using (id=auth.uid() or public.current_role()='admin') with check (id=auth.uid() or public.current_role()='admin');
create policy "admin manage groups" on public.groups for all to authenticated using (public.current_role()='admin') with check (public.current_role()='admin');
create policy "admin manage mahallas" on public.mahallas for all to authenticated using (public.current_role()='admin') with check (public.current_role()='admin');
create policy "admin manage supervisors" on public.supervisors for all to authenticated using (public.current_role()='admin') with check (public.current_role()='admin');
create policy "students visible by scope" on public.students for select to authenticated using (
  public.current_role()='admin' or user_id=auth.uid() or
  supervisor_id in (select id from public.supervisors where user_id=auth.uid()) or
  mahalla_id=(select mahalla_id from public.users where id=auth.uid())
);
create policy "admin manage students" on public.students for all to authenticated using (public.current_role()='admin') with check (public.current_role()='admin');
create policy "projects visible by scope" on public.projects for select to authenticated using (
  public.current_role()='admin' or student_id in (select id from public.students where user_id=auth.uid()) or
  supervisor_id in (select id from public.supervisors where user_id=auth.uid()) or
  mahalla_id=(select mahalla_id from public.users where id=auth.uid())
);
create policy "admin manage projects" on public.projects for all to authenticated using (public.current_role()='admin') with check (public.current_role()='admin');
create policy "student update own projects" on public.projects for update to authenticated using (student_id in (select id from public.students where user_id=auth.uid())) with check (student_id in (select id from public.students where user_id=auth.uid()));
create policy "project stages follow project" on public.project_stages for select to authenticated using (exists(select 1 from public.projects p where p.id=project_id));
create policy "project progress follow project" on public.project_progress for select to authenticated using (exists(select 1 from public.projects p where p.id=project_id));
create policy "project members add progress" on public.project_progress for insert to authenticated with check (author_id=auth.uid());
create policy "reports visible by scope" on public.reports for select to authenticated using (public.current_role()='admin' or student_id in (select id from public.students where user_id=auth.uid()) or exists(select 1 from public.projects p where p.id=project_id));
create policy "student manage own reports" on public.reports for all to authenticated using (student_id in (select id from public.students where user_id=auth.uid()) or public.current_role()='admin') with check (student_id in (select id from public.students where user_id=auth.uid()) or public.current_role()='admin');
create policy "attachments follow owner" on public.attachments for all to authenticated using (owner_id=auth.uid() or public.current_role()='admin') with check (owner_id=auth.uid() or public.current_role()='admin');
create policy "notifications own" on public.notifications for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "analytics admin read" on public.analytics for select to authenticated using (public.current_role()='admin');
create policy "analytics insert" on public.analytics for insert to authenticated with check (user_id=auth.uid());
create policy "tasks visible by scope" on public.tasks for select to authenticated using (assignee_id=auth.uid() or public.current_role()='admin' or exists(select 1 from public.projects p where p.id=project_id));
create policy "tasks update by assignee" on public.tasks for update to authenticated using (assignee_id=auth.uid() or public.current_role()='admin') with check (assignee_id=auth.uid() or public.current_role()='admin');
create policy "messages own" on public.messages for select to authenticated using (sender_id=auth.uid() or recipient_id=auth.uid());
create policy "messages send" on public.messages for insert to authenticated with check (sender_id=auth.uid());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('riax-attachments','riax-attachments',false,10485760,array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;
create policy "authenticated upload own folder" on storage.objects for insert to authenticated with check (bucket_id='riax-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "authenticated read own or admin" on storage.objects for select to authenticated using (bucket_id='riax-attachments' and ((storage.foldername(name))[1]=auth.uid()::text or public.current_role()='admin'));
create policy "authenticated delete own" on storage.objects for delete to authenticated using (bucket_id='riax-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
