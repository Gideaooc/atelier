-- Estrutura comercial inicial do Atelier.
-- Execute no Supabase SQL Editor ou com `supabase db push`.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.app_role as enum ('ADMIN', 'USER');
create type public.booklet_status as enum ('OPEN', 'IN_PROGRESS', 'COMPLETED');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  username citext not null,
  role public.app_role not null default 'USER',
  active boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, username)
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index operations_org_name_unique
  on public.operations (organization_id, lower(name));
create index operations_org_sort_idx
  on public.operations (organization_id, sort_order, name);

create table public.product_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code citext not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.reference_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reference_id uuid not null references public.product_references(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete restrict,
  sort_order integer not null,
  price_per_pair numeric(12, 2) not null default 0 check (price_per_pair >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reference_id, operation_id),
  constraint reference_operations_reference_sort_unique
    unique (reference_id, sort_order) deferrable initially deferred
);

create index reference_operations_reference_sort_idx
  on public.reference_operations (reference_id, sort_order);

create table public.booklets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number citext not null,
  reference_id uuid not null references public.product_references(id) on delete restrict,
  total_pairs integer not null check (total_pairs > 0),
  received_at date not null,
  status public.booklet_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);

create index booklets_org_received_idx
  on public.booklets (organization_id, received_at desc);

create table public.completions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booklet_id uuid not null references public.booklets(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete restrict,
  employee_user_id uuid not null references public.profiles(id) on delete restrict,
  recorded_by_user_id uuid references public.profiles(id) on delete set null default auth.uid(),
  quantity integer not null check (quantity > 0),
  notes text not null default '',
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index completions_booklet_operation_idx
  on public.completions (booklet_id, operation_id, completed_at desc);
create index completions_employee_idx
  on public.completions (employee_user_id, completed_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Sistema',
  action text not null,
  module text not null,
  entity_type text not null,
  entity_id text,
  entity_label text not null default 'Registro',
  description text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);
create index audit_logs_org_actor_idx
  on public.audit_logs (organization_id, actor_user_id, created_at desc);
create index audit_logs_org_module_action_idx
  on public.audit_logs (organization_id, module, action, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger operations_set_updated_at
before update on public.operations
for each row execute function public.set_updated_at();

create trigger product_references_set_updated_at
before update on public.product_references
for each row execute function public.set_updated_at();

create trigger reference_operations_set_updated_at
before update on public.reference_operations
for each row execute function public.set_updated_at();

create trigger booklets_set_updated_at
before update on public.booklets
for each row execute function public.set_updated_at();

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid() and active = true
  limit 1;
$$;

create or replace function public.has_permission(permission_key text, access_mode text default 'view')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        case
          when role = 'ADMIN' then true
          when access_mode = 'edit' then coalesce((permissions -> permission_key ->> 'edit')::boolean, false)
          else coalesce((permissions -> permission_key ->> 'view')::boolean, false)
            or coalesce((permissions -> permission_key ->> 'edit')::boolean, false)
        end
      from public.profiles
      where id = auth.uid() and active = true
    ),
    false
  );
$$;

