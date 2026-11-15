-- SMART RIAX academic management expansion.
-- Historical Talaba–Mahalla tables and records are intentionally preserved.

alter table public.roles drop constraint if exists roles_code_check;
alter table public.roles add constraint roles_code_check check (code in (
  'super_admin','admin','department_head','faculty','quality_monitor',
  'research_monitor','graduate_coordinator','student','mahalla'
));

insert into public.roles (code,name) values
  ('super_admin','Super Admin'),
  ('department_head','Kafedra mudiri'),
  ('faculty','Professor-o‘qituvchi'),
  ('quality_monitor','Ta’lim sifati monitoring mas’uli'),
  ('research_monitor','Ilmiy nashrlar monitoring mas’uli'),
  ('graduate_coordinator','Bitiruv ishlari koordinatori')
on conflict (code) do update set name=excluded.name;

create or replace function public.has_any_role(allowed text[])
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select role=any(allowed) from public.users where id=auth.uid()),false)
$$;

create table public.faculty_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,
  full_name text not null,
  academic_degree text,
  academic_title text,
  position text not null,
  employment_status text not null default 'active' check (employment_status in ('active','part_time','leave','inactive')),
  department text not null default 'Raqamli iqtisodiyot va axborot xavfsizligi',
  teaching_subjects text[] not null default '{}',
  contact_email text,
  contact_phone text,
  employment_start_date date,
  professional_qualifications jsonb not null default '[]'::jsonb,
  scopus_author_id text,
  wos_researcher_id text,
  orcid text,
  teaching_statistics jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faculty_certificates (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  certificate_name text not null,
  issuing_organization text not null,
  certificate_number text,
  issue_date date not null,
  expiration_date date,
  storage_path text,
  file_name text,
  mime_type text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','expired')),
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_development (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  activity_name text not null,
  provider text,
  started_at date,
  completed_at date,
  next_required_date date,
  validity_months integer check (validity_months is null or validity_months > 0),
  status text not null default 'planned' check (status in ('planned','in_progress','completed','overdue','cancelled')),
  certificate_id uuid references public.faculty_certificates(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scientific_publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text not null,
  journal_or_conference text not null,
  publication_year integer not null check (publication_year between 1900 and 2200),
  doi text,
  issn text,
  is_scopus_indexed boolean,
  is_wos_indexed boolean,
  journal_quartile text check (journal_quartile is null or journal_quartile in ('Q1','Q2','Q3','Q4')),
  publication_url text,
  storage_path text,
  file_name text,
  mime_type text,
  source text not null default 'manual' check (source in ('manual','excel_import','csv_import','crossref','scopus_api','wos_api')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','imported','verified','rejected')),
  verification_date date,
  citations integer check (citations is null or citations >= 0),
  submitted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index scientific_publications_doi_unique on public.scientific_publications(lower(doi)) where doi is not null and doi<>'';

create table public.publication_authors (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.scientific_publications(id) on delete cascade,
  faculty_id uuid references public.faculty_profiles(id) on delete set null,
  author_name text not null,
  author_order smallint not null default 1 check (author_order > 0),
  is_corresponding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(publication_id,author_name)
);

create table public.publication_external_ids (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.scientific_publications(id) on delete cascade,
  provider text not null check (provider in ('doi','scopus','wos','crossref','orcid','other')),
  external_id text not null,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,external_id)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  academic_year text not null,
  semester smallint check (semester between 1 and 12),
  credits numeric(4,1) check (credits is null or credits >= 0),
  syllabus_storage_path text,
  storage_path text,
  file_name text,
  mime_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subject_assignments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  academic_group text,
  schedule jsonb not null default '{}'::jsonb,
  academic_year text not null,
  semester smallint check (semester between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subject_id,faculty_id,academic_group,academic_year,semester)
);

create table public.educational_materials (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic text not null,
  content_type text not null check (content_type in ('presentation','lecture_note','practice','seminar','laboratory','syllabus','curriculum','manual','video','other')),
  academic_year text not null,
  current_version text not null default '1.0',
  approval_status text not null default 'draft' check (approval_status in ('draft','submitted','approved','revision_required','rejected')),
  storage_path text,
  file_name text,
  mime_type text,
  ai_assistance_declared boolean not null default false,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.educational_materials(id) on delete cascade,
  version text not null,
  storage_path text,
  file_name text,
  change_notes text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(material_id,version)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.subject_assignments(id) on delete set null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  lesson_date date not null,
  academic_group text not null,
  topic text not null,
  lesson_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_content_usage (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  material_id uuid not null references public.educational_materials(id) on delete cascade,
  usage_type text not null default 'self_reported' check (usage_type in ('platform_opened','platform_presented','self_reported','supervisor_verified')),
  observed_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lesson_id,material_id,usage_type)
);

create table public.quality_reviews (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.educational_materials(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  reviewer_id uuid references public.users(id) on delete set null,
  syllabus_compliance smallint check (syllabus_compliance between 0 and 100),
  topic_alignment smallint check (topic_alignment between 0 and 100),
  completeness smallint check (completeness between 0 and 100),
  relevance smallint check (relevance between 0 and 100),
  structure_clarity smallint check (structure_clarity between 0 and 100),
  current_references smallint check (current_references between 0 and 100),
  checklist jsonb not null default '{}'::jsonb,
  overall_score numeric(5,2) check (overall_score is null or overall_score between 0 and 100),
  status text not null default 'draft' check (status in ('draft','completed','revision_required','approved')),
  comments text,
  corrective_action_status text default 'not_required' check (corrective_action_status in ('not_required','required','in_progress','completed')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (material_id is not null or lesson_id is not null)
);

create table public.ai_usage_declarations (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.educational_materials(id) on delete cascade,
  faculty_id uuid not null references public.faculty_profiles(id) on delete cascade,
  ai_tool_category text not null,
  purpose text not null,
  human_review_confirmed boolean not null default false,
  supporting_metadata jsonb not null default '{}'::jsonb,
  automated_indicator numeric(5,2) check (automated_indicator is null or automated_indicator between 0 and 100),
  reviewer_comments text,
  review_status text not null default 'declared' check (review_status in ('declared','human_review_required','reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.internship_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  academic_group text,
  organization_name text not null,
  university_supervisor_id uuid references public.faculty_profiles(id) on delete set null,
  university_supervisor_name text,
  organization_supervisor text,
  start_date date not null,
  end_date date not null,
  individual_plan text,
  progress smallint not null default 0 check (progress between 0 and 100),
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled')),
  assessment_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.internship_reports (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internship_assignments(id) on delete cascade,
  title text not null,
  report_date date not null default current_date,
  storage_path text,
  file_name text,
  status text not null default 'submitted' check (status in ('draft','submitted','approved','revision_required','rejected')),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.graduation_theses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  thesis_topic text not null,
  supervisor_id uuid references public.faculty_profiles(id) on delete set null,
  supervisor_name text,
  topic_approval_status text not null default 'pending' check (topic_approval_status in ('pending','approved','rejected','revision_required')),
  progress smallint not null default 0 check (progress between 0 and 100),
  plagiarism_service text,
  plagiarism_check_date date,
  plagiarism_result jsonb,
  defense_readiness text not null default 'not_ready' check (defense_readiness in ('not_ready','review','ready')),
  final_storage_path text,
  final_file_name text,
  storage_path text,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.thesis_milestones (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid not null references public.graduation_theses(id) on delete cascade,
  title text not null,
  due_date date,
  submitted_at timestamptz,
  status text not null default 'planned' check (status in ('planned','in_progress','submitted','approved','revision_required')),
  storage_path text,
  file_name text,
  reviewer_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attestation_commissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_year text not null,
  chairperson text,
  members jsonb not null default '[]'::jsonb,
  schedule_start timestamptz,
  schedule_end timestamptz,
  location text,
  documents jsonb not null default '[]'::jsonb,
  storage_path text,
  file_name text,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attestation_results (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.attestation_commissions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  scheduled_at timestamptz,
  status text not null default 'eligible' check (status in ('eligible','scheduled','completed','absent','deferred')),
  evaluation_records jsonb not null default '[]'::jsonb,
  final_result text,
  recorded_by uuid references public.users(id) on delete set null,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(commission_id,student_id)
);

alter table public.notifications add column if not exists entity_type text;
alter table public.notifications add column if not exists entity_id uuid;
alter table public.notifications add column if not exists due_at timestamptz;
alter table public.notifications add column if not exists priority text default 'normal' check (priority in ('low','normal','high','urgent'));

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index faculty_profiles_active_idx on public.faculty_profiles(is_active,employment_status);
create index faculty_certificates_expiration_idx on public.faculty_certificates(expiration_date,verification_status);
create index professional_development_due_idx on public.professional_development(next_required_date,status);
create index scientific_publications_year_idx on public.scientific_publications(publication_year,verification_status);
create index publication_authors_faculty_idx on public.publication_authors(faculty_id);
create index educational_materials_faculty_subject_idx on public.educational_materials(faculty_id,subject_id,approval_status);
create index lessons_date_idx on public.lessons(lesson_date,faculty_id);
create index quality_reviews_material_idx on public.quality_reviews(material_id,status);
create index internships_student_idx on public.internship_assignments(student_id,status);
create index theses_student_idx on public.graduation_theses(student_id,defense_readiness);
create index attestation_results_student_idx on public.attestation_results(student_id,status);
create index audit_logs_entity_idx on public.audit_logs(entity_type,entity_id,created_at desc);

do $$ declare t text; begin
  foreach t in array array[
    'faculty_profiles','faculty_certificates','professional_development','scientific_publications','publication_authors','publication_external_ids',
    'subjects','subject_assignments','educational_materials','content_versions','lessons','lesson_content_usage','quality_reviews','ai_usage_declarations',
    'internship_assignments','internship_reports','graduation_theses','thesis_milestones',
    'attestation_commissions','attestation_results'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', 'touch_'||t, t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array[
    'faculty_profiles','faculty_certificates','professional_development','scientific_publications',
    'publication_authors','publication_external_ids','subjects','subject_assignments',
    'educational_materials','content_versions','lessons','lesson_content_usage','quality_reviews',
    'ai_usage_declarations','internship_assignments','internship_reports','graduation_theses',
    'thesis_milestones','attestation_commissions','attestation_results','audit_logs'
  ] loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;

create policy "faculty profiles staff or own read" on public.faculty_profiles for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor','research_monitor','graduate_coordinator']) or user_id=auth.uid()
);
create policy "faculty profiles admin or own manage" on public.faculty_profiles for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head']) or user_id=auth.uid())
  with check (public.has_any_role(array['super_admin','admin','department_head']) or user_id=auth.uid());
create policy "faculty certificates scoped read" on public.faculty_certificates for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid())
);
create policy "faculty certificates scoped manage" on public.faculty_certificates for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()))
  with check (public.has_any_role(array['super_admin','admin','department_head']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()));
create policy "development scoped read" on public.professional_development for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid())
);
create policy "development scoped manage" on public.professional_development for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()))
  with check (public.has_any_role(array['super_admin','admin','department_head']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()));

create policy "publications staff read" on public.scientific_publications for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','research_monitor']));
create policy "publications authorized manage" on public.scientific_publications for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','research_monitor']) or submitted_by=auth.uid())
  with check (public.has_any_role(array['super_admin','admin','department_head','research_monitor']) or submitted_by=auth.uid());
create policy "publication authors staff read" on public.publication_authors for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','research_monitor']));
create policy "publication authors authorized manage" on public.publication_authors for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','research_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()))
  with check (public.has_any_role(array['super_admin','admin','department_head','research_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()));
create policy "publication ids staff read" on public.publication_external_ids for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','research_monitor']));
create policy "publication ids research manage" on public.publication_external_ids for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','research_monitor']))
  with check (public.has_any_role(array['super_admin','admin','department_head','research_monitor']));

create policy "subjects staff read" on public.subjects for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor']));
create policy "subjects admin manage" on public.subjects for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head'])) with check (public.has_any_role(array['super_admin','admin','department_head']));
create policy "assignments staff read" on public.subject_assignments for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor']));
create policy "assignments admin manage" on public.subject_assignments for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head'])) with check (public.has_any_role(array['super_admin','admin','department_head']));
create policy "materials staff read" on public.educational_materials for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor']));
create policy "materials faculty or admin manage" on public.educational_materials for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()))
  with check (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()));
