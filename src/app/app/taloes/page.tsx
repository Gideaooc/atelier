"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useProductionData } from "@/components/providers/production-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar, StatusBadge } from "@/components/ui/status";
import type { Booklet } from "@/lib/demo-data";
import { getBookletAverageProgress } from "@/lib/production";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function BookletRow({ booklet, canEdit }: { booklet: Booklet; canEdit: boolean }) {
  const data = useProductionData();
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState(booklet.number);
  const [referenceId, setReferenceId] = useState(booklet.referenceId);
  const [totalPairs, setTotalPairs] = useState(String(booklet.totalPairs));
  const [receivedAt, setReceivedAt] = useState(booklet.receivedAt);

  useEffect(() => {
    setNumber(booklet.number);
    setReferenceId(booklet.referenceId);
    setTotalPairs(String(booklet.totalPairs));
    setReceivedAt(booklet.receivedAt);
  }, [booklet]);

  const reference = data.references.find((item) => item.id === booklet.referenceId);
  const percent = getBookletAverageProgress(data, booklet);

  function cancel() {
    setNumber(booklet.number);
    setReferenceId(booklet.referenceId);
    setTotalPairs(String(booklet.totalPairs));
    setReceivedAt(booklet.receivedAt);
    setEditing(false);
  }

  function save() {
    try {
      data.updateBooklet(booklet.id, {
        number,
        referenceId,
        totalPairs: Number(totalPairs),
        receivedAt,
      });
      setEditing(false);
      toast.success("Talão atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  function remove() {
    if (!window.confirm(`Remover o talão ${booklet.number} e todo o histórico vinculado?`)) return;
    data.deleteBooklet(booklet.id);
    toast.success("Talão removido.");
  }

  if (editing) {
    return (
      <div className="grid gap-2 border-b border-[#edf0f2] p-3 last:border-0 lg:grid-cols-[110px_140px_minmax(0,1fr)_110px_128px] lg:items-center">
        <Input value={number} onChange={(event) => setNumber(event.target.value)} aria-label="Número do talão" />
        <Input type="number" min="1" step="1" value={totalPairs} onChange={(event) => setTotalPairs(event.target.value)} aria-label="Quantidade de pares" />
        <Select value={referenceId} onChange={(event) => setReferenceId(event.target.value)} aria-label="Referência">
          {data.references.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.description}</option>)}
        </Select>
        <Input type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} aria-label="Data de entrada" />
        <div className="flex justify-end gap-1">
          <button type="button" onClick={save} className="grid size-9 place-items-center rounded-[6px] bg-[#2457a7] text-white hover:bg-[#1d478a]" title="Salvar"><Save className="size-4" /></button>
          <button type="button" onClick={cancel} className="grid size-9 place-items-center rounded-[6px] text-[#667085] hover:bg-[#eef1f4]" title="Cancelar"><X className="size-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="data-line grid gap-2 border-b border-[#edf0f2] px-4 py-3 last:border-0 sm:grid-cols-[100px_100px_minmax(0,1fr)_170px_110px] sm:items-center">
      <div>
        <p className="text-sm font-semibold text-[#172033]">{booklet.number}</p>
        <p className="text-[11px] text-[#98a2b3]">{new Intl.DateTimeFormat("pt-BR").format(new Date(`${booklet.receivedAt}T12:00:00`))}</p>
      </div>
      <div><p className="text-sm font-medium">{reference?.code}</p><p className="text-[11px] text-[#667085]">{booklet.totalPairs} pares</p></div>
      <div className="min-w-0"><p className="truncate text-sm text-[#475467]">{reference?.description || "Sem descrição"}</p><p className="mt-0.5 text-[11px] text-[#98a2b3]">{reference?.operations.length ?? 0} operações</p></div>
      <div className="flex items-center gap-3"><ProgressBar percent={percent} className="flex-1" /><span className="w-9 text-right text-xs font-medium text-[#475467]">{percent}%</span></div>
      <div className="flex items-center justify-end gap-1">
        <StatusBadge status={booklet.status} />
        {canEdit ? <button type="button" onClick={() => setEditing(true)} className="grid size-8 place-items-center rounded-[5px] text-[#667085] hover:bg-[#eef1f4]" title="Editar talão"><Pencil className="size-3.5" /></button> : null}
        {canEdit ? <button type="button" onClick={remove} className="grid size-8 place-items-center rounded-[5px] text-[#b42318] hover:bg-[#fdf0ef]" title="Remover talão"><Trash2 className="size-3.5" /></button> : null}
      </div>
    </div>
  );
}

export default function BookletsPage() {
  const data = useProductionData();
  const canViewForm = data.hasAccess("booklets.form");
  const canEditForm = data.hasAccess("booklets.form", "edit");
  const canViewList = data.hasAccess("booklets.list");
  const canEditActions = data.hasAccess("booklets.actions", "edit");
  const [number, setNumber] = useState("");
  const [referenceId, setReferenceId] = useState(data.references[0]?.id ?? "");
  const [totalPairs, setTotalPairs] = useState("");
  const [receivedAt, setReceivedAt] = useState(today());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!data.references.some((item) => item.id === referenceId)) {
      setReferenceId(data.references[0]?.id ?? "");
    }
  }, [data.references, referenceId]);

  const filteredBooklets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data.booklets;
    return data.booklets.filter((booklet) => {
      const reference = data.references.find((item) => item.id === booklet.referenceId);
      return booklet.number.toLowerCase().includes(term) || reference?.code.toLowerCase().includes(term) || reference?.description.toLowerCase().includes(term);
    });
  }, [data.booklets, data.references, search]);

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      data.createBooklet({ number, referenceId, totalPairs: Number(totalPairs), receivedAt });
      setNumber("");
      setTotalPairs("");
      toast.success("Talão recebido da fábrica e cadastrado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talões recebidos"
        description="Cadastre o talão que chega da fábrica informando número, referência e quantidade total de pares."
      />

      {canViewForm ? (
        <Card className="overflow-hidden">
          <div className="border-b border-[#e6e9ec] px-5 py-4"><h2 className="text-sm font-semibold">Novo talão</h2><p className="mt-0.5 text-xs text-[#667085]">A referência define automaticamente a lista de operações.</p></div>
          <form onSubmit={submit} className="grid gap-4 p-5 md:grid-cols-[130px_150px_minmax(0,1fr)_150px_auto] md:items-end">
            <div><Label htmlFor="booklet-number">Talão</Label><Input id="booklet-number" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Ex.: 3" disabled={!canEditForm} /></div>
            <div><Label htmlFor="booklet-pairs">Quantidade</Label><Input id="booklet-pairs" type="number" min="1" step="1" value={totalPairs} onChange={(event) => setTotalPairs(event.target.value)} placeholder="Pares" disabled={!canEditForm} /></div>
            <div><Label htmlFor="booklet-reference">Referência</Label><Select id="booklet-reference" value={referenceId} onChange={(event) => setReferenceId(event.target.value)} disabled={!canEditForm}>{data.references.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.description}</option>)}</Select></div>
            <div><Label htmlFor="booklet-date">Recebido em</Label><Input id="booklet-date" type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} disabled={!canEditForm} /></div>
            <Button type="submit" disabled={!canEditForm}><Plus className="size-4" />Cadastrar</Button>
          </form>
        </Card>
      ) : null}

      {canViewList ? (
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e6e9ec] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-semibold">Talões cadastrados</h2><p className="mt-0.5 text-xs text-[#667085]">{filteredBooklets.length} de {data.booklets.length} talão(ões)</p></div>
          <Input className="sm:w-72" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar talão ou referência" />
        </div>
        <div className="hidden grid-cols-[100px_100px_minmax(0,1fr)_170px_110px] bg-[#f8fafb] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] sm:grid"><div className="px-4 py-3">Talão / data</div><div className="px-3 py-3">Referência</div><div className="px-3 py-3">Descrição</div><div className="px-3 py-3">Progresso</div><div className="px-3 py-3 text-right">Situação</div></div>
        {filteredBooklets.map((booklet) => <BookletRow key={booklet.id} booklet={booklet} canEdit={canEditActions} />)}
        {!filteredBooklets.length ? <div className="px-5 py-10 text-center text-sm text-[#667085]">Nenhum talão encontrado.</div> : null}
      </Card>
      ) : null}
    </div>
  );
}
