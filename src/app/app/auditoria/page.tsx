"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useProductionData } from "@/components/providers/production-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import {
  auditActionLabels,
  auditModuleLabels,
  type AuditAction,
  type AuditLog,
  type AuditModule,
  type AuditPayload,
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type SortOrder = "newest" | "oldest";

const actionStyles: Record<AuditAction, string> = {
  LOGIN: "border-[#b9d2f6] bg-[#eaf2ff] text-[#0f55bf]",
  LOGOUT: "border-[#d9dee7] bg-[#f7f9fc] text-[#52657b]",
  CREATE: "border-[#b7dfca] bg-[#edf8f2] text-[#287a52]",
  UPDATE: "border-[#c8d5f0] bg-[#f0f4ff] text-[#4059a5]",
  DELETE: "border-[#efc1bd] bg-[#fff2f0] text-[#b42318]",
  STATUS_CHANGE: "border-[#ead5a4] bg-[#fff8e7] text-[#8a5b00]",
  REORDER: "border-[#d9c6eb] bg-[#f7f0fc] text-[#74409a]",
  COMPLETE: "border-[#afe0e3] bg-[#eaf8f8] text-[#26737b]",
  RESET: "border-[#efc1bd] bg-[#fff2f0] text-[#b42318]",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatPayload(payload: AuditPayload) {
  if (!payload) return "Sem dados";
  return JSON.stringify(payload, null, 2);
}

function searchablePayload(payload: AuditPayload) {
  return payload ? JSON.stringify(payload).toLowerCase() : "";
}

function AuditDetails({ log }: { log: AuditLog }) {
  return (
    <div className="grid gap-4 border-t border-[#e6eaf0] bg-[#fbfcfe] p-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
          Antes
        </p>
        <pre className="app-scrollbar max-h-72 overflow-auto rounded-[8px] border border-[#dbe2ea] bg-white p-3 text-xs leading-5 text-[#344054]">
          {formatPayload(log.before)}
        </pre>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
          Depois
        </p>
        <pre className="app-scrollbar max-h-72 overflow-auto rounded-[8px] border border-[#dbe2ea] bg-white p-3 text-xs leading-5 text-[#344054]">
          {formatPayload(log.after)}
        </pre>
      </div>
      <div className="lg:col-span-2">
        <p className="text-xs text-[#667085]">
          Registro: <span className="font-medium text-[#344054]">{log.entityType}</span>
          {log.entityId ? <span className="font-mono"> · {log.entityId}</span> : null}
        </p>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const data = useProductionData();
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("all");
  const [module, setModule] = useState<AuditModule | "all">("all");
  const [action, setAction] = useState<AuditAction | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actorOptions = useMemo(() => {
    const actors = new Map<string, string>();
    for (const log of data.auditLogs) {
      if (log.actorUserId) actors.set(log.actorUserId, log.actorName);
    }
    return [...actors.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [data.auditLogs]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const start = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const end = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return data.auditLogs
      .filter((log) => {
        const timestamp = new Date(log.createdAt).getTime();
        if (userId === "system" && log.actorUserId !== null) return false;
        if (userId !== "all" && userId !== "system" && log.actorUserId !== userId) return false;
        if (module !== "all" && log.module !== module) return false;
        if (action !== "all" && log.action !== action) return false;
        if (start !== null && timestamp < start) return false;
        if (end !== null && timestamp > end) return false;
        if (!term) return true;

        return [
          log.actorName,
          log.description,
          log.entityLabel,
          log.entityType,
          log.entityId ?? "",
          auditModuleLabels[log.module],
          auditActionLabels[log.action],
          searchablePayload(log.before),
          searchablePayload(log.after),
        ].some((value) => value.toLowerCase().includes(term));
      })
      .sort((left, right) => {
        const difference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return sortOrder === "newest" ? difference : -difference;
      });
  }, [action, data.auditLogs, dateFrom, dateTo, module, search, sortOrder, userId]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstResult = filteredLogs.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(page * PAGE_SIZE, filteredLogs.length);

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [action, dateFrom, dateTo, module, search, sortOrder, userId]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function clearFilters() {
    setSearch("");
    setUserId("all");
    setModule("all");
    setAction("all");
    setDateFrom("");
    setDateTo("");
    setSortOrder("newest");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Consulte quem acessou, cadastrou, editou, excluiu ou marcou pares concluídos no sistema. Os detalhes mostram os valores anteriores e posteriores."
        action={
          <div className="inline-flex items-center gap-2 rounded-[8px] border border-[#b9d2f6] bg-[#eaf2ff] px-3 py-2 text-xs font-medium text-[#0f55bf]">
            <ShieldCheck className="size-4" />
            Somente leitura
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-5 py-4">
          <Search className="size-4 text-[#1769e0]" />
          <div>
            <h2 className="text-sm font-semibold">Filtros de busca</h2>
            <p className="mt-0.5 text-xs text-[#667085]">
              Pesquise por usuário, talão, referência, operação, descrição ou valor alterado.
            </p>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-2">
            <Label htmlFor="audit-search">Busca geral</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-[#7890aa]" />
              <Input
                id="audit-search"
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: talão 3, Costura, Ana, preço..."
              />
            </div>
          </div>
          <div>
            <Label htmlFor="audit-user">Usuário</Label>
            <Select id="audit-user" value={userId} onChange={(event) => setUserId(event.target.value)}>
              <option value="all">Todos os usuários</option>
              <option value="system">Sistema / automático</option>
              {actorOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="audit-module">Módulo</Label>
            <Select
              id="audit-module"
              value={module}
              onChange={(event) => setModule(event.target.value as AuditModule | "all")}
            >
              <option value="all">Todos os módulos</option>
              {Object.entries(auditModuleLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="audit-action">Ação</Label>
            <Select
              id="audit-action"
              value={action}
              onChange={(event) => setAction(event.target.value as AuditAction | "all")}
            >
              <option value="all">Todas as ações</option>
              {Object.entries(auditActionLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="audit-from">Data inicial</Label>
            <Input id="audit-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="audit-to">Data final</Label>
            <Input id="audit-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="audit-sort">Ordenação</Label>
            <Select id="audit-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
              <option value="newest">Mais recentes primeiro</option>
              <option value="oldest">Mais antigos primeiro</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={clearFilters}>
              <RotateCcw className="size-4" />
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e2e8f0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Logs do sistema</h2>
            <p className="mt-0.5 text-xs text-[#667085]">
              Exibindo {firstResult}–{lastResult} de {filteredLogs.length} registro(s)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <Clock3 className="size-4" />
            Página {page} de {totalPages}
          </div>
        </div>

        <div className="hidden grid-cols-[150px_160px_120px_minmax(250px,1fr)_40px] bg-[#f7f9fc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] lg:grid">
          <div className="px-4 py-3">Data e hora</div>
          <div className="px-3 py-3">Usuário</div>
          <div className="px-3 py-3">Ação / módulo</div>
          <div className="px-3 py-3">Descrição</div>
          <div />
        </div>

        <div>
          {paginatedLogs.map((log) => {
            const expanded = expandedId === log.id;
            return (
              <div key={log.id} className="border-b border-[#edf0f4] last:border-0">
                <button
                  type="button"
                  className={cn(
                    "data-line grid w-full gap-3 px-4 py-4 text-left lg:grid-cols-[150px_160px_120px_minmax(250px,1fr)_40px] lg:items-center lg:px-0 lg:py-0",
                    expanded && "bg-[#f8fbff]",
                  )}
                  onClick={() => setExpandedId(expanded ? null : log.id)}
                  aria-expanded={expanded}
                >
                  <div className="lg:px-4 lg:py-3">
                    <p className="text-sm font-medium text-[#344054]">{formatDateTime(log.createdAt)}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#98a2b3]">{log.id.slice(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-2 lg:px-3 lg:py-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-[#0f55bf]">
                      <UserRound className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{log.actorName}</p>
                      <p className="truncate text-[11px] text-[#98a2b3]">{log.actorUserId ?? "automático"}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 lg:px-3 lg:py-3">
                    <span className={cn("inline-flex rounded-[6px] border px-2 py-1 text-[10px] font-semibold", actionStyles[log.action])}>
                      {auditActionLabels[log.action]}
                    </span>
                    <p className="text-[11px] text-[#667085]">{auditModuleLabels[log.module]}</p>
                  </div>
                  <div className="lg:px-3 lg:py-3">
                    <p className="text-sm leading-5 text-[#344054]">{log.description}</p>
                    <p className="mt-1 truncate text-[11px] text-[#7890aa]">{log.entityLabel}</p>
                  </div>
                  <div className="hidden lg:grid lg:place-items-center">
                    {expanded ? <ChevronUp className="size-4 text-[#667085]" /> : <ChevronDown className="size-4 text-[#667085]" />}
                  </div>
                </button>
                {expanded ? <AuditDetails log={log} /> : null}
              </div>
            );
          })}

          {!paginatedLogs.length ? (
            <div className="px-5 py-12 text-center">
              <ShieldCheck className="mx-auto size-8 text-[#98a2b3]" />
              <p className="mt-3 text-sm font-medium text-[#344054]">Nenhum log encontrado</p>
              <p className="mt-1 text-xs text-[#667085]">Ajuste ou limpe os filtros para ampliar a busca.</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e2e8f0] bg-[#fbfcfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#667085]">
            Os registros desta demonstração ficam no navegador. Na versão PostgreSQL, serão imutáveis e gravados no servidor.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Próxima
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