create policy "content versions follow material" on public.content_versions for select to authenticated using (exists(select 1 from public.educational_materials m where m.id=material_id));
create policy "content versions owner manage" on public.content_versions for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head']) or uploaded_by=auth.uid())
  with check (public.has_any_role(array['super_admin','admin','department_head']) or uploaded_by=auth.uid());
create policy "lessons staff read" on public.lessons for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor']));
create policy "lessons faculty manage" on public.lessons for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()))
  with check (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()));
create policy "lesson usage staff read" on public.lesson_content_usage for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor']));
create policy "lesson usage faculty manage" on public.lesson_content_usage for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','quality_monitor','faculty']))
  with check (public.has_any_role(array['super_admin','admin','department_head','quality_monitor','faculty']));

create policy "quality reviews staff read" on public.quality_reviews for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor']));
create policy "quality reviews quality manage" on public.quality_reviews for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']))
  with check (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']));
create policy "ai declarations staff read" on public.ai_usage_declarations for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head','faculty','quality_monitor']));
create policy "ai declarations scoped manage" on public.ai_usage_declarations for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()))
  with check (public.has_any_role(array['super_admin','admin','department_head','quality_monitor']) or faculty_id in (select id from public.faculty_profiles where user_id=auth.uid()));

create policy "internships scope read" on public.internship_assignments for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or
  student_id in (select id from public.students where user_id=auth.uid()) or
  university_supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())
);
create policy "internships coordinator manage" on public.internship_assignments for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']))
  with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']));
