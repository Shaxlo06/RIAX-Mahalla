-- SMART RIAX department monitoring core.
-- Additive and idempotent: existing records are never deleted or overwritten.

alter table public.faculty_profiles add column if not exists google_scholar_url text;
alter table public.faculty_profiles add column if not exists activity_status text not null default 'active';

alter table public.faculty_certificates add column if not exists category text;
alter table public.faculty_certificates drop constraint if exists faculty_certificates_category_check;
alter table public.faculty_certificates add constraint faculty_certificates_category_check check (
  category is null or category in ('international','scientific','professional','competition','digital','other')
);

alter table public.professional_development add column if not exists direction text;
alter table public.professional_development add column if not exists duration_text text;
alter table public.professional_development add column if not exists certificate_number text;
alter table public.professional_development add column if not exists storage_path text;
alter table public.professional_development add column if not exists file_name text;
alter table public.professional_development add column if not exists mime_type text;

alter table public.scientific_publications add column if not exists orcid_linked boolean;
alter table public.scientific_publications add column if not exists citation_source text;
alter table public.scientific_publications add column if not exists last_checked_at timestamptz;

alter table public.educational_materials add column if not exists planned_for_period boolean;
alter table public.educational_materials add column if not exists resource_url text;
alter table public.educational_materials add column if not exists used_lesson_date date;
alter table public.ai_usage_declarations add column if not exists declared_usage_percent numeric(5,2);

alter table public.internship_assignments alter column organization_name drop not null;
alter table public.internship_assignments alter column start_date drop not null;
alter table public.internship_assignments alter column end_date drop not null;
alter table public.internship_assignments add column if not exists study_program text;
alter table public.internship_assignments add column if not exists student_phone text;
alter table public.internship_assignments add column if not exists source_file text;
alter table public.internship_assignments add column if not exists source_row integer;
alter table public.internship_assignments drop constraint if exists internship_assignments_check;
alter table public.internship_assignments add constraint internship_assignments_dates_check check (
  end_date is null or start_date is null or end_date >= start_date
);
alter table public.internship_assignments drop constraint if exists internship_assignments_status_check;
alter table public.internship_assignments add constraint internship_assignments_status_check check (
  status in ('planned','active','completed','cancelled','source_imported')
);

alter table public.graduation_theses add column if not exists academic_group text;
alter table public.graduation_theses add column if not exists study_program text;
alter table public.graduation_theses add column if not exists student_phone text;
alter table public.graduation_theses add column if not exists topic_approved_at date;
alter table public.graduation_theses add column if not exists source_file text;
alter table public.graduation_theses add column if not exists source_row integer;
alter table public.graduation_theses drop constraint if exists graduation_theses_topic_approval_status_check;
alter table public.graduation_theses add constraint graduation_theses_topic_approval_status_check check (
  topic_approval_status in ('pending','approved','rejected','revision_required','imported')
);
alter table public.graduation_theses alter column progress drop not null;
alter table public.graduation_theses drop constraint if exists graduation_theses_defense_readiness_check;
alter table public.graduation_theses add constraint graduation_theses_defense_readiness_check check (
  defense_readiness in ('unknown','not_ready','review','ready')
);

create table if not exists public.researcher_identifiers (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  provider text not null check (provider in ('scopus','orcid','wos','google_scholar','openalex')),
  identifier text not null,
  profile_url text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','conflict','missing')),
  verified_at timestamptz,
  source_file text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(faculty_id,provider,identifier)
);

create table if not exists public.faculty_bibliometrics (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  provider text not null check (provider in ('scopus','wos','openalex','crossref','orcid')),
  works_count integer check (works_count is null or works_count >= 0),
  citations_count integer check (citations_count is null or citations_count >= 0),
  h_index integer check (h_index is null or h_index >= 0),
  checked_at timestamptz not null default now(),
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(faculty_id,provider,checked_at)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  registered_students integer not null check (registered_students >= 0),
  attended_students integer not null check (attended_students >= 0),
  absent_students integer generated always as (registered_students-attended_students) stored,
  evidence jsonb not null default '{}'::jsonb,
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attended_students <= registered_students),
  unique(lesson_id)
);

