"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface Fatura {
  id: string;
  valor: number;
  vencimento: string;
  statusPagamento: string;
  pagoManualmente: boolean;
  pagoEm: string | null;
}

interface Assinatura {
  id: string;
  statusAssinatura:
    | "ATIVA"
    | "INADIMPLENTE"
    | "BLOQUEADA_MANUAL"
    | "CORTESIA"
    | "CANCELADA";
  motivoBloqueio: string | null;
  bloqueadoEm: string | null;
  motivoCortesia: string | null;
  cortesiaDesde: string | null;
  cortesiaExpiraEm: string | null;
  backoffice: { nome: string; cpf: string };
}

const STATUS_LABEL: Record<string, string> = {
  ATIVA: "Ativa",
  INADIMPLENTE: "Inadimplente",
  BLOQUEADA_MANUAL: "Bloqueada manualmente",
  CORTESIA: "Cortesia",
  CANCELADA: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  ATIVA: "bg-green-100 text-green-800",
  INADIMPLENTE: "bg-red-100 text-red-800",
  BLOQUEADA_MANUAL: "bg-neutral-200 text-neutral-800",
  CORTESIA: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-neutral-200 text-neutral-600",
};

export default function DetalheBackofficePage() {
  const params = useParams<{ id: string }>();
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);

  // Modais simples controlados por estado (sem lib de dialog pesada)
  const [modalBloqueio, setModalBloqueio] = useState(false);
  const [modalCortesia, setModalCortesia] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [expiraEm, setExpiraEm] = useState("");

  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [modalFatura, setModalFatura] = useState(false);
  const [novoValor, setNovoValor] = useState("");
  const [novoVencimento, setNovoVencimento] = useState("");

  useEffect(() => {
    fetchAssinatura();
    fetchFaturas();
  }, [params.id]);

  async function fetchFaturas() {
    try {
      const res = await fetch(`/api/v1/admin/backoffices/${params.id}/faturas`);
      if (!res.ok) return;
      const json = await res.json();
      setFaturas(Array.isArray(json) ? json : []);
    } catch {
      // silencioso — não é crítico pra tela carregar
    }
  }

  async function criarFatura() {
    if (!novoValor || !novoVencimento) {
      toast.error("Informe valor e vencimento");
      return;
    }
    setAcaoEmAndamento(true);
    try {
      const res = await fetch(`/api/v1/admin/backoffices/${params.id}/faturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: Number(novoValor), vencimento: novoVencimento }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao criar fatura");
      toast.success("Fatura criada");
      setModalFatura(false);
      setNovoValor("");
      setNovoVencimento("");
      fetchFaturas();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "Erro inesperado") || "Erro ao criar fatura");
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  async function marcarPago(faturaId: string, pago: boolean) {
    setAcaoEmAndamento(true);
    try {
      const res = await fetch(
        `/api/v1/admin/backoffices/${params.id}/faturas/${faturaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pago }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao atualizar fatura");
      toast.success(pago ? "Fatura marcada como paga" : "Fatura marcada como não paga");
      fetchFaturas();
      fetchAssinatura();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "Erro inesperado") || "Erro ao atualizar fatura");
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function fetchAssinatura() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/backoffices/${params.id}/assinatura`);
      if (!res.ok) throw new Error("Assinatura não encontrada");
      const json = await res.json();
      setAssinatura(json);
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "Erro inesperado") || "Erro ao carregar assinatura");
    } finally {
      setLoading(false);
    }
  }

  async function executarAcao(acao: string, extra?: Record<string, unknown>) {
    setAcaoEmAndamento(true);
    try {
      const res = await fetch(
        `/api/v1/admin/backoffices/${params.id}/assinatura`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao, ...extra }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao executar ação");

      toast.success("Atualizado com sucesso");
      setModalBloqueio(false);
      setModalCortesia(false);
      setMotivo("");
      setExpiraEm("");
      fetchAssinatura();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "Erro inesperado") || "Erro ao executar ação");
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!assinatura) {
    return <p className="text-sm text-gray-500">Assinatura não encontrada.</p>;
  }

  const status = assinatura.statusAssinatura;

  return (
    <div className="font-sans space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {assinatura.backoffice.nome}
        </h1>
        <p className="text-sm text-gray-500">
          CPF: {assinatura.backoffice.cpf}
        </p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Status da assinatura
          </span>
          <span className={`px-3 py-1 rounded text-sm ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        {status === "BLOQUEADA_MANUAL" && (
          <div className="text-xs text-gray-500 border-l-2 border-neutral-300 pl-3">
            Bloqueado em {assinatura.bloqueadoEm && new Date(assinatura.bloqueadoEm).toLocaleString("pt-BR")}
            <br />
            Motivo: {assinatura.motivoBloqueio}
          </div>
        )}

        {status === "CORTESIA" && (
          <div className="text-xs text-gray-500 border-l-2 border-blue-300 pl-3">
            Cortesia desde {assinatura.cortesiaDesde && new Date(assinatura.cortesiaDesde).toLocaleString("pt-BR")}
            <br />
            Motivo: {assinatura.motivoCortesia}
            {assinatura.cortesiaExpiraEm && (
              <>
                <br />
                Expira em {new Date(assinatura.cortesiaExpiraEm).toLocaleDateString("pt-BR")}
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {status !== "BLOQUEADA_MANUAL" && (
            <button
              onClick={() => setModalBloqueio(true)}
              disabled={acaoEmAndamento}
              className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Bloquear acesso
            </button>
          )}

          {status === "BLOQUEADA_MANUAL" && (
            <button
              onClick={() => executarAcao("LIBERAR")}
              disabled={acaoEmAndamento}
              className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Liberar acesso
            </button>
          )}

          {status !== "CORTESIA" && status !== "BLOQUEADA_MANUAL" && (
            <button
              onClick={() => setModalCortesia(true)}
              disabled={acaoEmAndamento}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Conceder cortesia
            </button>
          )}

          {status === "CORTESIA" && (
            <button
              onClick={() => executarAcao("ENCERRAR_CORTESIA")}
              disabled={acaoEmAndamento}
              className="px-3 py-2 rounded text-sm font-medium text-gray-600 border hover:bg-gray-50 disabled:opacity-50"
            >
              Encerrar cortesia
            </button>
          )}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Faturas</h2>
          <button
            onClick={() => setModalFatura(true)}
            className="text-sm text-green-700 font-medium hover:underline"
          >
            + Nova fatura manual
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Valor</th>
                <th className="text-left p-2 font-medium text-gray-600">Vencimento</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Ação</th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((f) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-900">{formatarMoeda(Number(f.valor))}</td>
                  <td className="p-2 text-gray-600">
                    {new Date(f.vencimento).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        f.pagoManualmente
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {f.pagoManualmente ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="p-2">
                    {f.pagoManualmente ? (
                      <button
                        onClick={() => marcarPago(f.id, false)}
                        disabled={acaoEmAndamento}
                        className="text-xs text-gray-600 hover:underline disabled:opacity-50"
                      >
                        Marcar como não pago
                      </button>
                    ) : (
                      <button
                        onClick={() => marcarPago(f.id, true)}
                        disabled={acaoEmAndamento}
                        className="text-xs text-green-700 font-medium hover:underline disabled:opacity-50"
                      >
                        Marcar como pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {faturas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Nenhuma fatura cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalFatura && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Nova fatura manual</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1" htmlFor="novoValor">Valor (R$)</label>
              <input id="novoValor"
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2 text-sm"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1" htmlFor="novoVencimento">Vencimento</label>
              <input id="novoVencimento"
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={novoVencimento}
                onChange={(e) => setNovoVencimento(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalFatura(false)}
                className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={criarFatura}
                disabled={acaoEmAndamento}
                className="px-4 py-2 rounded text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Criar fatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bloqueio */}
      {modalBloqueio && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Bloquear acesso</h2>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Motivo do bloqueio (obrigatório)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalBloqueio(false)}
                className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => executarAcao("BLOQUEAR", { motivo })}
                disabled={!motivo.trim() || acaoEmAndamento}
                className="px-4 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cortesia */}
      {modalCortesia && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Conceder cortesia</h2>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div>
              <label className="block text-xs text-gray-500 mb-1" htmlFor="expiraEm">
                Expira em (opcional)
              </label>
              <input id="expiraEm"
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={expiraEm}
                onChange={(e) => setExpiraEm(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalCortesia(false)}
                className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  executarAcao("CONCEDER_CORTESIA", {
                    motivo,
                    expiraEm: expiraEm || undefined,
                  })
                }
                disabled={acaoEmAndamento}
                className="px-4 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar cortesia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