create policy "internship reports scope read" on public.internship_reports for select to authenticated using (exists(select 1 from public.internship_assignments i where i.id=internship_id));
create policy "internship reports scope manage" on public.internship_reports for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or internship_id in (select id from public.internship_assignments where student_id in (select id from public.students where user_id=auth.uid())))
  with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or internship_id in (select id from public.internship_assignments where student_id in (select id from public.students where user_id=auth.uid())));
create policy "theses scope read" on public.graduation_theses for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or
  student_id in (select id from public.students where user_id=auth.uid()) or
  supervisor_id in (select id from public.faculty_profiles where user_id=auth.uid())
);
create policy "theses coordinator manage" on public.graduation_theses for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']))
  with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']));
create policy "milestones follow thesis" on public.thesis_milestones for select to authenticated using (exists(select 1 from public.graduation_theses t where t.id=thesis_id));
create policy "milestones authorized manage" on public.thesis_milestones for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator','faculty']))
  with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator','faculty']));
create policy "commissions scoped read" on public.attestation_commissions for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or id in (select commission_id from public.attestation_results where student_id in (select id from public.students where user_id=auth.uid()))
);
create policy "commissions coordinator manage" on public.attestation_commissions for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']))
  with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']));
create policy "attestation scope read" on public.attestation_results for select to authenticated using (
  public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']) or
  student_id in (select id from public.students where user_id=auth.uid())
);
create policy "attestation coordinator manage" on public.attestation_results for all to authenticated
  using (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']))
  with check (public.has_any_role(array['super_admin','admin','department_head','graduate_coordinator']));
create policy "audit admins read" on public.audit_logs for select to authenticated using (public.has_any_role(array['super_admin','admin','department_head']));

create or replace function public.log_smart_riax_change() returns trigger
language plpgsql security definer set search_path=public as $$
declare record_id uuid;
begin
  record_id := case when tg_op='DELETE' then old.id else new.id end;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,old_data,new_data)
  values(auth.uid(),lower(tg_op),tg_table_name,record_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end);
  return case when tg_op='DELETE' then old else new end;