create or replace function public.bootstrap_organization(
  organization_name text,
  owner_username text,
  owner_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'O usuário já pertence a uma organização.';
  end if;

  insert into public.organizations (name)
  values (trim(organization_name))
  returning id into new_organization_id;

  insert into public.profiles (
    id,
    organization_id,
    name,
    username,
    role,
    active,
    permissions
  ) values (
    auth.uid(),
    new_organization_id,
    trim(owner_name),
    lower(trim(owner_username)),
    'ADMIN',
    true,
    jsonb_build_object(
      'dashboard.summary', jsonb_build_object('view', true, 'edit', true),
      'dashboard.filters', jsonb_build_object('view', true, 'edit', true),
      'dashboard.bookletList', jsonb_build_object('view', true, 'edit', true),
      'dashboard.details', jsonb_build_object('view', true, 'edit', true),
      'booklets.form', jsonb_build_object('view', true, 'edit', true),
      'booklets.list', jsonb_build_object('view', true, 'edit', true),
      'booklets.actions', jsonb_build_object('view', true, 'edit', true),
      'production.selector', jsonb_build_object('view', true, 'edit', true),
      'production.entry', jsonb_build_object('view', true, 'edit', true),
      'production.history', jsonb_build_object('view', true, 'edit', true),
      'operations.batch', jsonb_build_object('view', true, 'edit', true),
      'operations.list', jsonb_build_object('view', true, 'edit', true),
      'references.batch', jsonb_build_object('view', true, 'edit', true),
      'references.list', jsonb_build_object('view', true, 'edit', true),
      'references.route', jsonb_build_object('view', true, 'edit', true),
      'users.list', jsonb_build_object('view', true, 'edit', true),
      'users.form', jsonb_build_object('view', true, 'edit', true),
      'users.permissions', jsonb_build_object('view', true, 'edit', true),
      'audit.logs', jsonb_build_object('view', true, 'edit', false)
    )
  );

  return new_organization_id;
end;
$$;


create or replace function public.validate_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  booklet_org_id uuid;
  booklet_reference_id uuid;
  booklet_total_pairs integer;
  already_completed integer;
begin
  select organization_id, reference_id, total_pairs
  into booklet_org_id, booklet_reference_id, booklet_total_pairs
  from public.booklets
  where id = new.booklet_id;

  if booklet_org_id is null then
    raise exception 'Talão não encontrado.';
  end if;

  if new.organization_id is null then
    new.organization_id := booklet_org_id;
  elsif new.organization_id <> booklet_org_id then
    raise exception 'O talão pertence a outra organização.';
  end if;

  if not exists (
    select 1
    from public.reference_operations
    where organization_id = booklet_org_id
      and reference_id = booklet_reference_id
      and operation_id = new.operation_id
  ) then
    raise exception 'A operação não pertence ao roteiro da referência do talão.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = new.employee_user_id
      and organization_id = booklet_org_id
      and active = true
  ) then
    raise exception 'Funcionário inválido, inativo ou pertencente a outra organização.';
  end if;

  new.recorded_by_user_id := coalesce(new.recorded_by_user_id, auth.uid());
  if new.recorded_by_user_id is not null and not exists (
    select 1
    from public.profiles
    where id = new.recorded_by_user_id
      and organization_id = booklet_org_id
      and active = true
  ) then
    raise exception 'Usuário responsável pelo lançamento é inválido.';
  end if;

  select coalesce(sum(quantity), 0)
  into already_completed
  from public.completions
  where booklet_id = new.booklet_id
    and operation_id = new.operation_id
    and id <> coalesce(new.id, gen_random_uuid());

  if already_completed + new.quantity > booklet_total_pairs then
    raise exception 'A quantidade ultrapassa o saldo restante da operação.';
  end if;

  return new;
end;
$$;

create trigger completions_validate
before insert or update on public.completions
for each row execute function public.validate_completion();

