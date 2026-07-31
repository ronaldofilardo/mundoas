"use client";

import { useEffect, useState } from "react";
import { BarraProgresso } from "./barra-progresso";
import { useSalvarMeta } from "../hooks/use-salvar-meta";
import type { ConsultorResumo, ModoVisualizacao } from "./types";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function LinhaConsultor({
  consultor,
  modo,
  mesSelecionado,
  setorId,
  ano,
  onMetaSaved,
}: {
  consultor: ConsultorResumo;
  modo: ModoVisualizacao;
  mesSelecionado: string | null;
  setorId: string;
  ano: number;
  onMetaSaved?: () => void;
}) {
  const atingido = consultor.atingimento >= 100;
  const corPercentual = atingido ? "text-emerald-600" : "text-orange-600";

  const realizadoExibido =
    modo === "mensal" && mesSelecionado
      ? consultor.realizadoPorMes[mesSelecionado] ?? 0
      : consultor.realizadoAnual;

  const metaMensalAtual = consultor.metaAnual / 12;
  const [metaInput, setMetaInput] = useState<string>(metaMensalAtual.toFixed(2));

  useEffect(() => {
    setMetaInput(metaMensalAtual.toFixed(2));
  }, [metaMensalAtual]);

  const { salvar, salvando } = useSalvarMeta({
    consultorId: consultor.consultorPfId,
    setorId,
    ano,
    onSaved: onMetaSaved,
  });

  async function handleBlur() {
    const num = Number(metaInput);
    if (!Number.isFinite(num) || num < 0) {
      setMetaInput(metaMensalAtual.toFixed(2));
      return;
    }
    if (Math.abs(num - metaMensalAtual) < 0.005) return;
    await salvar(num);
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-b-0">
      <div className="grid grid-cols-12 items-center gap-3">
        <div className="col-span-12 md:col-span-4">
          <p className="text-sm font-medium text-gray-900 truncate">
            {consultor.nome}
          </p>
          <p className="text-xs text-gray-500 font-mono">{consultor.cpf}</p>
        </div>

        <div className="col-span-4 md:col-span-2 text-right">
          <p className="text-xs text-gray-500 mb-0.5">Meta Mensal</p>
          <input
            type="number"
            step="0.01"
            min={0}
            value={metaInput}
            onChange={(e) => setMetaInput(e.target.value)}
            onBlur={handleBlur}
            disabled={salvando}
            className="w-32 px-2 py-1 text-sm text-right border border-gray-200 rounded font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
            aria-label={`Meta mensal de ${consultor.nome}`}
          />
        </div>

        <div className="col-span-4 md:col-span-2 text-right">
          <p className="text-xs text-gray-500 mb-0.5">
            {modo === "mensal" ? "Realizado do Mês" : "Realizado Anual"}
          </p>
          <p className="text-sm font-medium text-gray-700 font-mono">
            R$ {formatarMoeda(realizadoExibido)}
          </p>
        </div>

        <div className="col-span-4 md:col-span-3">
          <BarraProgresso atingimento={consultor.atingimento} />
        </div>

        <div className="col-span-12 md:col-span-1 flex md:justify-end items-center gap-1.5">
          <span className={`text-sm font-bold ${corPercentual} font-mono`}>
            {Math.round(consultor.atingimento)}%
          </span>
        </div>
      </div>

      {atingido && (
        <p className="mt-2 text-xs text-emerald-700">
          Bateu meta em {consultor.mesesBatidos}{" "}
          {consultor.mesesBatidos === 1 ? "mês" : "meses"}
        </p>
      )}
    </div>
  );
}
