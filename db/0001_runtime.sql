-- Runtime-only data. Engineering model definitions remain versioned in git.

create table if not exists material_prices (
  id bigserial primary key,
  material_key text not null,
  market text not null,
  unit text not null,
  price_minor bigint not null check (price_minor >= 0),
  currency char(3) not null,
  supplier text,
  source_url text,
  updated_at timestamptz not null default now(),
  active boolean not null default true
);

create index if not exists material_prices_market_active_idx
  on material_prices (market, active, material_key);

create table if not exists price_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  market text not null,
  currency char(3) not null,
  created_at timestamptz not null default now()
);

create table if not exists saved_projects (
  id uuid primary key default gen_random_uuid(),
  model_id text not null,
  model_version text not null,
  locale text not null check (locale in ('sr', 'en')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table material_prices is 'Mutable market pricing only; never the source of truth for engineering properties.';
comment on table saved_projects is 'Runtime user project state. Canonical shelter definitions live in git.';
