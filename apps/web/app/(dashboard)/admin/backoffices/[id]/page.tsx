"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useAssinatura } from "./hooks/use-assinatura";
import { useFaturas } from "./hooks/use-faturas";
import { StatusCard } from "./components/status-card";
import { FaturasTable } from "./components/faturas-table";
import { ModalFatura } from "./components/modal-fatura";
import { ModalBloqueio } from "./components/modal-bloqueio";
import { ModalCortesia } from "./components/modal-cortesia";
import type { NovaFaturaInput } from "./types";

export default function DetalheBackofficePage() {
  const params = useParams<{ id: string }>();
  const {
    assinatura,
    loading,
    acaoEmAndamento: acaoAssinatura,
    fetchAssinatura,
    executarAcao,
    sincronizarAsaas,
  } = useAssinatura(params.id);

  const handleAssinaturaMudou = useCallback(() => fetchAssinatura(), [fetchAssinatura]);
  const {
    faturas,
    acaoEmAndamento: acaoFaturas,
    fetchFaturas,
    criarFatura,
    marcarPago,
  } = useFaturas(params.id, { onAssinaturaPodeMudar: handleAssinaturaMudou });

  const acaoEmAndamento = acaoAssinatura || acaoFaturas;

  const [modalBloqueio, setModalBloqueio] = useState(false);
  const [modalCortesia, setModalCortesia] = useState(false);
  const [modalFatura, setModalFatura] = useState(false);

  async function handleBloqueio(motivo: string) {
    if (await executarAcao("BLOQUEAR", { motivo })) setModalBloqueio(false);
  }

  async function handleCortesia(motivo: string, expiraEm: string | undefined) {
    if (await executarAcao("CONCEDER_CORTESIA", { motivo, expiraEm }))
      setModalCortesia(false);
  }

  async function handleCriarFatura(input: NovaFaturaInput) {
    if (await criarFatura(input)) setModalFatura(false);
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

  return (
    <div className="font-sans space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {assinatura.backoffice.nome}
        </h1>
        <p className="text-sm text-gray-500">CPF: {assinatura.backoffice.cpf}</p>
      </div>

      <StatusCard
        assinatura={assinatura}
        acaoEmAndamento={acaoEmAndamento}
        onBloquear={() => setModalBloqueio(true)}
        onLiberar={() => executarAcao("LIBERAR")}
        onConcederCortesia={() => setModalCortesia(true)}
        onEncerrarCortesia={() => executarAcao("ENCERRAR_CORTESIA")}
        onSincronizarAsaas={() => sincronizarAsaas(fetchFaturas)}
      />

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Faturas</h2>
          <button
            onClick={() => setModalFatura(true)}
            className="text-sm text-green-700 font-medium hover:underline"
          >
            + Registrar fatura / pagamento manual
          </button>
        </div>

        <FaturasTable
          faturas={faturas}
          acaoEmAndamento={acaoEmAndamento}
          onMarcarPago={marcarPago}
        />
      </div>

      {modalFatura && (
        <ModalFatura
          acaoEmAndamento={acaoEmAndamento}
          onClose={() => setModalFatura(false)}
          onSubmit={handleCriarFatura}
        />
      )}

      {modalBloqueio && (
        <ModalBloqueio
          acaoEmAndamento={acaoEmAndamento}
          onClose={() => setModalBloqueio(false)}
          onConfirm={handleBloqueio}
        />
      )}

      {modalCortesia && (
        <ModalCortesia
          acaoEmAndamento={acaoEmAndamento}
          onClose={() => setModalCortesia(false)}
          onConfirm={handleCortesia}
        />
      )}
    </div>
  );
}
