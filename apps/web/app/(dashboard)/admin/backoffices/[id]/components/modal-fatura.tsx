"use client";

import { useState } from "react";
import type { NovaFaturaInput } from "../types";

interface ModalFaturaProps {
  acaoEmAndamento: boolean;
  onClose: () => void;
  onSubmit: (input: NovaFaturaInput) => void;
}

export function ModalFatura({ acaoEmAndamento, onClose, onSubmit }: ModalFaturaProps) {
  const [novoValor, setNovoValor] = useState("");
  const [novoVencimento, setNovoVencimento] = useState("");
  const [novoJaPago, setNovoJaPago] = useState(false);
  const [novaFormaPagamento, setNovaFormaPagamento] = useState<"" | "BOLETO" | "PIX">("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Registrar fatura / pagamento manual</h2>
        <p className="text-xs text-gray-500 -mt-2">
          Use para registrar um pagamento feito fora do Asaas (dinheiro, transferência, PIX manual) —
          tanto a ativação inicial quanto uma mensalidade recorrente.
        </p>
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

        <label className="flex items-center gap-2 cursor-pointer border-t pt-3">
          <input
            type="checkbox"
            checked={novoJaPago}
            onChange={(e) => setNovoJaPago(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">
            Pagamento já recebido — dar baixa e liberar acesso agora
          </span>
        </label>

        {novoJaPago && (
          <div>
            <label className="block text-xs text-gray-500 mb-1" htmlFor="formaPagamento">
              Forma de pagamento (opcional)
            </label>
            <select
              id="formaPagamento"
              className="w-full border rounded px-3 py-2 text-sm"
              value={novaFormaPagamento}
              onChange={(e) => setNovaFormaPagamento(e.target.value as "" | "BOLETO" | "PIX")}
            >
              <option value="">Não especificar</option>
              <option value="PIX">PIX</option>
              <option value="BOLETO">Boleto / Dinheiro / Transferência</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onSubmit({
                valor: novoValor,
                vencimento: novoVencimento,
                jaPago: novoJaPago,
                formaPagamento: novaFormaPagamento,
              })
            }
            disabled={acaoEmAndamento}
            className={`px-4 py-2 rounded text-sm text-white disabled:opacity-50 ${
              novoJaPago ? "bg-green-600 hover:bg-green-700" : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {novoJaPago ? "Registrar pagamento e liberar" : "Criar fatura"}
          </button>
        </div>
      </div>
    </div>
  );
}
