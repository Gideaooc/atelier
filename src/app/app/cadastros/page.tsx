"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useProductionData } from "@/components/providers/production-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import type { ProductReference } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/production";
import { cn } from "@/lib/utils";

type TabKey = "operations" | "references";
type ReferenceDraft = { id: string; code: string; description: string };

function parseOperationLines(value: string) {
  return value
    .split(/[\n;]+/)
    .map((item) => item.replace(/^\s*\d+[.)-]?\s*/, "").trim())
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
}

function parseReferenceLines(value: string): ReferenceDraft[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [code = "", ...descriptionParts] = line.split(/[|\t]/);
      return {
        id: `${index}-${code.trim()}-${descriptionParts.join(" ").trim()}`,
        code: code.trim(),
        description: descriptionParts.join(" ").trim(),
      };
    });
}

function OperationRow({ id, index, name, canEdit }: { id: string; index: number; name: string; canEdit: boolean }) {
  const data = useProductionData();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    setDraftName(name);
    setEditing(false);
  }, [name]);

  function cancel() {
    setDraftName(name);
    setEditing(false);
  }

  function save() {
    try {
      data.updateOperation(id, draftName);
      setEditing(false);
      toast.success("Operação atualizada em todas as referências.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível editar.");
    }
  }

  function remove() {
    if (!window.confirm(`Remover a operação “${name}”?`)) return;
    try {
      data.deleteOperation(id);
      toast.success("Operação removida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
    }
  }

  return (
    <div className="data-line grid grid-cols-[58px_minmax(0,1fr)_112px] items-center border-b border-[#edf0f4] last:border-0">
      <div className="px-4 py-3 text-xs tabular-nums text-[#667085]">{String(index + 1).padStart(2, "0")}</div>
      <div className="px-2 py-2.5">
        {editing ? (
          <Input autoFocus value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(); if (event.key === "Escape") cancel(); }} aria-label={`Editar ${name}`} />
        ) : (
          <p className="px-2 text-sm font-medium text-[#152238]">{name}</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-1 px-3 py-2">
        {editing ? (
          <>
            <button type="button" onClick={save} className="grid size-8 place-items-center rounded-[6px] bg-[#1769e0] text-white hover:bg-[#0f55bf]" title="Confirmar"><Check className="size-4" /></button>
            <button type="button" onClick={cancel} className="grid size-8 place-items-center rounded-[6px] text-[#667085] hover:bg-[#eef4fb]" title="Cancelar"><X className="size-4" /></button>
          </>
        ) : (
          <>
            {canEdit ? <button type="button" onClick={() => setEditing(true)} className="grid size-8 place-items-center rounded-[6px] text-[#1769e0] hover:bg-[#eaf2ff]" title="Editar operação"><Pencil className="size-3.5" /></button> : null}
            {canEdit ? <button type="button" onClick={remove} className="grid size-8 place-items-center rounded-[6px] text-[#b42318] hover:bg-[#fdf0ef]" title="Remover operação"><Trash2 className="size-3.5" /></button> : null}
          </>
        )}
      </div>
    </div>
  );
}

