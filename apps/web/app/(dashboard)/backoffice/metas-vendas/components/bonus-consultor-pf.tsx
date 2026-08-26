"use client";

import { FormEvent, useEffect, useState } from "react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetConsultorPfId, setResetConsultorPfId] = useState("");
  const [form, setForm] = useState({ nome: "", inicioAcumuloEm: "", fimAcumuloEm: "", inicioResgateEm: "", fimResgateEm: "" });

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
    const response = await fetch(editingId ? `/api/v1/backoffice/pontos/bonus/ciclos/${editingId}` : "/api/v1/backoffice/pontos/bonus/ciclos", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, inicioResgateEm: form.inicioResgateEm || null }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMensagem(body.error ?? "Não foi possível criar o ciclo"); return; }
    setForm({ nome: "", inicioAcumuloEm: "", fimAcumuloEm: "", inicioResgateEm: "", fimResgateEm: "" });
    setEditingId(null);
    setMensagem(editingId ? "Ciclo de Bônus PF atualizado com sucesso." : "Ciclo de Bônus PF criado com sucesso.");
    await carregar();
  }

  async function excluir(ciclo: CicloBonus) {
    if (!window.confirm(`Excluir o ciclo ${ciclo.nome}? O histórico impede exclusão quando já houver movimentações.`)) return;
    const response = await fetch(`/api/v1/backoffice/pontos/bonus/ciclos/${ciclo.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    setMensagem(response.ok ? "Ciclo excluído." : body.error ?? "Não foi possível excluir o ciclo.");
    if (response.ok) await carregar();
  }

  async function resetar() {
    if (!resetConsultorPfId || !window.confirm("Zerar o saldo de Bônus deste Consultor PF? O lançamento ficará preservado no extrato.")) return;
    const response = await fetch("/api/v1/backoffice/pontos/bonus/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consultorPfId: resetConsultorPfId }) });
    const body = await response.json().catch(() => ({}));
    setMensagem(response.ok ? `${body.pontosResetados ?? 0} pontos resetados com sucesso.` : body.error ?? "Não foi possível resetar os pontos.");
  }

  function editar(ciclo: CicloBonus) {
    setEditingId(ciclo.id);
    setForm({ nome: ciclo.nome, inicioAcumuloEm: ciclo.inicioAcumuloEm.slice(0, 16), fimAcumuloEm: ciclo.fimAcumuloEm.slice(0, 16), inicioResgateEm: ciclo.inicioResgateEm?.slice(0, 16) ?? "", fimResgateEm: ciclo.fimResgateEm.slice(0, 16) });
  }

  return (
    <section className="space-y-5 rounded-xl border border-violet-200 bg-violet-50/40 p-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Bônus do Consultor PF</h2>
        <p className="mt-1 text-sm text-gray-600">Modalidade adicional à comissão, usando a mesma regra de pontos do Parceiro e carteira separada.</p>
      </div>
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-700">
        <strong>Regra vigente compartilhada:</strong>{" "}
        {config ? `${config.valorPorPonto} por ponto · arredondamento ${config.tipoArredondamento}` : "carregando configuração de pontos..."}
      </div>
      <form onSubmit={criar} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
        <h3 className="md:col-span-2 font-medium text-gray-900">{editingId ? "Editar ciclo de bonificação" : "Novo ciclo de bonificação"}</h3>
        <input required className="rounded border p-2" placeholder="Nome do ciclo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <label className="text-sm">Início do acúmulo<input required type="datetime-local" className="mt-1 w-full rounded border p-2" value={form.inicioAcumuloEm} onChange={(e) => setForm({ ...form, inicioAcumuloEm: e.target.value })} /></label>
        <label className="text-sm">Fim do acúmulo<input required type="datetime-local" className="mt-1 w-full rounded border p-2" value={form.fimAcumuloEm} onChange={(e) => setForm({ ...form, fimAcumuloEm: e.target.value })} /></label>
        <label className="text-sm">Início do resgate<input type="datetime-local" className="mt-1 w-full rounded border p-2" value={form.inicioResgateEm} onChange={(e) => setForm({ ...form, inicioResgateEm: e.target.value })} /></label>
        <label className="text-sm">Fim do resgate<input required type="datetime-local" className="mt-1 w-full rounded border p-2" value={form.fimResgateEm} onChange={(e) => setForm({ ...form, fimResgateEm: e.target.value })} /></label>
        <div className="flex gap-2 md:col-span-2"><button className="rounded bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700" type="submit">{editingId ? "Salvar ciclo" : "Criar ciclo de Bônus"}</button>{editingId && <button type="button" className="rounded border px-4 py-2" onClick={() => { setEditingId(null); setForm({ nome: "", inicioAcumuloEm: "", fimAcumuloEm: "", inicioResgateEm: "", fimResgateEm: "" }); }}>Cancelar</button>}</div>
      </form>
      {mensagem && <p className="text-sm text-gray-700">{mensagem}</p>}
      <div className="rounded-lg border bg-white p-4"><h3 className="font-medium text-gray-900">Reset administrativo</h3><p className="mt-1 text-sm text-gray-600">Zera o saldo disponível sem apagar créditos, débitos ou auditoria.</p><div className="mt-3 flex gap-2"><input className="flex-1 rounded border p-2" placeholder="ID do Consultor PF" value={resetConsultorPfId} onChange={(e) => setResetConsultorPfId(e.target.value)} /><button className="rounded bg-red-600 px-4 py-2 font-medium text-white" onClick={() => void resetar()}>Resetar pontos</button></div></div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Ciclo</th><th className="p-3">Acúmulo</th><th className="p-3">Resgate</th><th className="p-3">Status</th><th className="p-3">Ações</th></tr></thead>
          <tbody>{ciclos.map((ciclo) => <tr key={ciclo.id} className="border-b last:border-0"><td className="p-3 font-medium">{ciclo.nome}</td><td className="p-3">{new Date(ciclo.inicioAcumuloEm).toLocaleDateString("pt-BR")} – {new Date(ciclo.fimAcumuloEm).toLocaleDateString("pt-BR")}</td><td className="p-3">{new Date(ciclo.fimResgateEm).toLocaleDateString("pt-BR")}</td><td className="p-3">{ciclo.status}</td><td className="flex gap-2 p-3"><button className="text-violet-700 hover:underline" onClick={() => editar(ciclo)}>Editar</button><button className="text-red-700 hover:underline" onClick={() => void excluir(ciclo)}>Deletar</button></td></tr>)}</tbody>
        </table>
        {ciclos.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum ciclo de Bônus PF cadastrado.</p>}
      </div>
    </section>
  );
}