create or replace function public.recalculate_booklet_status(target_booklet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  booklet_total integer;
  booklet_reference uuid;
  current_status public.booklet_status;
  route_count integer;
  completed_route_count integer;
  production_count integer;
  next_status public.booklet_status;
begin
  select total_pairs, reference_id, status
  into booklet_total, booklet_reference, current_status
  from public.booklets
  where id = target_booklet_id;

  if booklet_total is null then
    return;
  end if;

  select count(*)
  into route_count
  from public.reference_operations
  where reference_id = booklet_reference;

  if route_count = 0 then
    next_status := 'OPEN';
  else
    select count(*)
    into completed_route_count
    from public.reference_operations route
    where route.reference_id = booklet_reference
      and (
        select coalesce(sum(completion.quantity), 0)
        from public.completions completion
        where completion.booklet_id = target_booklet_id
          and completion.operation_id = route.operation_id
      ) >= booklet_total;

    select count(*)
    into production_count
    from public.completions
    where booklet_id = target_booklet_id;

    if completed_route_count = route_count then
      next_status := 'COMPLETED';
    elsif production_count > 0 then
      next_status := 'IN_PROGRESS';
    else
      next_status := 'OPEN';
    end if;
  end if;

  if next_status is distinct from current_status then
    update public.booklets
    set status = next_status
    where id = target_booklet_id;
  end if;
end;
$$;

create or replace function public.refresh_booklet_after_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recalculate_booklet_status(old.booklet_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalculate_booklet_status(new.booklet_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger completions_refresh_booklet
  after insert or update or delete on public.completions
  for each row execute function public.refresh_booklet_after_completion();

create or replace function public.refresh_booklet_after_definition_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_booklet_status(new.id);
  return new;
end;
$$;

create trigger booklets_refresh_after_definition_change
  after update of total_pairs, reference_id on public.booklets
  for each row execute function public.refresh_booklet_after_definition_change();


create or replace function public.refresh_booklets_after_route_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_reference_id uuid;
  booklet_record record;
begin
  if tg_op = 'DELETE' then
    affected_reference_id := old.reference_id;
  else
    affected_reference_id := new.reference_id;
  end if;
  for booklet_record in
    select id from public.booklets where reference_id = affected_reference_id
  loop
    perform public.recalculate_booklet_status(booklet_record.id);
  end loop;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger reference_operations_refresh_booklets
  after insert or update or delete on public.reference_operations
  for each row execute function public.refresh_booklets_after_route_change();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_old jsonb;
  row_new jsonb;
  target_org_id uuid;
  target_entity_id text;
  target_entity_label text;
  target_action text;
  target_actor_name text;
begin
  row_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  row_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;

  target_org_id := coalesce(
    (row_new ->> 'organization_id')::uuid,
    (row_old ->> 'organization_id')::uuid
  );
  target_entity_id := coalesce(row_new ->> 'id', row_old ->> 'id');
  target_entity_label := coalesce(
    row_new ->> 'name', row_old ->> 'name',
    row_new ->> 'code', row_old ->> 'code',
    row_new ->> 'number', row_old ->> 'number',
    target_entity_id,
    tg_argv[1]
  );
  target_action := case
    when tg_argv[1] = 'completion' and tg_op = 'INSERT' then 'COMPLETE'
    when tg_op = 'INSERT' then 'CREATE'
    when tg_op = 'UPDATE' then 'UPDATE'
    else 'DELETE'
  end;

  select name into target_actor_name
  from public.profiles
  where id = auth.uid();

  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    actor_name,
    action,
    module,
    entity_type,
    entity_id,
    entity_label,
    description,
    old_data,
    new_data
  ) values (
    target_org_id,
    auth.uid(),
    coalesce(target_actor_name, 'Sistema'),
    target_action,
    tg_argv[0],
    tg_argv[1],
    target_entity_id,
    target_entity_label,
    format('%s em %s: %s', target_action, tg_argv[1], target_entity_label),
    row_old - 'password' - 'encrypted_password',
    row_new - 'password' - 'encrypted_password'
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.audit_row_change('USERS', 'user');

create trigger audit_operations
after insert or update or delete on public.operations
for each row execute function public.audit_row_change('OPERATIONS', 'operation');

create trigger audit_product_references
after insert or update or delete on public.product_references
for each row execute function public.audit_row_change('REFERENCES', 'reference');

create trigger audit_reference_operations
after insert or update or delete on public.reference_operations
for each row execute function public.audit_row_change('REFERENCES', 'reference_operation');

create trigger audit_booklets
after insert or update or delete on public.booklets
for each row execute function public.audit_row_change('BOOKLETS', 'booklet');

create trigger audit_completions
after insert or update or delete on public.completions
for each row execute function public.audit_row_change('PRODUCTION', 'completion');


create or replace function public.record_auth_audit(event_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
begin
  if event_action not in ('LOGIN', 'LOGOUT') then
    raise exception 'Evento de autenticação inválido.';
  end if;

  select * into actor_profile
  from public.profiles
  where id = auth.uid() and active = true;

  if actor_profile.id is null then
    raise exception 'Perfil ativo não encontrado.';
  end if;

  insert into public.audit_logs (
    organization_id, actor_user_id, actor_name, action, module, entity_type,
    entity_id, entity_label, description, old_data, new_data
  ) values (
    actor_profile.organization_id,
    actor_profile.id,
    actor_profile.name,
    event_action,
    'AUTH',
    'session',
    actor_profile.id::text,
    actor_profile.name,
    case
      when event_action = 'LOGIN' then actor_profile.name || ' entrou no sistema.'
      else actor_profile.name || ' saiu do sistema.'
    end,
    case when event_action = 'LOGOUT' then jsonb_build_object('username', actor_profile.username) else null end,
    case when event_action = 'LOGIN' then jsonb_build_object('username', actor_profile.username) else null end
  );
end;
$$;

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Logs de auditoria são imutáveis.';
end;
$$;

create trigger audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.operations enable row level security;
alter table public.product_references enable row level security;
alter table public.reference_operations enable row level security;
alter table public.booklets enable row level security;
alter table public.completions enable row level security;
alter table public.audit_logs enable row level security;

create policy organizations_select_same_org
on public.organizations for select
using (id = public.current_organization_id());

create policy organizations_update_admin
on public.organizations for update
using (id = public.current_organization_id() and public.has_permission('users.permissions', 'edit'))
with check (id = public.current_organization_id());

create policy profiles_select_same_org
on public.profiles for select
using (organization_id = public.current_organization_id());

create policy profiles_insert_admin
on public.profiles for insert
with check (
  organization_id = public.current_organization_id()
  and public.has_permission('users.form', 'edit')
);

create policy profiles_update_admin
on public.profiles for update
using (
  organization_id = public.current_organization_id()
  and public.has_permission('users.form', 'edit')
)
with check (
  organization_id = public.current_organization_id()
  and public.has_permission('users.form', 'edit')
);

create policy profiles_delete_admin
on public.profiles for delete
using (
  organization_id = public.current_organization_id()
  and public.has_permission('users.list', 'edit')
  and id <> auth.uid()
);

create policy operations_select
on public.operations for select
using (organization_id = public.current_organization_id());

create policy operations_insert
on public.operations for insert
with check (
  organization_id = public.current_organization_id()
  and public.has_permission('operations.batch', 'edit')
);

create policy operations_update
on public.operations for update
using (
  organization_id = public.current_organization_id()
  and public.has_permission('operations.list', 'edit')
)
with check (organization_id = public.current_organization_id());

create policy operations_delete
on public.operations for delete
using (
  organization_id = public.current_organization_id()
  and public.has_permission('operations.list', 'edit')
);

create policy references_select
on public.product_references for select
using (organization_id = public.current_organization_id());

create policy references_insert
on public.product_references for insert
with check (
  organization_id = public.current_organization_id()
  and public.has_permission('references.batch', 'edit')
);

create policy references_update
on public.product_references for update
using (
  organization_id = public.current_organization_id()
  and public.has_permission('references.list', 'edit')
)
with check (organization_id = public.current_organization_id());

create policy references_delete
on public.product_references for delete
using (
  organization_id = public.current_organization_id()
  and public.has_permission('references.list', 'edit')
);

create policy reference_operations_select
on public.reference_operations for select
using (organization_id = public.current_organization_id());

create policy reference_operations_insert
on public.reference_operations for insert
with check (
  organization_id = public.current_organization_id()
  and public.has_permission('references.route', 'edit')
);

create policy reference_operations_update
on public.reference_operations for update
using (
  organization_id = public.current_organization_id()
  and public.has_permission('references.route', 'edit')
)
with check (organization_id = public.current_organization_id());

create policy reference_operations_delete
on public.reference_operations for delete
using (
  organization_id = public.current_organization_id()
  and public.has_permission('references.route', 'edit')
);

create policy booklets_select
on public.booklets for select
using (organization_id = public.current_organization_id());

create policy booklets_insert
on public.booklets for insert
with check (
  organization_id = public.current_organization_id()
  and public.has_permission('booklets.form', 'edit')
);

create policy booklets_update
on public.booklets for update
using (
  organization_id = public.current_organization_id()
  and public.has_permission('booklets.actions', 'edit')
)
with check (organization_id = public.current_organization_id());

create policy booklets_delete
on public.booklets for delete
using (
  organization_id = public.current_organization_id()
  and public.has_permission('booklets.actions', 'edit')
);

create policy completions_select
on public.completions for select
using (organization_id = public.current_organization_id());

create policy completions_insert
on public.completions for insert
with check (
  organization_id = public.current_organization_id()
  and public.has_permission('production.entry', 'edit')
  and recorded_by_user_id = auth.uid()
);

create policy completions_delete
on public.completions for delete
using (
  organization_id = public.current_organization_id()
  and public.has_permission('production.history', 'edit')
);

create policy audit_logs_select
on public.audit_logs for select
using (
  organization_id = public.current_organization_id()
  and public.has_permission('audit.logs', 'view')
);

revoke insert, update, delete on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.has_permission(text, text) to authenticated;
grant execute on function public.bootstrap_organization(text, text, text) to authenticated;
grant execute on function public.record_auth_audit(text) to authenticated;
