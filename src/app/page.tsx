"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Factory } from "lucide-react";
import { toast } from "sonner";
import { useProductionData } from "@/components/providers/production-data-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-controls";

export default function LoginPage() {
  const router = useRouter();
  const { ready, currentUser, login } = useProductionData();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && currentUser) router.replace("/app");
  }, [ready, currentUser, router]);

  function useCredential(nextUsername: string) {
    setUsername(nextUsername);
    setPassword("123456");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      login(username, password);
      router.push("/app");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1080px] overflow-hidden rounded-[12px] border border-[#dbe2ea] bg-white shadow-[0_12px_32px_rgba(16,24,40,0.08)] sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-[#dbe2ea] bg-[#f7f9fc] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-[7px] bg-[#1769e0] text-white">
              <Factory className="size-[18px]" />
            </div>
            <div>
              <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#152238]">Fluxo Terceirizado</p>
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#667085]">Controle de produção</p>
            </div>
          </div>

          <div className="max-w-[520px]">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#1769e0]">Operação do dia a dia</p>
            <h1 className="mt-4 text-[38px] font-semibold leading-[1.12] tracking-[-0.04em] text-[#152238] xl:text-[44px]">
              Da entrada do talão ao histórico de cada operação concluída.
            </h1>
            <p className="mt-5 max-w-[470px] text-base leading-7 text-[#667085]">
              Organize referências, preços por par, usuários e apontamentos de produção em um fluxo simples para o trabalho terceirizado.
            </p>
          </div>

          <div className="grid grid-cols-3 border-t border-[#dbe2ea] pt-5 text-xs text-[#667085]">
            <div><p className="font-semibold text-[#152238]">Talões</p><p className="mt-1">Entrada da fábrica</p></div>
            <div><p className="font-semibold text-[#152238]">Operações</p><p className="mt-1">Ordem e valor por par</p></div>
            <div><p className="font-semibold text-[#152238]">Histórico</p><p className="mt-1">Quem fez e quanto</p></div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 xl:p-14">
          <div className="w-full max-w-[380px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid size-9 place-items-center rounded-[7px] bg-[#1769e0] text-white"><Factory className="size-[18px]" /></div>
              <div><p className="font-semibold">Fluxo Terceirizado</p><p className="text-xs text-[#667085]">Controle de produção</p></div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#1769e0]">Acesso ao sistema</p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-[#152238]">Entrar</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">Informe o usuário e a senha cadastrados pelo administrador.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div><Label htmlFor="username">Usuário</Label><Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></div>
              <div><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>Entrar <ArrowRight className="size-4" /></Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]"><span className="h-px flex-1 bg-[#e1e6ea]" />Contas de teste<span className="h-px flex-1 bg-[#e1e6ea]" /></div>

            <div className="space-y-2">
              <button type="button" onClick={() => useCredential("admin")} className="flex w-full items-center justify-between rounded-[7px] border border-[#dbe2ea] px-3.5 py-3 text-left hover:bg-[#f8fafb]"><span><span className="block text-sm font-medium">Administrador</span><span className="block text-xs text-[#667085]">usuário: admin</span></span><span className="text-xs text-[#98a2b3]">Selecionar</span></button>
              <button type="button" onClick={() => useCredential("ana")} className="flex w-full items-center justify-between rounded-[7px] border border-[#dbe2ea] px-3.5 py-3 text-left hover:bg-[#f8fafb]"><span><span className="block text-sm font-medium">Funcionária</span><span className="block text-xs text-[#667085]">usuário: ana</span></span><span className="text-xs text-[#98a2b3]">Selecionar</span></button>
            </div>
            <p className="mt-3 text-center text-xs text-[#667085]">Senha da demonstração: 123456</p>
          </div>
        </section>
      </div>
    </main>
  );
}
