-- =========================================
-- 0) FUNÇÃO DE UPDATED_AT (trigger helper)
-- =========================================
create or replace function set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- 1) TENANT: ORGANIZAÇÃO + PROFILE
-- =========================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id)
);

create trigger trg_org_updated_at
before update on organizations
for each row execute function set_updated_at();

create table if not exists profiles (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

-- Função: retorna organization_id do usuário logado
create or replace function current_org_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select organization_id
  from profiles
  where id = auth.uid()
$$;

-- =========================================
-- 2) CONTATOS
-- =========================================
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null check (type in ('PF','PJ')),
  name text not null,
  cpf_cnpj text,
  email text,
  phone text,
  whatsapp text,
  city text,
  state text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, type, cpf_cnpj)
);

create trigger trg_contacts_updated_at
before update on contacts
for each row execute function set_updated_at();

create index if not exists idx_contacts_org_name on contacts (organization_id, name);

-- =========================================
-- 3) CADASTROS AUXILIARES (STATUS/FASE/ÁREA/TIPO)
-- =========================================
create table if not exists case_statuses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  color text,
  sort_order int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists case_phases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists case_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists case_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

-- =========================================
-- 4) PROCESSOS
-- =========================================
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  cnj_number text,
  original_number text,
  internal_number text,
  status_id uuid references case_statuses(id),
  phase_id uuid references case_phases(id),
  area_id uuid references case_areas(id),
  type_id uuid references case_types(id),
  tribunal text,
  court text,
  court_division text,
  city text,
  state text,
  link_url text,
  physical_location text,
  pending_notes text,
  responsible_user_id uuid,
  claim_value numeric(14,2),
  fee_value numeric(14,2),
  fee_percent numeric(5,2),
  opened_at date,
  closed_at date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, cnj_number)
);

create trigger trg_cases_updated_at
before update on cases
for each row execute function set_updated_at();

create index if not exists idx_cases_org_updated on cases (organization_id, updated_at desc);
create index if not exists idx_cases_org_status on cases (organization_id, status_id);

-- Partes / Clientes vinculados ao processo
create table if not exists case_parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete restrict,
  role text not null,
  side text,
  is_primary_client boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (case_id, contact_id, role)
);

create index if not exists idx_case_parties_case on case_parties (case_id);

-- =========================================
-- 5) TAGS
-- =========================================
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists case_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (case_id, tag_id)
);

-- =========================================
-- 6) CAMPOS CUSTOM (por organização)
-- =========================================
create table if not exists custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('case','contact')),
  key text not null,
  label text not null,
  field_type text not null check (field_type in ('text','number','date','boolean','select')),
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, entity_type, key)
);

create table if not exists custom_field_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  custom_field_id uuid not null references custom_fields(id) on delete cascade,
  entity_id uuid not null,
  value_text text,
  value_number numeric,
  value_date date,
  value_bool boolean,
  value_json jsonb,
  created_at timestamptz not null default now(),
  unique (custom_field_id, entity_id)
);

-- =========================================
-- 7) TIMELINE (histórico do processo)
-- =========================================
create table if not exists case_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  event_type text not null,
  title text,
  description text,
  occurred_at timestamptz not null default now(),
  created_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_case_timeline_case_time
on case_timeline_events (case_id, occurred_at desc);

-- =========================================
-- 8) DOCUMENTOS / ANEXOS
-- =========================================
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  file_name text not null,
  mime_type text,
  file_size bigint,
  storage_path text not null,
  checksum text,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists document_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  case_id uuid references cases(id) on delete cascade,
  timeline_event_id uuid references case_timeline_events(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =========================================
-- 9) AUDITORIA
-- =========================================
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_org_time on audit_log (organization_id, created_at desc);

-- =========================================
-- 10) RLS - Habilitar em todas as tabelas
-- =========================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table case_statuses enable row level security;
alter table case_phases enable row level security;
alter table case_areas enable row level security;
alter table case_types enable row level security;
alter table cases enable row level security;
alter table case_parties enable row level security;
alter table tags enable row level security;
alter table case_tags enable row level security;
alter table custom_fields enable row level security;
alter table custom_field_values enable row level security;
alter table case_timeline_events enable row level security;
alter table documents enable row level security;
alter table document_links enable row level security;
alter table audit_log enable row level security;

-- =========================================
-- 11) RLS POLICIES - Organizations
-- =========================================
create policy org_select on organizations
for select using (owner_user_id = auth.uid());

create policy org_update on organizations
for update using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy org_insert on organizations
for insert with check (owner_user_id = auth.uid());

-- =========================================
-- 12) RLS POLICIES - Profiles
-- =========================================
create policy profiles_select on profiles
for select using (id = auth.uid());

create policy profiles_update on profiles
for update using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_insert on profiles
for insert with check (id = auth.uid());

-- =========================================
-- 13) RLS POLICIES - Tabelas de negócio (organization_id)
-- =========================================

-- contacts
create policy contacts_select on contacts for select using (organization_id = current_org_id());
create policy contacts_insert on contacts for insert with check (organization_id = current_org_id());
create policy contacts_update on contacts for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy contacts_delete on contacts for delete using (organization_id = current_org_id());

-- case_statuses
create policy case_statuses_select on case_statuses for select using (organization_id = current_org_id());
create policy case_statuses_insert on case_statuses for insert with check (organization_id = current_org_id());
create policy case_statuses_update on case_statuses for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy case_statuses_delete on case_statuses for delete using (organization_id = current_org_id());