function ReferenceMetaEditor({ reference, canEdit }: { reference: ProductReference; canEdit: boolean }) {
  const data = useProductionData();
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(reference.code);
  const [description, setDescription] = useState(reference.description);

  useEffect(() => {
    setCode(reference.code);
    setDescription(reference.description);
    setEditing(false);
  }, [reference]);

  function cancel() {
    setCode(reference.code);
    setDescription(reference.description);
    setEditing(false);
  }

  function save() {
    try {
      data.updateReferenceMeta(reference.id, code, description);
      setEditing(false);
      toast.success("Dados da referência atualizados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  return (
    <div className="border-b border-[#e2e8f0] bg-[#fbfdff] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#667085]">Referência selecionada</p>
          {!editing ? <h2 className="mt-1 text-xl font-semibold text-[#0f55bf]">{reference.code}</h2> : null}
        </div>
        {canEdit ? (
          editing ? (
            <div className="flex gap-1"><button type="button" onClick={save} className="grid size-9 place-items-center rounded-[7px] bg-[#1769e0] text-white hover:bg-[#0f55bf]" title="Confirmar"><Check className="size-4" /></button><button type="button" onClick={cancel} className="grid size-9 place-items-center rounded-[7px] text-[#667085] hover:bg-[#eef4fb]" title="Cancelar"><X className="size-4" /></button></div>
          ) : <button type="button" onClick={() => setEditing(true)} className="grid size-9 place-items-center rounded-[7px] text-[#1769e0] hover:bg-[#eaf2ff]" title="Editar código e descrição"><Pencil className="size-4" /></button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div><Label>Código</Label><Input value={code} onChange={(event) => setCode(event.target.value)} /></div>
          <div><Label>Descrição</Label><Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Modelo, linha ou identificação" /></div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-[#667085]">{reference.description || "Sem descrição"}</p>
      )}
    </div>
  );
}

function RouteRow({ reference, index, canEdit }: { reference: ProductReference; index: number; canEdit: boolean }) {
  const data = useProductionData();
  const route = reference.operations[index];
  const operation = data.operations.find((item) => item.id === route.operationId);
  const [editing, setEditing] = useState(false);
  const [operationId, setOperationId] = useState(route.operationId);
  const [price, setPrice] = useState(String(route.pricePerPair).replace(".", ","));

  useEffect(() => {
    setEditing(false);
    setOperationId(route.operationId);
    setPrice(String(route.pricePerPair).replace(".", ","));
  }, [route.operationId, route.pricePerPair]);

  function cancel() {
    setEditing(false);
    setOperationId(route.operationId);
    setPrice(String(route.pricePerPair).replace(".", ","));
  }

  function save() {
    try {
      data.updateReferenceOperation(reference.id, index, operationId, Number(price.replace(",", ".")));
      setEditing(false);
      toast.success("Operação do roteiro atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  function remove() {
    if (!window.confirm(`Remover ${operation?.name ?? "esta operação"} do roteiro?`)) return;
    try {
      data.deleteReferenceOperation(reference.id, index);
      toast.success("Operação removida do roteiro.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
    }
  }

  return (
    <div className="grid gap-2 border-t border-[#edf0f4] px-3 py-2.5 md:grid-cols-[50px_minmax(0,1fr)_130px_150px] md:items-center md:px-0 md:py-0">
      <div className="text-xs text-[#667085] md:px-3 md:py-3">{String(index + 1).padStart(2, "0")}</div>
      <div className="md:px-3 md:py-2">
        {editing ? (
          <Select value={operationId} onChange={(event) => setOperationId(event.target.value)}>
            {data.operations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        ) : <p className="text-sm font-semibold text-[#152238]">{operation?.name}</p>}
      </div>
      <div className="md:px-3 md:py-2">
        {editing ? <Input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} aria-label="Valor por par" /> : <p className="text-sm tabular-nums text-[#475467] md:text-right">{formatCurrency(route.pricePerPair)}</p>}
      </div>
      <div className="flex items-center justify-end gap-1 md:px-3 md:py-2">
        {editing ? (
          <><button type="button" onClick={save} className="grid size-8 place-items-center rounded-[6px] bg-[#1769e0] text-white hover:bg-[#0f55bf]" title="Confirmar"><Check className="size-4" /></button><button type="button" onClick={cancel} className="grid size-8 place-items-center rounded-[6px] text-[#667085] hover:bg-[#eef4fb]" title="Cancelar"><X className="size-4" /></button></>
        ) : canEdit ? (
          <>
            <button type="button" onClick={() => data.moveReferenceOperation(reference.id, index, -1)} disabled={index === 0} className="grid size-8 place-items-center rounded-[6px] text-[#667085] hover:bg-[#eef4fb] disabled:opacity-25" title="Mover para cima"><ArrowUp className="size-3.5" /></button>
            <button type="button" onClick={() => data.moveReferenceOperation(reference.id, index, 1)} disabled={index === reference.operations.length - 1} className="grid size-8 place-items-center rounded-[6px] text-[#667085] hover:bg-[#eef4fb] disabled:opacity-25" title="Mover para baixo"><ArrowDown className="size-3.5" /></button>
            <button type="button" onClick={() => setEditing(true)} className="grid size-8 place-items-center rounded-[6px] text-[#1769e0] hover:bg-[#eaf2ff]" title="Editar operação e valor"><Pencil className="size-3.5" /></button>
            <button type="button" onClick={remove} className="grid size-8 place-items-center rounded-[6px] text-[#b42318] hover:bg-[#fdf0ef]" title="Remover do roteiro"><Trash2 className="size-3.5" /></button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ReferenceRouteEditor({ reference, canEdit, canViewRoute }: { reference: ProductReference; canEdit: boolean; canViewRoute: boolean }) {
  const data = useProductionData();
  const available = data.operations.filter((operation) => !reference.operations.some((route) => route.operationId === operation.id));
  const [operationId, setOperationId] = useState(available[0]?.id ?? "");
  const [position, setPosition] = useState(String(reference.operations.length + 1));
  const [price, setPrice] = useState("0,00");

  useEffect(() => {
    setOperationId((current) => available.some((item) => item.id === current) ? current : available[0]?.id ?? "");
    setPosition(String(reference.operations.length + 1));
  }, [reference.id, reference.operations.length, data.operations.length]);

  function add() {
    try {
      data.insertReferenceOperation(reference.id, operationId, Number(position), Number(price.replace(",", ".")));
      setPrice("0,00");
      toast.success("Operação adicionada ao roteiro.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar.");
    }
  }

  if (!canViewRoute) return null;

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-[#e2e8f0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-sm font-semibold">Roteiro de operações</h3><p className="mt-0.5 text-xs text-[#667085]">A ordem e o valor são específicos desta referência.</p></div>
        <span className="text-xs text-[#667085]">{reference.operations.length} operação(ões)</span>
      </div>

      {canEdit ? (
        <div className="grid gap-3 border-b border-[#e2e8f0] bg-[#f8fbff] p-4 md:grid-cols-[minmax(0,1fr)_90px_120px_auto] md:items-end">
          <div><Label>Operação</Label><Select value={operationId} onChange={(event) => setOperationId(event.target.value)} disabled={!available.length}>{available.length ? available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">Todas adicionadas</option>}</Select></div>
          <div><Label>Posição</Label><Input type="number" min="1" max={reference.operations.length + 1} value={position} onChange={(event) => setPosition(event.target.value)} /></div>
          <div><Label>Valor/par</Label><Input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></div>
          <Button onClick={add} disabled={!operationId}><Plus className="size-4" />Adicionar</Button>
        </div>
      ) : null}

      <div className="hidden grid-cols-[50px_minmax(0,1fr)_130px_150px] bg-[#f7f9fc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085] md:grid">
        <div className="px-3 py-3">Ordem</div><div className="px-3 py-3">Operação</div><div className="px-3 py-3 text-right">Valor/par</div><div className="px-3 py-3 text-right">Ações</div>
      </div>
      {reference.operations.map((_, index) => <RouteRow key={`${reference.id}-${index}-${reference.operations[index].operationId}`} reference={reference} index={index} canEdit={canEdit} />)}
      {!reference.operations.length ? <div className="px-5 py-10 text-center text-sm text-[#667085]">Clique em “Adicionar” para montar o roteiro desta referência.</div> : null}
    </div>
  );
}

export default function RegistrationsPage() {
  const data = useProductionData();
  const canViewOperationBatch = data.hasAccess("operations.batch");
  const canEditOperationBatch = data.hasAccess("operations.batch", "edit");
  const canViewOperationList = data.hasAccess("operations.list");
  const canEditOperationList = data.hasAccess("operations.list", "edit");
  const canViewReferenceBatch = data.hasAccess("references.batch");
  const canEditReferenceBatch = data.hasAccess("references.batch", "edit");
  const canViewReferenceList = data.hasAccess("references.list");
  const canEditReferenceList = data.hasAccess("references.list", "edit");
  const canViewReferenceRoute = data.hasAccess("references.route");
  const canEditReferenceRoute = data.hasAccess("references.route", "edit");
  const canViewOperations = canViewOperationBatch || canViewOperationList;
  const canViewReferences = canViewReferenceBatch || canViewReferenceList || canViewReferenceRoute;

  const [tab, setTab] = useState<TabKey>(canViewOperations ? "operations" : "references");
  const [operationText, setOperationText] = useState("");
  const [operationPreview, setOperationPreview] = useState<string[]>([]);
  const [referenceText, setReferenceText] = useState("");
  const [referencePreview, setReferencePreview] = useState<ReferenceDraft[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState(data.references[0]?.id ?? "");

  useEffect(() => {
    setOperationPreview(parseOperationLines(operationText));
  }, [operationText]);

  useEffect(() => {
    setReferencePreview(parseReferenceLines(referenceText));
  }, [referenceText]);

  useEffect(() => {
    if (!data.references.some((item) => item.id === selectedReferenceId)) setSelectedReferenceId(data.references[0]?.id ?? "");
  }, [data.references, selectedReferenceId]);

  const selectedReference = data.references.find((item) => item.id === selectedReferenceId);

  function saveOperations() {
    try {
      data.createOperations(operationPreview);
      setOperationText("");
      toast.success(`${operationPreview.length} operação(ões) cadastrada(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    }
  }

  function saveReferences() {
    try {
      const items = referencePreview.map(({ code, description }) => ({ code, description }));
      data.createReferencesBatch(items, []);
      setReferenceText("");
      toast.success(`${items.length} referência(s) cadastrada(s). Selecione uma referência para montar o roteiro.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    }
  }

  function removeReference(reference: ProductReference) {
    if (!window.confirm(`Remover a referência ${reference.code}?`)) return;
    try {
      data.deleteReference(reference.id);
      toast.success("Referência removida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cadastros de produção" description="Cadastre em lote, revise a prévia e edite os registros apenas quando necessário." />

      <div className="flex gap-1 border-b border-[#dbe2ea]">
        {canViewOperations ? <button type="button" onClick={() => setTab("operations")} className={cn("border-b-2 px-3 py-2.5 text-sm font-medium", tab === "operations" ? "border-[#1769e0] text-[#0f55bf]" : "border-transparent text-[#667085] hover:text-[#152238]")}>Operações</button> : null}
        {canViewReferences ? <button type="button" onClick={() => setTab("references")} className={cn("border-b-2 px-3 py-2.5 text-sm font-medium", tab === "references" ? "border-[#1769e0] text-[#0f55bf]" : "border-transparent text-[#667085] hover:text-[#152238]")}>Referências</button> : null}
      </div>

      {tab === "operations" && canViewOperations ? (
        <div className="space-y-5">
          {canViewOperationBatch ? (
            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="overflow-hidden">
                <div className="border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4"><h2 className="text-sm font-semibold">Cadastro em lote</h2><p className="mt-0.5 text-xs text-[#667085]">Digite uma operação por linha. A prévia é atualizada automaticamente.</p></div>
                <div className="p-5"><Label htmlFor="operation-batch">Operações</Label><Textarea id="operation-batch" className="min-h-44" placeholder={"Costura\nPassar cola\nPreparação\nRevisão"} value={operationText} onChange={(event) => setOperationText(event.target.value)} disabled={!canEditOperationBatch} /></div>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4"><div><h2 className="text-sm font-semibold">Prévia do cadastro</h2><p className="mt-0.5 text-xs text-[#667085]">Revise e ajuste os nomes antes de confirmar.</p></div><span className="text-xs text-[#667085]">{operationPreview.length} item(ns)</span></div>
                <div className="app-scrollbar max-h-[310px] overflow-y-auto">
                  {operationPreview.map((name, index) => (
                    <div key={`${index}-${name}`} className="grid grid-cols-[48px_minmax(0,1fr)_44px] items-center border-b border-[#edf0f4] last:border-0">
                      <div className="px-4 py-2.5 text-xs text-[#667085]">{index + 1}</div>
                      <div className="px-2 py-2"><Input value={name} onChange={(event) => setOperationPreview(operationPreview.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} disabled={!canEditOperationBatch} /></div>
                      <div className="px-1 py-2">{canEditOperationBatch ? <button type="button" onClick={() => setOperationPreview(operationPreview.filter((_, itemIndex) => itemIndex !== index))} className="grid size-8 place-items-center rounded-[6px] text-[#b42318] hover:bg-[#fdf0ef]"><X className="size-4" /></button> : null}</div>
                    </div>
                  ))}
                  {!operationPreview.length ? <div className="px-5 py-12 text-center text-sm text-[#667085]">Comece a digitar para visualizar a prévia.</div> : null}
                </div>
                {canEditOperationBatch ? <div className="border-t border-[#e2e8f0] p-4"><Button onClick={saveOperations} disabled={!operationPreview.length} className="w-full"><Check className="size-4" />Cadastrar operações</Button></div> : null}
              </Card>
            </section>
          ) : null}

          {canViewOperationList ? (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4"><div><h2 className="text-sm font-semibold">Operações cadastradas</h2><p className="mt-0.5 text-xs text-[#667085]">Use o lápis para editar. O nome é atualizado em todas as referências.</p></div><span className="text-xs text-[#667085]">{data.operations.length} item(ns)</span></div>
              <div className="grid grid-cols-[58px_minmax(0,1fr)_112px] bg-[#f7f9fc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#667085]"><div className="px-4 py-3">#</div><div className="px-3 py-3">Nome da operação</div><div className="px-3 py-3 text-right">Ações</div></div>
              {data.operations.map((operation, index) => <OperationRow key={operation.id} id={operation.id} index={index} name={operation.name} canEdit={canEditOperationList} />)}
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "references" && canViewReferences ? (
        <div className="space-y-5">
          {canViewReferenceBatch ? (
            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="overflow-hidden">
                <div className="border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4"><h2 className="text-sm font-semibold">Cadastro em lote</h2><p className="mt-0.5 text-xs text-[#667085]">Digite “código | descrição”. A prévia aparece automaticamente.</p></div>
                <div className="p-5"><Label htmlFor="reference-batch">Referências</Label><Textarea id="reference-batch" className="min-h-44" placeholder={"102030 | Tênis infantil\n204050 | Sandália infantil"} value={referenceText} onChange={(event) => setReferenceText(event.target.value)} disabled={!canEditReferenceBatch} /></div>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4"><div><h2 className="text-sm font-semibold">Prévia do cadastro</h2><p className="mt-0.5 text-xs text-[#667085]">Revise código e descrição antes de salvar.</p></div><span className="text-xs text-[#667085]">{referencePreview.length} item(ns)</span></div>
                <div className="app-scrollbar max-h-[310px] overflow-y-auto">
                  {referencePreview.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-[52px_130px_minmax(0,1fr)_44px] items-center border-b border-[#edf0f4] last:border-0">
                      <div className="px-3 py-2.5 text-xs text-[#667085]">{index + 1}</div>
                      <div className="px-1.5 py-2"><Input value={item.code} onChange={(event) => setReferencePreview(referencePreview.map((draft) => draft.id === item.id ? { ...draft, code: event.target.value } : draft))} disabled={!canEditReferenceBatch} /></div>
                      <div className="px-1.5 py-2"><Input value={item.description} onChange={(event) => setReferencePreview(referencePreview.map((draft) => draft.id === item.id ? { ...draft, description: event.target.value } : draft))} disabled={!canEditReferenceBatch} /></div>
                      <div className="px-1 py-2">{canEditReferenceBatch ? <button type="button" onClick={() => setReferencePreview(referencePreview.filter((draft) => draft.id !== item.id))} className="grid size-8 place-items-center rounded-[6px] text-[#b42318] hover:bg-[#fdf0ef]"><X className="size-4" /></button> : null}</div>
                    </div>
                  ))}
                  {!referencePreview.length ? <div className="px-5 py-12 text-center text-sm text-[#667085]">Comece a digitar para visualizar a prévia.</div> : null}
                </div>
                {canEditReferenceBatch ? <div className="border-t border-[#e2e8f0] p-4"><Button onClick={saveReferences} disabled={!referencePreview.length} className="w-full"><Check className="size-4" />Cadastrar referências</Button></div> : null}
              </Card>
            </section>
          ) : null}

          {(canViewReferenceList || canViewReferenceRoute) ? (
            <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
              {canViewReferenceList ? (
                <Card className="h-fit overflow-hidden">
                  <div className="border-b border-[#e2e8f0] bg-[#fbfdff] px-5 py-4"><h2 className="text-sm font-semibold">Referências cadastradas</h2><p className="mt-0.5 text-xs text-[#667085]">Clique no código para editar os dados e o roteiro.</p></div>
                  <div className="app-scrollbar max-h-[650px] overflow-y-auto">
                    {data.references.map((reference) => (
                      <div key={reference.id} className={cn("grid grid-cols-[minmax(0,1fr)_72px] items-center border-b border-[#edf0f4] last:border-0", selectedReferenceId === reference.id ? "bg-[#eaf2ff]" : "hover:bg-[#f8fbff]") }>
                        <button type="button" onClick={() => setSelectedReferenceId(reference.id)} className="min-w-0 px-4 py-3 text-left">
                          <span className="block text-sm font-semibold text-[#0f55bf] underline-offset-2 hover:underline">{reference.code}</span>
                          <span className="mt-0.5 block truncate text-xs text-[#667085]">{reference.description || "Sem descrição"}</span>
                          <span className="mt-1 block text-[11px] text-[#98a2b3]">{reference.operations.length} operações · {formatCurrency(reference.operations.reduce((sum, item) => sum + item.pricePerPair, 0))}/par</span>
                        </button>
                        <div className="flex items-center justify-end gap-1 pr-3">
                          <button type="button" onClick={() => setSelectedReferenceId(reference.id)} className="grid size-8 place-items-center rounded-[6px] text-[#1769e0] hover:bg-white" title="Abrir referência"><ChevronRight className="size-4" /></button>
                          {canEditReferenceList ? <button type="button" onClick={() => removeReference(reference)} className="grid size-8 place-items-center rounded-[6px] text-[#b42318] hover:bg-[#fdf0ef]" title="Remover referência"><Trash2 className="size-3.5" /></button> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {selectedReference ? (
                <Card className="overflow-hidden">
                  {canViewReferenceList ? <ReferenceMetaEditor reference={selectedReference} canEdit={canEditReferenceList} /> : null}
                  <ReferenceRouteEditor reference={selectedReference} canEdit={canEditReferenceRoute} canViewRoute={canViewReferenceRoute} />
                </Card>
              ) : <Card className="grid min-h-64 place-items-center p-8 text-sm text-[#667085]">Cadastre ou selecione uma referência.</Card>}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
