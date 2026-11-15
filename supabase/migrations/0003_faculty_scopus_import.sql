-- Faculty Scopus source mapping. Historical faculty records are preserved.
alter table public.faculty_profiles add column if not exists source_row integer;
alter table public.faculty_profiles add column if not exists faculty_code text;
alter table public.faculty_profiles add column if not exists source_position text;
alter table public.faculty_profiles add column if not exists scopus_profile_url text;
alter table public.faculty_profiles add column if not exists scopus_status text not null default 'missing';
alter table public.faculty_profiles add column if not exists scopus_verification_note text;
alter table public.faculty_profiles add column if not exists source_file text;

alter table public.faculty_profiles drop constraint if exists faculty_profiles_scopus_status_check;
alter table public.faculty_profiles add constraint faculty_profiles_scopus_status_check
  check (scopus_status in ('source_matched','missing','conflict'));

create unique index if not exists faculty_profiles_source_row_unique
  on public.faculty_profiles(source_row) where source_row is not null;
create index if not exists faculty_profiles_scopus_status_idx
  on public.faculty_profiles(scopus_status,is_active);