create table if not exists public.master_dissertations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  student_name text not null,
  specialty text,
  course smallint check (course is null or course between 1 and 4),
  academic_group text,
  dissertation_topic text,
  supervisor_id uuid references public.faculty_profiles(id) on delete set null,
  supervisor_name text,
  research_object text,
  pedagogical_object text,
  preparation_status text not null default 'unknown' check (preparation_status in ('unknown','not_started','in_progress','review','approved','revision_required')),
  defense_status text not null default 'unknown' check (defense_status in ('unknown','not_ready','pre_defense_ready','defense_ready','defended')),
  progress numeric(5,2) check (progress is null or progress between 0 and 100),
  final_storage_path text,
  final_file_name text,
  source_file text,
  source_table integer,
  source_row integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_milestones (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid references public.graduation_theses(id) on delete cascade,
  master_dissertation_id uuid references public.master_dissertations(id) on delete cascade,
  stage_order smallint not null check (stage_order between 1 and 9),
  stage_name text not null,
  planned_date date,
  completed_date date,
  status text not null default 'not_started' check (status in ('not_started','in_progress','under_review','approved','revision_required')),
  supervisor_id uuid references public.faculty_profiles(id) on delete set null,
  supervisor_name text,
  storage_path text,
  file_name text,
  mime_type text,
  supervisor_comment text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((thesis_id is not null)::integer + (master_dissertation_id is not null)::integer = 1),
  unique(thesis_id,stage_order),
  unique(master_dissertation_id,stage_order)
);

create table if not exists public.attestation_candidates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid,
  student_name text not null,
  academic_group text,
  study_program text,
  status text not null default 'pending_review' check (status in ('pending_review','confirmed','excluded','scheduled','completed')),
  match_status text not null,
  needs_admin_review boolean not null default true,
  exam_date date,
  result text,
  final_grade text,
  source_file text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists researcher_identifiers_faculty_idx on public.researcher_identifiers(faculty_id,provider);
create index if not exists faculty_bibliometrics_provider_idx on public.faculty_bibliometrics(provider,checked_at desc);
create index if not exists attendance_records_faculty_idx on public.attendance_records(faculty_id,created_at desc);
create index if not exists master_dissertations_group_idx on public.master_dissertations(academic_group,specialty);
create index if not exists research_milestones_thesis_idx on public.research_milestones(thesis_id,stage_order);
create index if not exists research_milestones_master_idx on public.research_milestones(master_dissertation_id,stage_order);
create index if not exists attestation_candidates_review_idx on public.attestation_candidates(needs_admin_review,status);

create or replace function public.ensure_research_milestones() returns trigger
language plpgsql security definer set search_path=public as $$
declare names text[] := array[
  'Muammoni o‘rganish','Adabiyotlarni o‘rganish','Mundarijani shakllantirish',
  'I bobni shakllantirish','II bobni shakllantirish','III bobni shakllantirish',
  'Xulosa va takliflarni shakllantirish','Dastlabki himoya','Yakuniy himoya'
];
declare i integer;
begin
  for i in 1..9 loop
    if tg_table_name='graduation_theses' then
      insert into public.research_milestones(thesis_id,stage_order,stage_name,supervisor_name)
      values(new.id,i,names[i],new.supervisor_name) on conflict (thesis_id,stage_order) do nothing;
    else
      insert into public.research_milestones(master_dissertation_id,stage_order,stage_name,supervisor_name)
      values(new.id,i,names[i],new.supervisor_name) on conflict (master_dissertation_id,stage_order) do nothing;
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists ensure_thesis_milestones on public.graduation_theses;
create trigger ensure_thesis_milestones after insert on public.graduation_theses
for each row execute function public.ensure_research_milestones();
drop trigger if exists ensure_master_milestones on public.master_dissertations;
create trigger ensure_master_milestones after insert on public.master_dissertations
for each row execute function public.ensure_research_milestones();

do $$ declare t text; begin
  foreach t in array array['researcher_identifiers','faculty_bibliometrics','attendance_records','master_dissertations','research_milestones','attestation_candidates'] loop
    execute format('drop trigger if exists %I on public.%I','touch_'||t,t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()','touch_'||t,t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['researcher_identifiers','faculty_bibliometrics','attendance_records','master_dissertations','research_milestones','attestation_candidates'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

drop policy if exists "research identifiers staff read" on public.researcher_identifiers;
create policy "research identifiers staff read" on public.researcher_identifiers for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','faculty','research_monitor'])
);
drop policy if exists "research identifiers authorized manage" on public.researcher_identifiers;
create policy "research identifiers authorized manage" on public.researcher_identifiers for all to authenticated
using (public.has_any_role(array['super_admin','admin','department_head','research_monitor']))
with check (public.has_any_role(array['super_admin','admin','department_head','research_monitor']));