-- case_phases
create policy case_phases_select on case_phases for select using (organization_id = current_org_id());
create policy case_phases_insert on case_phases for insert with check (organization_id = current_org_id());
create policy case_phases_update on case_phases for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy case_phases_delete on case_phases for delete using (organization_id = current_org_id());

-- case_areas
create policy case_areas_select on case_areas for select using (organization_id = current_org_id());
create policy case_areas_insert on case_areas for insert with check (organization_id = current_org_id());
create policy case_areas_update on case_areas for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy case_areas_delete on case_areas for delete using (organization_id = current_org_id());

-- case_types
create policy case_types_select on case_types for select using (organization_id = current_org_id());
create policy case_types_insert on case_types for insert with check (organization_id = current_org_id());
create policy case_types_update on case_types for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy case_types_delete on case_types for delete using (organization_id = current_org_id());

-- cases
create policy cases_select on cases for select using (organization_id = current_org_id());
create policy cases_insert on cases for insert with check (organization_id = current_org_id());
create policy cases_update on cases for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy cases_delete on cases for delete using (organization_id = current_org_id());

-- case_parties
create policy case_parties_select on case_parties for select using (organization_id = current_org_id());
create policy case_parties_insert on case_parties for insert with check (organization_id = current_org_id());
create policy case_parties_update on case_parties for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy case_parties_delete on case_parties for delete using (organization_id = current_org_id());

-- tags
create policy tags_select on tags for select using (organization_id = current_org_id());
create policy tags_insert on tags for insert with check (organization_id = current_org_id());
create policy tags_update on tags for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy tags_delete on tags for delete using (organization_id = current_org_id());

-- case_tags
create policy case_tags_select on case_tags for select using (organization_id = current_org_id());
create policy case_tags_insert on case_tags for insert with check (organization_id = current_org_id());
create policy case_tags_update on case_tags for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy case_tags_delete on case_tags for delete using (organization_id = current_org_id());

-- custom_fields
create policy custom_fields_select on custom_fields for select using (organization_id = current_org_id());
create policy custom_fields_insert on custom_fields for insert with check (organization_id = current_org_id());
create policy custom_fields_update on custom_fields for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy custom_fields_delete on custom_fields for delete using (organization_id = current_org_id());

-- custom_field_values
create policy custom_field_values_select on custom_field_values for select using (organization_id = current_org_id());
create policy custom_field_values_insert on custom_field_values for insert with check (organization_id = current_org_id());
create policy custom_field_values_update on custom_field_values for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy custom_field_values_delete on custom_field_values for delete using (organization_id = current_org_id());

-- case_timeline_events
create policy case_timeline_events_select on case_timeline_events for select using (organization_id = current_org_id());
create policy case_timeline_events_insert on case_timeline_events for insert with check (organization_id = current_org_id());
create policy case_timeline_events_update on case_timeline_events for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy case_timeline_events_delete on case_timeline_events for delete using (organization_id = current_org_id());

-- documents
create policy documents_select on documents for select using (organization_id = current_org_id());
create policy documents_insert on documents for insert with check (organization_id = current_org_id());
create policy documents_update on documents for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy documents_delete on documents for delete using (organization_id = current_org_id());

-- document_links
create policy document_links_select on document_links for select using (organization_id = current_org_id());
create policy document_links_insert on document_links for insert with check (organization_id = current_org_id());
create policy document_links_update on document_links for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
create policy document_links_delete on document_links for delete using (organization_id = current_org_id());

-- audit_log
create policy audit_log_select on audit_log for select using (organization_id = current_org_id());
create policy audit_log_insert on audit_log for insert with check (organization_id = current_org_id());

-- =========================================
-- 14) SEED FUNCTION + TRIGGER AUTO-CREATE ORG
-- =========================================
create or replace function seed_case_taxonomy(org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into case_statuses (organization_id, name, color, sort_order, is_default)
  values
    (org_id, 'Ativo', '#22c55e', 1, true),
    (org_id, 'Suspenso', '#eab308', 2, false),
    (org_id, 'Encerrado', '#6b7280', 3, false)
  on conflict do nothing;

  insert into case_phases (organization_id, name, sort_order)
  values
    (org_id, 'Inicial', 1),
    (org_id, 'Instrução', 2),
    (org_id, 'Recursal', 3),
    (org_id, 'Execução', 4)
  on conflict do nothing;

  insert into case_areas (organization_id, name, sort_order)
  values
    (org_id, 'Cível', 1),
    (org_id, 'Consumidor', 2),
    (org_id, 'Trabalhista', 3),
    (org_id, 'Saúde', 4),
    (org_id, 'Empresarial', 5)
  on conflict do nothing;

  insert into case_types (organization_id, name, sort_order)
  values
    (org_id, 'Obrigação de Fazer', 1),
    (org_id, 'Execução', 2),
    (org_id, 'Recurso', 3),
    (org_id, 'Cumprimento de Sentença', 4)
  on conflict do nothing;
end;
$$;

create or replace function handle_new_user_create_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
begin
  insert into organizations (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'office_name', 'Meu Escritório'), new.id)
  returning id into org_id;

  insert into profiles (id, organization_id, full_name)
  values (new.id, org_id, new.raw_user_meta_data->>'full_name');

  perform seed_case_taxonomy(org_id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user_create_org();