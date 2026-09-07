"use client";

import { formatBRL } from "../../../usuarios/comerciais/utils";
import type { MembroComComissoes, ValidacaoItem } from "../hooks/use-equipe-comissoes";
import { FaltaCheckbox } from "./falta-checkbox";
import { SubordinadosTable, ConsultoresPfTable } from "./validacao-subtables";

interface ValidacaoItemCardProps {
  item: ValidacaoItem;
  membrosComComissoes: MembroComComissoes[];
  mesAtual: string;
  onToggleFalta: (membroId: string, mesReferencia: string, temFalta: boolean) => void;
}

export function ValidacaoItemCard({ item, membrosComComissoes, mesAtual, onToggleFalta }: ValidacaoItemCardProps) {
  const membroComComissao = membrosComComissoes.find(
    (m) => m.id === item.liderancaId || (item.tipo === "COMERCIAL" && m.nome === item.empresaSetor),
  );
  const comissaoMes = membroComComissao?.comissoes.find((c) => c.mesReferencia === mesAtual);
  const temFalta = comissaoMes?.temFalta ?? false;
  const itemInputId = `falta-${item.tipo.toLowerCase()}-${(item.liderancaId ?? item.empresaSetor).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const itemLabel = item.liderancaNome ?? item.empresaSetor;

  return (
    <div className="card overflow-hidden">
      {/* Cabeçalho da liderança/comercial */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        <div className="min-w-[180px]">
          <p className="font-semibold text-gray-900 leading-tight">{item.empresaSetor}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
            item.tipo === "LIDERANCA"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}>
            {item.tipo === "LIDERANCA" ? "Liderança" : "Comercial"}
          </span>
        </div>

        <div className="flex items-center gap-6 flex-1 flex-wrap">
          <div>
            <p className="text-xs text-gray-500">Meta</p>
            <p className="text-sm font-medium text-gray-800">{formatBRL(item.meta)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Produção</p>
            <p className="text-sm font-medium text-gray-800">{formatBRL(item.producao)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Meta Batida</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              item.metaBatida ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {item.metaBatida ? "✓ Sim" : "✗ Não"}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Comissão Líder</p>
            <p className="text-sm font-medium text-purple-700">
              {item.comissaoLideranca > 0 ? formatBRL(item.comissaoLideranca) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Projeção Comissão</p>
            <p className="text-sm font-semibold text-gray-900">{formatBRL(item.comissaoCalculada)}</p>
          </div>
        </div>

        <FaltaCheckbox
          inputId={itemInputId}
          ariaLabel={`Falta de ${itemLabel}`}
          checked={temFalta}
          withText
          onChange={(checked) => {
            const targetId = item.liderancaId || membroComComissao?.id;
            if (targetId) {
              onToggleFalta(targetId, mesAtual, checked);
            }
          }}
        />
      </div>

      {item.subordinados.length > 0 && (
        <SubordinadosTable
          subordinados={item.subordinados}
          membrosComComissoes={membrosComComissoes}
          mesAtual={mesAtual}
          onToggleFalta={onToggleFalta}
        />
      )}

      {item.consultoresPf.length > 0 && (
        <ConsultoresPfTable consultoresPf={item.consultoresPf} />
      )}
    </div>
  );
}
