-- Reforço de segurança, integridade multiempresa e preservação de histórico.

begin;

-- Permite relacionamentos compostos com organization_id.
alter table public.profiles
  add constraint profiles_id_organization_unique
  unique (id, organization_id);

alter table public.operations
  add constraint operations_id_organization_unique
  unique (id, organization_id);

alter table public.product_references
  add constraint product_references_id_organization_unique
  unique (id, organization_id);

alter table public.booklets
  add constraint booklets_id_organization_unique
  unique (id, organization_id);

-- Referência e operação devem pertencer à mesma organização.
alter table public.reference_operations
  drop constraint if exists reference_operations_reference_id_fkey,
  drop constraint if exists reference_operations_operation_id_fkey;

alter table public.reference_operations
  add constraint reference_operations_reference_org_fk
    foreign key (reference_id, organization_id)
    references public.product_references (id, organization_id)
    on delete cascade,
  add constraint reference_operations_operation_org_fk
    foreign key (operation_id, organization_id)
    references public.operations (id, organization_id)
    on delete restrict;

-- Talão e referência devem pertencer à mesma organização.
alter table public.booklets
  drop constraint if exists booklets_reference_id_fkey;

alter table public.booklets
  add constraint booklets_reference_org_fk
    foreign key (reference_id, organization_id)
    references public.product_references (id, organization_id)
    on delete restrict;

-- Produção, talão, operação e usuários devem pertencer à mesma organização.
alter table public.completions
  drop constraint if exists completions_booklet_id_fkey,
  drop constraint if exists completions_operation_id_fkey,
  drop constraint if exists completions_employee_user_id_fkey,
  drop constraint if exists completions_recorded_by_user_id_fkey;

alter table public.completions
  add constraint completions_booklet_org_fk
    foreign key (booklet_id, organization_id)
    references public.booklets (id, organization_id)
    on delete restrict,
  add constraint completions_operation_org_fk
    foreign key (operation_id, organization_id)
    references public.operations (id, organization_id)
    on delete restrict,
  add constraint completions_employee_org_fk
    foreign key (employee_user_id, organization_id)
    references public.profiles (id, organization_id)
    on delete restrict,
  add constraint completions_recorded_by_org_fk
    foreign key (recorded_by_user_id, organization_id)
    references public.profiles (id, organization_id)
    on delete restrict;

-- Impede alteração indevida de organização, função e permissões.
create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  bootstrap_owner boolean := false;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    bootstrap_owner :=
      new.id = auth.uid()
      and new.role = 'ADMIN'
      and not exists (
        select 1 from public.profiles where id = auth.uid()
      );

    if bootstrap_owner then
      return new;
    end if;

    if new.organization_id is distinct from public.current_organization_id() then
      raise exception 'Não é permitido cadastrar usuário em outra organização.';
    end if;

    if (
      new.role <> 'USER'
      or new.permissions <> '{}'::jsonb
      or new.active is false
    ) and not public.has_permission('users.permissions', 'edit') then
      raise exception 'Sem permissão para definir função ou permissões.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.organization_id <> old.organization_id then
      raise exception 'Não é permitido alterar usuário ou organização.';
    end if;

    if old.id = auth.uid() and (
      new.role is distinct from old.role
      or new.active is distinct from old.active
      or new.permissions is distinct from old.permissions
    ) then
      raise exception 'Não é permitido alterar as próprias permissões.';
    end if;

    if (
      new.role is distinct from old.role
      or new.active is distinct from old.active
      or new.permissions is distinct from old.permissions
    ) and not public.has_permission('users.permissions', 'edit') then
      raise exception 'Sem permissão para alterar função ou permissões.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_security_fields
on public.profiles;

create trigger profiles_protect_security_fields
before insert or update on public.profiles
for each row execute function public.protect_profile_security_fields();

-- Bloqueia execução direta de funções internas.
revoke all on function public.set_updated_at()
  from public, anon, authenticated;
revoke all on function public.validate_completion()
  from public, anon, authenticated;
revoke all on function public.recalculate_booklet_status(uuid)
  from public, anon, authenticated;
revoke all on function public.refresh_booklet_after_completion()
  from public, anon, authenticated;
revoke all on function public.refresh_booklet_after_definition_change()
  from public, anon, authenticated;
revoke all on function public.refresh_booklets_after_route_change()
  from public, anon, authenticated;
revoke all on function public.audit_row_change()
  from public, anon, authenticated;
revoke all on function public.prevent_audit_log_mutation()
  from public, anon, authenticated;
revoke all on function public.protect_profile_security_fields()
  from public, anon, authenticated;

-- Impede que a organização fique sem administrador ativo.
create or replace function public.prevent_last_active_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  removing_admin boolean;
begin
  if tg_op = 'DELETE' then
    removing_admin := old.role = 'ADMIN' and old.active = true;
  else
    removing_admin :=
      old.role = 'ADMIN'
      and old.active = true
      and (
        new.role <> 'ADMIN'
        or new.active = false
        or new.organization_id <> old.organization_id
      );
  end if;

  if removing_admin and not exists (
    select 1
    from public.profiles
    where organization_id = old.organization_id
      and id <> old.id
      and role = 'ADMIN'
      and active = true
  ) then
    raise exception 'A organização deve manter pelo menos um administrador ativo.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_last_active_admin
on public.profiles;

create trigger profiles_prevent_last_active_admin
before update or delete on public.profiles
for each row execute function public.prevent_last_active_admin();

revoke all on function public.prevent_last_active_admin()
  from public, anon, authenticated;

-- Exige permissão de visualização nas consultas.
drop policy if exists profiles_select_same_org on public.profiles;
create policy profiles_select_same_org
on public.profiles for select
using (
  organization_id = public.current_organization_id()
  and (
    id = auth.uid()
    or public.has_permission('users.list', 'view')
  )
);

drop policy if exists operations_select on public.operations;
create policy operations_select
on public.operations for select
using (
  organization_id = public.current_organization_id()
  and public.has_permission('operations.list', 'view')
);

drop policy if exists references_select on public.product_references;
create policy references_select
on public.product_references for select
using (
  organization_id = public.current_organization_id()
  and public.has_permission('references.list', 'view')
);

drop policy if exists reference_operations_select on public.reference_operations;
create policy reference_operations_select
on public.reference_operations for select
using (
  organization_id = public.current_organization_id()
  and public.has_permission('references.route', 'view')
);

drop policy if exists booklets_select on public.booklets;
create policy booklets_select
on public.booklets for select
using (
  organization_id = public.current_organization_id()
  and public.has_permission('booklets.list', 'view')
);

drop policy if exists completions_select on public.completions;
create policy completions_select
on public.completions for select
using (
  organization_id = public.current_organization_id()
  and public.has_permission('production.history', 'view')
);

commit;
