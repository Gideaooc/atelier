"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Power, Save, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useProductionData } from "@/components/providers/production-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Input, Label, Select } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import {
  createAdminPermissions,
  createWorkerPermissions,
  permissionMenus,
  roleLabels,
  type PermissionArea,
  type PermissionMap,
  type UserAccount,
  type UserRole,
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";

function clonePermissions(value: PermissionMap): PermissionMap {
  return Object.fromEntries(
    Object.entries(value).map(([key, permission]) => [key, { ...permission }]),
  ) as PermissionMap;
}

function PermissionMatrix({
  permissions,
  onChange,
  disabled,
}: {
  permissions: PermissionMap;
  onChange: (permissions: PermissionMap) => void;
  disabled?: boolean;
}) {
  function toggle(area: PermissionArea, column: "view" | "edit", checked: boolean) {
    const next = clonePermissions(permissions);
    if (column === "view") {
      next[area] = { view: checked, edit: checked ? next[area].edit : false };
    } else {
      next[area] = { view: checked ? true : next[area].view, edit: checked };
    }
    onChange(next);
  }

  function toggleMenu(menuIndex: number, column: "view" | "edit", checked: boolean) {
    const next = clonePermissions(permissions);
    for (const region of permissionMenus[menuIndex].regions) {
      if (column === "view") {
        next[region.key] = { view: checked, edit: checked ? next[region.key].edit : false };
      } else {
        next[region.key] = { view: checked ? true : next[region.key].view, edit: checked };
      }
    }
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {permissionMenus.map((menu, menuIndex) => {
        const allView = menu.regions.every((region) => permissions[region.key].view);
        const allEdit = menu.regions.every((region) => permissions[region.key].edit);
        return (
          <section key={menu.key} className="overflow-hidden rounded-[10px] border border-[#d5dfec] bg-white">
            <div className="grid gap-3 border-b border-[#dbe5f2] bg-[#f3f7fd] px-4 py-3 md:grid-cols-[minmax(0,1fr)_110px_110px] md:items-center">
              <div>
                <h3 className="text-sm font-semibold text-[#0f55bf]">{menu.label}</h3>
                <p className="mt-0.5 text-xs text-[#667085]">{menu.description}</p>
              </div>
              <div className="flex items-center gap-2 md:justify-center">
                <Checkbox checked={allView} onChange={(checked) => toggleMenu(menuIndex, "view", checked)} disabled={disabled} label={`Visualizar todas as regiões de ${menu.label}`} />
                <span className="text-xs font-medium text-[#52657b]">Visualizar tudo</span>
              </div>
              <div className="flex items-center gap-2 md:justify-center">
                <Checkbox checked={allEdit} onChange={(checked) => toggleMenu(menuIndex, "edit", checked)} disabled={disabled} label={`Editar todas as regiões de ${menu.label}`} />
                <span className="text-xs font-medium text-[#52657b]">Editar tudo</span>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(0,1fr)_100px_100px] bg-[#fbfcfe] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] md:grid">
              <div className="px-4 py-2.5">Região da tela</div><div className="px-3 py-2.5 text-center">Visualizar</div><div className="px-3 py-2.5 text-center">Editar</div>
            </div>

            {menu.regions.map((region) => (
              <div key={region.key} className="grid gap-3 border-t border-[#edf1f5] px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,1fr)_100px_100px] md:items-center">
                <div><p className="text-sm font-medium text-[#152238]">{region.label}</p><p className="mt-0.5 text-[11px] text-[#667085]">{region.description}</p></div>
                <div className="flex items-center gap-2 md:justify-center"><Checkbox checked={permissions[region.key].view} onChange={(checked) => toggle(region.key, "view", checked)} disabled={disabled} label={`Visualizar ${region.label}`} /><span className="text-xs text-[#667085] md:hidden">Visualizar</span></div>
                <div className="flex items-center gap-2 md:justify-center"><Checkbox checked={permissions[region.key].edit} onChange={(checked) => toggle(region.key, "edit", checked)} disabled={disabled} label={`Editar ${region.label}`} /><span className="text-xs text-[#667085] md:hidden">Editar</span></div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function UserListItem({ user, selected, onSelect }: { user: UserAccount; selected: boolean; onSelect: () => void }) {
  const accessCount = permissionMenus.flatMap((menu) => menu.regions).filter((item) => user.permissions[item.key].view).length;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#edf0f4] px-4 py-3 text-left last:border-0",
        selected ? "bg-[#eaf2ff]" : "hover:bg-[#f8fbff]",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#152238]">{user.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[#667085]">@{user.username} · {roleLabels[user.role]}</span>
        <span className="mt-1 block text-[11px] text-[#98a2b3]">{accessCount} região(ões) liberada(s)</span>
      </span>
      <span className={cn("rounded-[6px] border px-2 py-0.5 text-xs font-medium", user.active ? "border-[#b9ddca] bg-[#edf7f1] text-[#287a52]" : "border-[#d0d5dd] bg-[#f8fafb] text-[#667085]")}>{user.active ? "Ativo" : "Inativo"}</span>
    </button>
  );
}

export default function UsersPage() {
  const data = useProductionData();
  const canViewList = data.hasAccess("users.list");
  const canEditList = data.hasAccess("users.list", "edit");
  const canViewForm = data.hasAccess("users.form");
  const canEditForm = data.hasAccess("users.form", "edit");
  const canViewPermissions = data.hasAccess("users.permissions");
  const canEditPermissions = data.hasAccess("users.permissions", "edit");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState<UserRole>("USER");
  const [permissions, setPermissions] = useState<PermissionMap>(createWorkerPermissions());

  const editingUser = data.users.find((item) => item.id === editingId) ?? null;

  useEffect(() => {
    if (!editingUser) return;
    setName(editingUser.name);
    setUsername(editingUser.username);
    setPassword(editingUser.password);
    setRole(editingUser.role);
    setPermissions(clonePermissions(editingUser.permissions));
  }, [editingUser]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setUsername("");
    setPassword("123456");
    setRole("USER");
    setPermissions(createWorkerPermissions());
  }

  function changeRole(nextRole: UserRole) {
    setRole(nextRole);
    setPermissions(nextRole === "ADMIN" ? createAdminPermissions() : createWorkerPermissions());
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const input = { name, username, password, role, permissions };
      if (editingId) {
        data.updateUser(editingId, input);
        toast.success("Usuário atualizado.");
      } else {
        data.createUser(input);
        toast.success("Usuário criado.");
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  function toggleStatus(user: UserAccount) {
    try {
      data.toggleUserStatus(user.id);
      toast.success(user.active ? "Usuário desativado." : "Usuário ativado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar.");
    }
  }

  function remove(user: UserAccount) {
    if (!window.confirm(`Remover o usuário ${user.name}?`)) return;
    try {
      data.deleteUser(user.id);
      if (editingId === user.id) resetForm();
      toast.success("Usuário removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários e permissões" description="Defina os acessos por menu e, dentro de cada menu, por região da tela." />

      <section className={cn("grid gap-5", canViewList && (canViewForm || canViewPermissions) && "xl:grid-cols-[340px_minmax(0,1fr)]")}>
        {canViewList ? (
          <Card className="h-fit overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4"><div><h2 className="text-sm font-semibold">Contas cadastradas</h2><p className="mt-0.5 text-xs text-[#667085]">Selecione uma conta para editar.</p></div><span className="text-xs text-[#667085]">{data.users.length}</span></div>
            <div className="app-scrollbar max-h-[620px] overflow-y-auto">{data.users.map((user) => <UserListItem key={user.id} user={user} selected={editingId === user.id} onSelect={() => setEditingId(user.id)} />)}</div>
            {canEditForm ? <div className="border-t border-[#e2e8f0] p-3"><Button variant="secondary" size="sm" className="w-full" onClick={resetForm}><UserPlus className="size-3.5" />Nova conta</Button></div> : null}
          </Card>
        ) : null}

        {(canViewForm || canViewPermissions) ? (
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4">
              <div><h2 className="text-sm font-semibold">{editingUser ? `Editar ${editingUser.name}` : "Nova conta"}</h2><p className="mt-0.5 text-xs text-[#667085]">Ao permitir edição, a visualização da região é ativada automaticamente.</p></div>
              {editingUser && canEditList ? <div className="flex gap-1"><button type="button" onClick={() => toggleStatus(editingUser)} className="grid size-9 place-items-center rounded-[7px] text-[#667085] hover:bg-[#eaf2ff] hover:text-[#0f55bf]" title={editingUser.active ? "Desativar" : "Ativar"}><Power className="size-4" /></button><button type="button" onClick={() => remove(editingUser)} className="grid size-9 place-items-center rounded-[7px] text-[#b42318] hover:bg-[#fdf0ef]" title="Remover"><Trash2 className="size-4" /></button></div> : null}
            </div>

            <form onSubmit={submit} className="space-y-5 p-5">
              {canViewForm ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label htmlFor="user-name">Nome completo</Label><Input id="user-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do funcionário" disabled={!canEditForm} /></div>
                  <div><Label htmlFor="user-username">Usuário</Label><Input id="user-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ex.: ana.souza" disabled={!canEditForm} /></div>
                  <div><Label htmlFor="user-password">Senha</Label><Input id="user-password" type="text" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!canEditForm} /></div>
                  <div><Label htmlFor="user-role">Perfil inicial</Label><Select id="user-role" value={role} onChange={(event) => changeRole(event.target.value as UserRole)} disabled={!canEditForm}><option value="USER">Usuário</option><option value="ADMIN">Administrador</option></Select></div>
                </div>
              ) : null}

              {canViewPermissions ? <div><Label>Permissões por menu e região</Label><PermissionMatrix permissions={permissions} onChange={setPermissions} disabled={!canEditPermissions} /></div> : null}

              {canEditForm || canEditPermissions ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {editingUser ? <Button type="button" variant="secondary" onClick={resetForm}><X className="size-4" />Cancelar</Button> : null}
                  <Button type="submit">{editingUser ? <Save className="size-4" /> : <UserPlus className="size-4" />}{editingUser ? "Salvar alterações" : "Criar conta"}</Button>
                </div>
              ) : null}
            </form>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