drop policy if exists "bibliometrics staff read" on public.faculty_bibliometrics;
create policy "bibliometrics staff read" on public.faculty_bibliometrics for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','faculty','research_monitor'])
);
drop policy if exists "bibliometrics research manage" on public.faculty_bibliometrics;
create policy "bibliometrics research manage" on public.faculty_bibliometrics for all to authenticated
using (public.has_any_role(array['super_admin','admin','department_head','research_monitor']))
with check (public.has_any_role(array['super_admin','admin','department_head','research_monitor']));

drop policy if exists "attendance staff read" on public.attendance_records;
create policy "attendance staff read" on public.attendance_records for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor'])
);
drop policy if exists "attendance authorized manage" on public.attendance_records;
create policy "attendance authorized manage" on public.attendance_records for all to authenticated
using (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()))
with check (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()));

drop policy if exists "masters scoped read" on public.master_dissertations;
create policy "masters scoped read" on public.master_dissertations for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or
  student_id in (select id from public.students where user_id=auth.uid()) or
  supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())
);
drop policy if exists "masters coordinator manage" on public.master_dissertations;
create policy "masters coordinator manage" on public.master_dissertations for all to authenticated
using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']))
with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']));

drop policy if exists "research milestones scoped read" on public.research_milestones;
create policy "research milestones scoped read" on public.research_milestones for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or
  thesis_id in (select id from public.graduation_theses where student_id in (select id from public.students where user_id=auth.uid()) or supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())) or
  master_dissertation_id in (select id from public.master_dissertations where student_id in (select id from public.students where user_id=auth.uid()) or supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid()))
);
drop policy if exists "research milestones supervisor manage" on public.research_milestones;
create policy "research milestones supervisor manage" on public.research_milestones for all to authenticated
using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or
  thesis_id in (
    select id from public.graduation_theses
    where supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())
  ) or
  master_dissertation_id in (
    select id from public.master_dissertations
    where supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())
  )
)
with check (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or
  thesis_id in (
    select id from public.graduation_theses
    where supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())
  ) or
  master_dissertation_id in (
    select id from public.master_dissertations
    where supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())
  )
);
drop policy if exists "research milestones student upload" on public.research_milestones;
create policy "research milestones student upload" on public.research_milestones for update to authenticated
using (
  thesis_id in (select id from public.graduation_theses where student_id in (select id from public.students where user_id=auth.uid())) or
  master_dissertation_id in (select id from public.master_dissertations where student_id in (select id from public.students where user_id=auth.uid()))
)
with check (status <> 'approved');

drop policy if exists "attestation candidates staff read" on public.attestation_candidates;
create policy "attestation candidates staff read" on public.attestation_candidates for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator'])
);
drop policy if exists "attestation candidates coordinator manage" on public.attestation_candidates;
create policy "attestation candidates coordinator manage" on public.attestation_candidates for all to authenticated
using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']))
with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']));

-- Backfill the nine standard stages for existing work without changing entered values.
insert into public.research_milestones(thesis_id,stage_order,stage_name,supervisor_name)
select t.id,s.ord,s.name,t.supervisor_name
from public.graduation_theses t
cross join (values
  (1,'Muammoni o‘rganish'),(2,'Adabiyotlarni o‘rganish'),(3,'Mundarijani shakllantirish'),
  (4,'I bobni shakllantirish'),(5,'II bobni shakllantirish'),(6,'III bobni shakllantirish'),
  (7,'Xulosa va takliflarni shakllantirish'),(8,'Dastlabki himoya'),(9,'Yakuniy himoya')
) as s(ord,name)
on conflict (thesis_id,stage_order) do nothing;

insert into public.research_milestones(master_dissertation_id,stage_order,stage_name,supervisor_name)
select m.id,s.ord,s.name,m.supervisor_name
from public.master_dissertations m
cross join (values
  (1,'Muammoni o‘rganish'),(2,'Adabiyotlarni o‘rganish'),(3,'Mundarijani shakllantirish'),
  (4,'I bobni shakllantirish'),(5,'II bobni shakllantirish'),(6,'III bobni shakllantirish'),
  (7,'Xulosa va takliflarni shakllantirish'),(8,'Dastlabki himoya'),(9,'Yakuniy himoya')
) as s(ord,name)
on conflict (master_dissertation_id,stage_order) do nothing;
