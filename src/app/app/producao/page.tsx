"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ClipboardCheck, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProductionData } from "@/components/providers/production-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Input, Select } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/status";
import { formatCurrency, getOperationProgress } from "@/lib/production";
import { cn } from "@/lib/utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ProductionPage() {
  const data = useProductionData();
  const canViewSelector = data.hasAccess("production.selector");
  const canViewEntry = data.hasAccess("production.entry");
  const canEditEntry = data.hasAccess("production.entry", "edit");
  const canViewHistory = data.hasAccess("production.history");
  const canEditHistory = data.hasAccess("production.history", "edit");
  const [search, setSearch] = useState("");
  const [bookletId, setBookletId] = useState(data.booklets[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const filteredBooklets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = data.booklets.filter((booklet) => booklet.status !== "COMPLETED");
    if (!term) return all;
    return all.filter((booklet) => {
      const reference = data.references.find((item) => item.id === booklet.referenceId);
      return booklet.number.toLowerCase().includes(term) || reference?.code.toLowerCase().includes(term) || reference?.description.toLowerCase().includes(term);
    });
  }, [data.booklets, data.references, search]);

  useEffect(() => {
    if (!filteredBooklets.some((item) => item.id === bookletId)) {
      setBookletId(filteredBooklets[0]?.id ?? "");
      setSelected(new Set());
      setQuantities({});
    }
  }, [filteredBooklets, bookletId]);

  const booklet = data.booklets.find((item) => item.id === bookletId);
  const reference = data.references.find((item) => item.id === booklet?.referenceId);
  const history = useMemo(
    () => [...data.completions]
      .filter((item) => item.bookletId === bookletId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [data.completions, bookletId],
  );

  function toggle(operationId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(operationId);
      else next.delete(operationId);
      return next;
    });
    if (!checked) {
      setQuantities((current) => {
        const next = { ...current };
        delete next[operationId];
        return next;
      });
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!booklet || !data.currentUser) return;
    try {
      data.recordCompletions({
        bookletId: booklet.id,
        userId: data.currentUser.id,
        items: [...selected].map((operationId) => ({
          operationId,
          quantity: Number(quantities[operationId] ?? 0),
        })),
        notes: "",
      });
      setSelected(new Set());
      setQuantities({});
      toast.success("Conclusão registrada e histórico atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Conclusão de serviço" description="Selecione o talão, marque as operações realizadas e informe a quantidade concluída." />

      {canViewSelector ? (
        <Card className="overflow-hidden border-[#cfdbeb]">
          <div className="border-b border-[#e2e8f0] bg-[#f8fbff] px-5 py-4"><h2 className="text-sm font-semibold">Selecionar referência e talão</h2><p className="mt-0.5 text-xs text-[#667085]">Pesquise pelo número do talão ou código da referência.</p></div>
          <div className="grid gap-3 p-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-[#7890aa]" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: 102030 ou talão 3" /></div>
            <Select value={bookletId} onChange={(event) => { setBookletId(event.target.value); setSelected(new Set()); setQuantities({}); }}>
              {filteredBooklets.map((item) => {
                const itemReference = data.references.find((referenceItem) => referenceItem.id === item.referenceId);
                return <option key={item.id} value={item.id}>Talão {item.number} · Ref. {itemReference?.code} · {item.totalPairs} pares</option>;
              })}
              {!filteredBooklets.length ? <option value="">Nenhum talão encontrado</option> : null}
            </Select>
          </div>
        </Card>
      ) : null}

      {booklet && reference && canViewEntry ? (
        <form onSubmit={submit}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-sm font-semibold">Talão {booklet.number} · Referência <span className="text-[#0f55bf]">{reference.code}</span></h2><p className="mt-0.5 text-xs text-[#667085]">{booklet.totalPairs} pares · {reference.operations.length} operações · funcionário: {data.currentUser?.name}</p></div>
              <span className="rounded-[6px] border border-[#cfe0f7] bg-[#eaf2ff] px-2.5 py-1 text-xs font-medium text-[#0f55bf]">Selecione uma ou mais operações</span>
            </div>

            <div className="hidden grid-cols-[52px_52px_minmax(0,1fr)_100px_100px_100px_140px] bg-[#f7f9fc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] md:grid">
              <div className="px-3 py-3">Marcar</div><div className="px-2 py-3">Ordem</div><div className="px-3 py-3">Operação</div><div className="px-3 py-3 text-right">Valor/par</div><div className="px-3 py-3 text-right">Concluído</div><div className="px-3 py-3 text-right">Falta</div><div className="px-3 py-3">Quantidade agora</div>
            </div>

            {reference.operations.map((routeItem, index) => {
              const operation = data.operations.find((item) => item.id === routeItem.operationId);
              const progress = getOperationProgress(data, booklet.id, routeItem.operationId);
              const checked = selected.has(routeItem.operationId);
              const disabled = progress.remaining <= 0 || !canEditEntry;
              return (
                <div key={routeItem.operationId} className={cn("data-line grid gap-2 border-t border-[#edf0f4] px-4 py-3 md:grid-cols-[52px_52px_minmax(0,1fr)_100px_100px_100px_140px] md:items-center md:px-0 md:py-0", checked && "bg-[#eaf2ff]") }>
                  <div className="md:px-4 md:py-3">
                    <Checkbox checked={checked} onChange={(value) => toggle(routeItem.operationId, value)} disabled={disabled} label={`Selecionar ${operation?.name}`} />
                  </div>
                  <div className="text-xs text-[#667085] md:px-2 md:py-3">{String(index + 1).padStart(2, "0")}</div>
                  <div className="min-w-0 md:px-3 md:py-3"><p className="truncate text-sm font-semibold">{operation?.name}</p><div className="mt-1 flex items-center gap-2 md:hidden"><span className="text-xs text-[#667085]">{progress.completed}/{booklet.totalPairs}</span><ProgressBar percent={progress.percent} className="w-24" /></div></div>
                  <div className="text-sm tabular-nums text-[#475467] md:px-3 md:py-3 md:text-right">{formatCurrency(routeItem.pricePerPair)}</div>
                  <div className="hidden text-sm font-medium tabular-nums md:block md:px-3 md:py-3 md:text-right">{progress.completed}</div>
                  <div className={cn("hidden text-sm font-semibold tabular-nums md:block md:px-3 md:py-3 md:text-right", progress.remaining ? "text-[#c24d00]" : "text-[#287a52]")}>{progress.remaining}</div>
                  <div className="md:px-3 md:py-2">
                    <Input
                      className={cn("h-9", checked && "border-[#1769e0] bg-white")}
                      type="number"
                      min="1"
                      max={progress.remaining}
                      step="1"
                      value={quantities[routeItem.operationId] ?? ""}
                      disabled={!checked || disabled}
                      onChange={(event) => setQuantities({ ...quantities, [routeItem.operationId]: event.target.value })}
                      placeholder={checked ? `máx. ${progress.remaining}` : "Selecione"}
                      aria-label={`Quantidade de ${operation?.name}`}
                    />
                  </div>
                </div>
              );
            })}

            {canEditEntry ? (
              <div className="flex flex-col gap-3 border-t border-[#dbe2ea] bg-[#fbfdff] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#667085]">Cada operação selecionada gera um registro individual no histórico.</p>
                <Button type="submit" size="lg" disabled={!selected.size}><ClipboardCheck className="size-4" />Registrar {selected.size || ""} operação(ões)</Button>
              </div>
            ) : null}
          </Card>
        </form>
      ) : !booklet ? (
        <Card className="p-8 text-center text-sm text-[#667085]">Nenhum talão disponível para apontamento.</Card>
      ) : null}

      {canViewHistory ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4"><div><h2 className="text-sm font-semibold">Histórico do talão selecionado</h2><p className="mt-0.5 text-xs text-[#667085]">Mais de um funcionário pode participar da mesma operação.</p></div><span className="text-xs text-[#667085]">{history.length} lançamento(s)</span></div>
          <div className="hidden grid-cols-[170px_minmax(0,1fr)_110px_150px_48px] bg-[#f7f9fc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] sm:grid"><div className="px-4 py-3">Funcionário</div><div className="px-3 py-3">Operação</div><div className="px-3 py-3 text-right">Quantidade</div><div className="px-3 py-3">Data e hora</div><div /></div>
          {history.map((completion) => {
            const user = data.users.find((item) => item.id === completion.userId);
            const operation = data.operations.find((item) => item.id === completion.operationId);
            return (
              <div key={completion.id} className="data-line grid gap-2 border-b border-[#edf0f4] px-4 py-3 last:border-0 sm:grid-cols-[170px_minmax(0,1fr)_110px_150px_48px] sm:items-center sm:px-0 sm:py-0">
                <div className="sm:px-4 sm:py-3"><p className="text-sm font-medium">{user?.name}</p><p className="text-[11px] text-[#98a2b3]">@{user?.username}</p></div>
                <div className="sm:px-3 sm:py-3"><p className="text-sm font-semibold text-[#0f55bf]">{operation?.name}</p></div>
                <div className="text-sm font-semibold tabular-nums sm:px-3 sm:py-3 sm:text-right">{completion.quantity} pares</div>
                <div className="text-xs text-[#667085] sm:px-3 sm:py-3">{formatDateTime(completion.completedAt)}</div>
                <div className="sm:px-2 sm:py-3">{canEditHistory ? <button type="button" onClick={() => { if (!window.confirm("Remover este lançamento do histórico?")) return; data.deleteCompletion(completion.id); toast.success("Lançamento removido."); }} className="grid size-8 place-items-center rounded-[6px] text-[#b42318] hover:bg-[#fdf0ef]" title="Remover lançamento"><Trash2 className="size-3.5" /></button> : null}</div>
              </div>
            );
          })}
          {!history.length ? <div className="px-5 py-10 text-center text-sm text-[#667085]">Ainda não há lançamentos para este talão.</div> : null}
        </Card>
      ) : null}
    </div>
  );
}
