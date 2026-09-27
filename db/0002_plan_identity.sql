-- Plan identity and timestamp hygiene for mutable runtime data.
-- Canonical engineering geometry remains versioned in Git.

alter table if exists saved_projects
  add column if not exists compiler_version text,
  add column if not exists plan_fingerprint text,
  add column if not exists settings_schema_version integer not null default 1;

alter table if exists saved_projects
  drop constraint if exists saved_projects_plan_fingerprint_check;

alter table if exists saved_projects
  add constraint saved_projects_plan_fingerprint_check
  check (
    plan_fingerprint is null
    or plan_fingerprint ~ '^[0-9a-f]{16}$'
  );

create index if not exists saved_projects_plan_identity_idx
  on saved_projects (model_id, model_version, compiler_version, plan_fingerprint);

create or replace function set_runtime_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_projects_set_updated_at on saved_projects;
create trigger saved_projects_set_updated_at
before update on saved_projects
for each row
execute function set_runtime_updated_at();

drop trigger if exists material_prices_set_updated_at on material_prices;
create trigger material_prices_set_updated_at
before update on material_prices
for each row
execute function set_runtime_updated_at();

comment on column saved_projects.compiler_version is
  'Compiler method version used to produce the referenced plan. Runtime metadata only.';

comment on column saved_projects.plan_fingerprint is
  'Deterministic compiled-plan fingerprint. Does not override canonical engineering geometry.';

comment on column saved_projects.settings_schema_version is
  'Version of mutable saved-project settings JSON, independent of engineering model/compiler versions.';