end $$;

do $$ declare t text; begin
  foreach t in array array[
    'faculty_profiles','faculty_certificates','professional_development','scientific_publications',
    'subjects','subject_assignments','educational_materials','content_versions','lessons','lesson_content_usage',
    'quality_reviews','ai_usage_declarations','internship_assignments','internship_reports',
    'graduation_theses','thesis_milestones','attestation_commissions','attestation_results'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_smart_riax_change()', 'audit_'||t, t);
  end loop;
end $$;

create or replace function public.queue_professional_development_notifications() returns integer
language plpgsql security definer set search_path=public as $$
declare inserted_count integer;
begin
  insert into public.notifications(user_id,title,message,action_url,entity_type,entity_id,due_at,priority)
  select f.user_id,'Malaka oshirish muddati',
    case when p.next_required_date < current_date then 'Malaka oshirish muddati o‘tgan.'
         else 'Malaka oshirish muddatigacha '||(p.next_required_date-current_date)||' kun qoldi.' end,
    '/faculty/development','professional_development',p.id,p.next_required_date::timestamptz,
    case when p.next_required_date < current_date then 'urgent' when p.next_required_date-current_date<=7 then 'high' else 'normal' end
  from public.professional_development p join public.faculty_profiles f on f.id=p.faculty_id
  where f.user_id is not null and p.next_required_date is not null and p.next_required_date-current_date<=30
    and not exists(select 1 from public.notifications n where n.user_id=f.user_id and n.entity_type='professional_development' and n.entity_id=p.id and n.due_at::date=p.next_required_date);
  get diagnostics inserted_count = row_count;
  return inserted_count;
end $$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('smart-riax-documents','smart-riax-documents',false,52428800,array[
  'application/pdf','image/jpeg','image/png','video/mp4',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]) on conflict (id) do nothing;
create policy "smart documents authenticated upload" on storage.objects for insert to authenticated
  with check (bucket_id='smart-riax-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "smart documents scoped read" on storage.objects for select to authenticated
  using (bucket_id='smart-riax-documents');
create policy "smart documents owner delete" on storage.objects for delete to authenticated
  using (bucket_id='smart-riax-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.has_any_role(array['super_admin','admin','department_head'])));
