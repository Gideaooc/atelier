"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  ClipboardList,
  Database,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ScrollText,
  UsersRound,
  X,
} from "lucide-react";
import { useProductionData } from "@/components/providers/production-data-provider";
import type { PermissionArea } from "@/lib/demo-data";
import { roleLabels } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  areas: PermissionArea[];
};

const navigation: NavigationItem[] = [
  {
    href: "/app",
    label: "Visão geral",
    description: "Status dos talões",
    icon: LayoutDashboard,
    areas: ["dashboard.summary", "dashboard.filters", "dashboard.bookletList", "dashboard.details"],
  },
  {
    href: "/app/taloes",
    label: "Talões",
    description: "Entrada da fábrica",
    icon: ClipboardList,
    areas: ["booklets.form", "booklets.list", "booklets.actions"],
  },
  {
    href: "/app/producao",
    label: "Conclusão de serviço",
    description: "Operações realizadas",
    icon: ClipboardCheck,
    areas: ["production.selector", "production.entry", "production.history"],
  },
  {
    href: "/app/cadastros",
    label: "Cadastros",
    description: "Operações e referências",
    icon: Database,
    areas: ["operations.batch", "operations.list", "references.batch", "references.list", "references.route"],
  },
  {
    href: "/app/usuarios",
    label: "Usuários",
    description: "Contas e permissões",
    icon: UsersRound,
    areas: ["users.list", "users.form", "users.permissions"],
  },
  {
    href: "/app/auditoria",
    label: "Auditoria",
    description: "Ações realizadas",
    icon: ScrollText,
    areas: ["audit.logs"],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, currentUser, logout, hasAccess } = useProductionData();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !currentUser) router.replace("/");
  }, [ready, currentUser, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const allowedNavigation = useMemo(
    () => navigation.filter((item) => item.areas.some((area) => hasAccess(area))),
    [hasAccess],
  );

  const currentRoute = navigation.find((item) =>
    item.href === "/app" ? pathname === item.href : pathname.startsWith(item.href),
  );
  const authorized = currentRoute ? currentRoute.areas.some((area) => hasAccess(area)) : true;

  if (!ready || !currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f7f5]">
        <div className="flex items-center gap-3 text-sm text-[#667085]">
          <span className="size-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#1769e0]" />
          Carregando ambiente...
        </div>
      </div>
    );
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  const navigationContent = (
    <>
      <div className="flex h-[70px] items-center gap-3 border-b border-[#dbe2ea] px-5">
        <div className="grid size-10 place-items-center rounded-[9px] bg-[#1769e0] text-white shadow-[0_4px_10px_rgba(23,105,224,0.22)]">
          <Factory className="size-[19px]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#152238]">
            Fluxo Terceirizado
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.1em] text-[#667085]">
            Controle de produção
          </p>
        </div>
      </div>

      <nav className="app-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
          Menu
        </p>
        <div className="space-y-1.5">
          {allowedNavigation.map((item) => {
            const active = item.href === "/app" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-[9px] border px-3 py-2 text-sm",
                  active
                    ? "border-[#b9d2f6] bg-[#eaf2ff] text-[#0f55bf] shadow-[inset_3px_0_0_#1769e0]"
                    : "border-transparent text-[#475467] hover:border-[#dbe7f7] hover:bg-[#f4f8ff] hover:text-[#152238]",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-medium leading-5">{item.label}</span>
                  <span className="block truncate text-[11px] leading-4 text-[#7a8798]">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[#dbe2ea] p-3">
        <div className="rounded-[9px] bg-[#f7f9fc] p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dceaff] text-[11px] font-semibold text-[#0f55bf]">
              {initials(currentUser.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#152238]">{currentUser.name}</p>
              <p className="truncate text-xs text-[#667085]">{roleLabels[currentUser.role]}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="grid size-8 place-items-center rounded-[7px] text-[#667085] hover:bg-[#eaf2ff] hover:text-[#0f55bf]"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f6f7f5] text-[#152238]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-[#dbe2ea] bg-white lg:flex">
        {navigationContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#152238]/35" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[286px] max-w-[88vw] flex-col bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 grid size-9 place-items-center rounded-[7px] text-[#667085] hover:bg-[#eef4fb]"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            {navigationContent}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-[236px]">
        <header className="sticky top-0 z-30 flex h-[70px] min-w-0 items-center justify-between border-b border-[#dbe2ea] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-[7px] text-[#475467] hover:bg-[#eef4fb] lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#152238]">{currentRoute?.label ?? "Fluxo Terceirizado"}</p>
              <p className="hidden truncate text-xs text-[#667085] sm:block">Talões, referências, operações e histórico por funcionário</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-[6px] border border-[#cdd9e8] bg-[#f7faff] px-2.5 py-1 text-xs text-[#52657b] md:inline-flex">
              Demonstração auditável
            </span>
            <button type="button" className="grid size-9 place-items-center rounded-[7px] text-[#667085] hover:bg-[#eef4fb] hover:text-[#0f55bf]" title="Configurações da demonstração" aria-label="Configurações">
              <Settings className="size-4" />
            </button>
          </div>
        </header>

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
          {authorized ? children : (
            <div className="rounded-[11px] border border-[#dbe2ea] bg-white p-8 text-center">
              <h1 className="text-lg font-semibold">Acesso não autorizado</h1>
              <p className="mt-2 text-sm text-[#667085]">Sua conta não possui permissão para visualizar esta área.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
