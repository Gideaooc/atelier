"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Filter, Search, Users } from "lucide-react";
import { useProductionData } from "@/components/providers/production-data-provider";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar, StatusBadge } from "@/components/ui/status";
import { formatCurrency, getBookletAverageProgress, getOperationProgress } from "@/lib/production";
import { cn } from "@/lib/utils";

type PeriodMode = "all" | "today" | "7days" | "30days" | "date";

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() - days);
  return localDateValue(date);
}

export default function DashboardPage() {
  const data = useProductionData();
  const canFilters = data.hasAccess("dashboard.filters");
  const canSummary = data.hasAccess("dashboard.summary");
  const canList = data.hasAccess("dashboard.bookletList");
  const canDetails = data.hasAccess("dashboard.details");
  const [referenceId, setReferenceId] = useState("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodMode>("all");
  const [specificDate, setSpecificDate] = useState(localDateValue());
  const [selectedBookletId, setSelectedBookletId] = useState(data.booklets[0]?.id ?? "");

  const filteredBooklets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const today = localDateValue();
    const startDate = period === "7days" ? subtractDays(today, 6) : period === "30days" ? subtractDays(today, 29) : "";

    return data.booklets.filter((booklet) => {
      const reference = data.references.find((item) => item.id === booklet.referenceId);
      if (referenceId !== "all" && booklet.referenceId !== referenceId) return false;
      if (period === "today" && booklet.receivedAt !== today) return false;
      if (period === "date" && booklet.receivedAt !== specificDate) return false;
      if ((period === "7days" || period === "30days") && (booklet.receivedAt < startDate || booklet.receivedAt > today)) return false;
      if (
        term &&
        !booklet.number.toLowerCase().includes(term) &&
        !reference?.code.toLowerCase().includes(term) &&
        !reference?.description.toLowerCase().includes(term)
      ) return false;
      return true;
    });
  }, [data.booklets, data.references, referenceId, search, period, specificDate]);

  useEffect(() => {
    if (!filteredBooklets.some((item) => item.id === selectedBookletId)) {
      setSelectedBookletId(filteredBooklets[0]?.id ?? "");
    }
  }, [filteredBooklets, selectedBookletId]);

  const selectedBooklet = data.booklets.find((item) => item.id === selectedBookletId);
  const selectedReference = data.references.find((item) => item.id === selectedBooklet?.referenceId);
  const totalPairs = filteredBooklets.reduce((sum, item) => sum + item.totalPairs, 0);
  const completionPairs = data.completions
    .filter((item) => filteredBooklets.some((booklet) => booklet.id === item.bookletId))
    .reduce((sum, item) => sum + item.quantity, 0);
  const operationCount = filteredBooklets.reduce((sum, booklet) => {
    const reference = data.references.find((item) => item.id === booklet.referenceId);
    return sum + (reference?.operations.length ?? 0);
  }, 0);
  const completedOperationCount = filteredBooklets.reduce((sum, booklet) => {
    const reference = data.references.find((item) => item.id === booklet.referenceId);
    return sum + (reference?.operations.filter(
      (route) => getOperationProgress(data, booklet.id, route.operationId).remaining === 0,
    ).length ?? 0);
  }, 0);

  const metrics = [
    { label: "Talões no filtro", value: filteredBooklets.length, helper: `${filteredBooklets.filter((item) => item.status !== "COMPLETED").length} em aberto` },
    { label: "Pares recebidos", value: totalPairs, helper: "Volume total dos talões" },
    { label: "Pares apontados", value: completionPairs, helper: "Soma entre as operações" },
    { label: "Operações concluídas", value: `${completedOperationCount}/${operationCount}`, helper: "No período selecionado" },
  ];

  const periodOptions: Array<{ key: PeriodMode; label: string }> = [
    { key: "all", label: "Tudo" },
    { key: "today", label: "Hoje" },
    { key: "7days", label: "7 dias" },
    { key: "30days", label: "30 dias" },
    { key: "date", label: "Uma data" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Visão geral" description="Acompanhe talões, saldos por operação e participação dos funcionários." />

      {canFilters ? (
        <Card className="overflow-hidden border-[#cfdbeb]">
          <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-[#f8fbff] px-5 py-3.5">
            <Filter className="size-4 text-[#1769e0]" />
            <h2 className="text-sm font-semibold">Filtros</h2>
          </div>
          <div className="grid gap-4 p-5 xl:grid-cols-[minmax(260px,1fr)_260px_minmax(390px,auto)] xl:items-end">
            <div>
              <Label>Busca</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-[#7890aa]" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Talão, referência ou descrição" />
              </div>
            </div>
            <div>
              <Label>Referência</Label>
              <Select value={referenceId} onChange={(event) => setReferenceId(event.target.value)}>
                <option value="all">Todas as referências</option>
                {data.references.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.description}</option>)}
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex flex-wrap rounded-[9px] border border-[#cbd8e8] bg-[#f7faff] p-1">
                  {periodOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setPeriod(option.key)}
                      className={cn(
                        "h-8 rounded-[7px] px-3 text-xs font-medium",
                        period === option.key
                          ? "bg-[#1769e0] text-white shadow-sm"
                          : "text-[#52657b] hover:bg-white hover:text-[#0f55bf]",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {period === "date" ? (
                  <div className="relative w-[160px]">
                    <CalendarDays className="pointer-events-none absolute left-3 top-3 size-4 text-[#7890aa]" />
                    <Input className="pl-9" type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} aria-label="Data específica" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {canSummary ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={metric.label} className="relative overflow-hidden p-4 sm:p-5">
              <span className={cn("absolute inset-x-0 top-0 h-1", index === 0 ? "bg-[#1769e0]" : index === 1 ? "bg-[#4b8ceb]" : index === 2 ? "bg-[#36a3b4]" : "bg-[#6a7fd3]")} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#667085]">{metric.label}</p>
              <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.035em] text-[#152238]">{metric.value}</p>
              <p className="mt-2 text-xs text-[#7a8798]">{metric.helper}</p>
            </Card>
          ))}
        </section>
      ) : null}

      <section className={cn("grid gap-5", canList && canDetails && "xl:grid-cols-[0.92fr_1.08fr]")}>
        {canList ? (
          <Card className="h-fit overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
              <div><h2 className="text-sm font-semibold">Talões e referências</h2><p className="mt-0.5 text-xs text-[#667085]">Selecione um talão para consultar o detalhamento.</p></div>
              <span className="text-xs text-[#667085]">{filteredBooklets.length} resultado(s)</span>
            </div>
            <div className="hidden grid-cols-[92px_105px_90px_minmax(0,1fr)_32px] bg-[#f7f9fc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] sm:grid">
              <div className="px-4 py-3">Talão</div><div className="px-3 py-3">Referência</div><div className="px-3 py-3">Pares</div><div className="px-3 py-3">Andamento</div><div />
            </div>
            <div className="app-scrollbar max-h-[590px] overflow-y-auto">
              {filteredBooklets.map((booklet) => {
                const reference = data.references.find((item) => item.id === booklet.referenceId);
                const percent = getBookletAverageProgress(data, booklet);
                const active = booklet.id === selectedBookletId;
                return (
                  <button
                    key={booklet.id}
                    type="button"
                    onClick={() => setSelectedBookletId(booklet.id)}
                    className={cn(
                      "data-line grid w-full gap-2 border-b border-[#edf0f4] px-4 py-3 text-left last:border-0 sm:grid-cols-[80px_105px_80px_minmax(0,1fr)_32px] sm:items-center sm:px-0 sm:py-0",
                      active && "bg-[#eaf2ff]",
                    )}
                  >
                    <div className="sm:px-4 sm:py-3"><p className="text-sm font-semibold">{booklet.number}</p><p className="text-[10px] text-[#98a2b3]">{booklet.receivedAt.split("-").reverse().join("/")}</p></div>
                    <div className="sm:px-3 sm:py-3"><p className="text-sm font-medium text-[#0f55bf]">{reference?.code}</p><p className="truncate text-[10px] text-[#98a2b3]">{reference?.description}</p></div>
                    <div className="text-sm tabular-nums sm:px-3 sm:py-3">{booklet.totalPairs}</div>
                    <div className="sm:px-3 sm:py-3"><div className="flex items-center gap-3"><ProgressBar percent={percent} className="flex-1" /><span className="w-9 text-right text-xs font-medium text-[#475467]">{percent}%</span></div><div className="mt-1.5"><StatusBadge status={booklet.status} /></div></div>
                    <div className="sm:px-2 sm:py-3"><ChevronRight className="size-4 text-[#7890aa]" /></div>
                  </button>
                );
              })}
              {!filteredBooklets.length ? <div className="px-5 py-10 text-center text-sm text-[#667085]">Nenhum talão encontrado.</div> : null}
            </div>
          </Card>
        ) : null}

        {canDetails ? (
          <Card className="overflow-hidden">
            {selectedBooklet && selectedReference ? (
              <>
                <div className="flex flex-col gap-2 border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><h2 className="text-sm font-semibold">Talão {selectedBooklet.number} · Referência <span className="text-[#0f55bf]">{selectedReference.code}</span></h2><p className="mt-0.5 text-xs text-[#667085]">{selectedBooklet.totalPairs} pares · {selectedReference.operations.length} operações</p></div>
                  <StatusBadge status={selectedBooklet.status} />
                </div>
                <div className="hidden grid-cols-[44px_minmax(0,1fr)_84px_84px_84px_minmax(140px,0.9fr)] bg-[#f7f9fc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] md:grid">
                  <div className="px-3 py-3">#</div><div className="px-3 py-3">Operação</div><div className="px-3 py-3 text-right">Valor/par</div><div className="px-3 py-3 text-right">Feito</div><div className="px-3 py-3 text-right">Falta</div><div className="px-3 py-3">Participantes</div>
                </div>
                <div className="app-scrollbar max-h-[590px] overflow-y-auto">
                  {selectedReference.operations.map((route, index) => {
                    const operation = data.operations.find((item) => item.id === route.operationId);
                    const progress = getOperationProgress(data, selectedBooklet.id, route.operationId);
                    return (
                      <div key={`${route.operationId}-${index}`} className="data-line grid gap-2 border-b border-[#edf0f4] px-4 py-3 last:border-0 md:grid-cols-[44px_minmax(0,1fr)_84px_84px_84px_minmax(140px,0.9fr)] md:items-center md:px-0 md:py-0">
                        <div className="text-xs text-[#7890aa] md:px-3 md:py-3">{String(index + 1).padStart(2, "0")}</div>
                        <div className="md:px-3 md:py-3"><p className="text-sm font-semibold">{operation?.name}</p><ProgressBar percent={progress.percent} className="mt-2 max-w-48" /></div>
                        <div className="text-sm tabular-nums text-[#475467] md:px-3 md:py-3 md:text-right">{formatCurrency(route.pricePerPair)}</div>
                        <div className="text-sm font-semibold tabular-nums md:px-3 md:py-3 md:text-right">{progress.completed}</div>
                        <div className={cn("text-sm font-semibold tabular-nums md:px-3 md:py-3 md:text-right", progress.remaining ? "text-[#c24d00]" : "text-[#287a52]")}>{progress.remaining}</div>
                        <div className="md:px-3 md:py-3">
                          {progress.participants.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {progress.participants.map((participant) => (
                                <span key={participant.user?.id} className="inline-flex items-center gap-1 rounded-[6px] border border-[#cfe0f7] bg-[#f4f8ff] px-2 py-1 text-[11px] text-[#344054]"><Users className="size-3 text-[#1769e0]" />{participant.user?.name}: <strong>{participant.quantity}</strong></span>
                              ))}
                            </div>
                          ) : <span className="text-xs text-[#98a2b3]">Sem apontamentos</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <div className="grid min-h-64 place-items-center p-8 text-sm text-[#667085]">Selecione um talão para visualizar os detalhes.</div>}
          </Card>
        ) : null}
      </section>
    </div>
  );
}
