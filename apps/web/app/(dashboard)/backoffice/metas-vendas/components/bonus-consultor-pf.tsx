"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type CicloBonus = {
  id: string;
  nome: string;
  inicioAcumuloEm: string;
  fimAcumuloEm: string;
  inicioResgateEm: string | null;
  fimResgateEm: string;
  status: string;
};

type Configuracao = { valorPorPonto: number; tipoArredondamento: string } | null;

export function BonusConsultorPf() {
  const [ciclos, setCiclos] = useState<CicloBonus[]>([]);
  const [config, setConfig] = useState<Configuracao>(null);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [resetando, setResetando] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetConsultorPfId, setResetConsultorPfId] = useState("");
  const [form, setForm] = useState({ nome: "", inicioAcumuloEm: "", fimAcumuloEm: "", fimResgateEm: "" });

  async function carregar() {
    const [ciclosResponse, configResponse] = await Promise.all([
      fetch("/api/v1/backoffice/pontos/bonus/ciclos"),
      fetch("/api/v1/backoffice/pontos/configuracao"),
    ]);
    if (ciclosResponse.ok) setCiclos((await ciclosResponse.json()).ciclos ?? []);
    if (configResponse.ok) {
      const body = await configResponse.json();
      setConfig(body.configuracao ?? body.config ?? null);
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();
    setMensagem("");
    setSalvando(true);
    const response = await fetch(editingId ? `/api/v1/backoffice/pontos/bonus/ciclos/${editingId}` : "/api/v1/backoffice/pontos/bonus/ciclos", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        inicioAcumuloEm: new Date(`${form.inicioAcumuloEm}T00:00:00`).toISOString(),
        fimAcumuloEm: new Date(`${form.fimAcumuloEm}T00:00:00`).toISOString(),
        fimResgateEm: new Date(`${form.fimResgateEm}T00:00:00`).toISOString(),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMensagem(body.error ?? "Não foi possível salvar o ciclo"); setSalvando(false); return; }
    setForm({ nome: "", inicioAcumuloEm: "", fimAcumuloEm: "", fimResgateEm: "" });
    setEditingId(null);
    const sucesso = editingId ? "Ciclo de Bônus PF atualizado com sucesso." : "Ciclo de Bônus PF criado com sucesso.";
    setMensagem(sucesso);
    toast.success(sucesso);
    setSalvando(false);
    await carregar();
  }

  async function excluir(ciclo: CicloBonus) {
    if (!window.confirm(`Excluir o ciclo ${ciclo.nome}? O histórico impede exclusão quando já houver movimentações.`)) return;
    setDeletandoId(ciclo.id);
    const response = await fetch(`/api/v1/backoffice/pontos/bonus/ciclos/${ciclo.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    setMensagem(response.ok ? "Ciclo excluído." : body.error ?? "Não foi possível excluir o ciclo.");
    if (response.ok) toast.success("Ciclo de Bônus PF excluído com sucesso.");
    setDeletandoId(null);
    if (response.ok) await carregar();
  }

  async function resetar() {
    if (!resetConsultorPfId || !window.confirm("Zerar o saldo de Bônus deste Consultor PF? O lançamento ficará preservado no extrato.")) return;
    setResetando(true);
    const response = await fetch("/api/v1/backoffice/pontos/bonus/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consultorPfId: resetConsultorPfId }) });
    const body = await response.json().catch(() => ({}));
    const resultado = response.ok ? `${body.pontosResetados ?? 0} pontos resetados com sucesso.` : body.error ?? "Não foi possível resetar os pontos.";
    setMensagem(resultado);
    response.ok ? toast.success(resultado) : toast.error(resultado);
    setResetando(false);
  }

  function editar(ciclo: CicloBonus) {
    setEditingId(ciclo.id);
    setForm({ nome: ciclo.nome, inicioAcumuloEm: ciclo.inicioAcumuloEm.slice(0, 10), fimAcumuloEm: ciclo.fimAcumuloEm.slice(0, 10), fimResgateEm: ciclo.fimResgateEm.slice(0, 10) });
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-900">Bônus do Consultor PF</h2>
      <p className="mb-6 text-sm text-gray-600">
        Modalidade adicional à comissão, usando a mesma regra de pontos do Parceiro e carteira separada.
      </p>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Regra vigente compartilhada:</span>{" "}
          {config ? String(config.valorPorPonto) + " por ponto · arredondamento " + String(config.tipoArredondamento) : "carregando configuração de pontos..."}
        </div>

        {ciclos.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Nenhum ciclo de Bônus PF criado</div>
        ) : (
          <div className="space-y-4">
            {ciclos.map((ciclo) => (
              <div key={ciclo.id} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ciclo.nome}</h3>
                    <p className="text-sm text-gray-600">
                      Acúmulo: {new Date(ciclo.inicioAcumuloEm).toLocaleDateString("pt-BR")} a {new Date(ciclo.fimAcumuloEm).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Resgate: {new Date(ciclo.inicioResgateEm ?? ciclo.inicioAcumuloEm).toLocaleDateString("pt-BR")} a {new Date(ciclo.fimResgateEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={ciclo.status === "EM_ANDAMENTO" ? "rounded bg-green-100 px-3 py-1 text-xs font-semibold text-green-700" : ciclo.status === "RESGATE_ABERTO" ? "rounded bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700" : "rounded bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"}
>
                      {ciclo.status === "EM_ANDAMENTO" ? "EM_ANDAMENTO" : ciclo.status === "RESGATE_ABERTO" ? "RESGATE_ABERTO" : "ENCERRADO"}
                    </span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editar(ciclo)} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200">Editar</button>
                      <button type="button" onClick={() => void excluir(ciclo)} disabled={deletandoId === ciclo.id} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50">
                        {deletandoId === ciclo.id ? "..." : "Deletar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={criar} className="mt-6 rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{editingId ? "Editar ciclo de bonificação" : "Criar novo ciclo"}</h3>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ nome: "", inicioAcumuloEm: "", fimAcumuloEm: "", fimResgateEm: "" }); }} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs text-gray-600" htmlFor="bonus-nome">Nome</label><input id="bonus-nome" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Ex: Bônus 2026" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><label className="mb-1 block text-xs text-gray-600" htmlFor="bonus-inicio">Início</label><input id="bonus-inicio" required type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.inicioAcumuloEm} onChange={(e) => setForm({ ...form, inicioAcumuloEm: e.target.value })} /></div>
            <div><label className="mb-1 block text-xs text-gray-600" htmlFor="bonus-fim-acumulo">Fim do acúmulo</label><input id="bonus-fim-acumulo" required type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.fimAcumuloEm} onChange={(e) => setForm({ ...form, fimAcumuloEm: e.target.value })} /></div>
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 md:col-span-2">O resgate começa automaticamente no primeiro dia do ciclo e permanece disponível até o fim do resgate.</div>
            <div><label className="mb-1 block text-xs text-gray-600" htmlFor="bonus-fim-resgate">Fim do resgate</label><input id="bonus-fim-resgate" required type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.fimResgateEm} onChange={(e) => setForm({ ...form, fimResgateEm: e.target.value })} /></div>
          </div>
          <button type="submit" disabled={salvando} className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">{salvando ? "Salvando..." : editingId ? "Salvar alterações" : "Criar ciclo"}</button>
        </form>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">Reset administrativo</h3>
          <p className="mt-1 text-sm text-gray-600">Zera o saldo disponível sem apagar créditos, débitos ou auditoria.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="ID do Consultor PF" value={resetConsultorPfId} onChange={(e) => setResetConsultorPfId(e.target.value)} /><button type="button" disabled={resetando || !resetConsultorPfId} onClick={() => void resetar()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{resetando ? "Resetando..." : "Resetar pontos"}</button></div>
        </div>
      </div>
    </div>
  );
}
