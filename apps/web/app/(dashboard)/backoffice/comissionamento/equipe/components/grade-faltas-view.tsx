"use client";

import type { EquipeItem } from "../types";
import type { MembroComComissoes } from "../hooks/use-equipe-comissoes";
import { MESES } from "../constants";
import { FaltaCheckbox } from "./falta-checkbox";

interface GradeFaltasViewProps {
  anoReferencia: number;
  itensVisiveis: EquipeItem[];
  membrosComComissoes: MembroComComissoes[];
  loading: boolean;
  showInativos: boolean;
  onShowInativosChange: (value: boolean) => void;
  onValidarResultados: () => void;
  onToggleFalta: (membroId: string, mesReferencia: string, temFalta: boolean) => void;
}

export function GradeFaltasView({
  anoReferencia,
  itensVisiveis,
  membrosComComissoes,
  loading,
  showInativos,
  onShowInativosChange,
  onValidarResultados,
  onToggleFalta,
}: GradeFaltasViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Grade de Faltas - {anoReferencia}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInativos}
              onChange={(e) => onShowInativosChange(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            Mostrar inativos
          </label>
          <button
            onClick={onValidarResultados}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Validar Resultados
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando comissões...</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto min-w-[1200px]">
              <colgroup>
                <col style={{ width: "280px" }} />
                <col style={{ width: "120px" }} />
                {MESES.map((m) => (
                  <col key={m.value} style={{ width: "60px" }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b bg-gray-50 sticky top-0 z-10">
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[280px]">
                    Empresa/Setor
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[120px]">
                    Função
                  </th>
                  {MESES.map((m) => (
                    <th
                      key={m.value}
                      className="text-center p-2 font-semibold text-gray-700 bg-gray-50 w-[60px]"
                    >
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membrosComComissoes.map((membro) => {
                  const itemOriginal = itensVisiveis.find((i) => i.id === membro.id);
                  if (!itemOriginal) return null;

                  const funcao =
                    membro.funcao && membro.funcao.trim() !== ""
                      ? membro.funcao.replace(/_/g, " ")
                      : "-";

                  const nomeExibicao =
                    membro.kind === "comercial"
                      ? membro.nome
                      : membro.kind === "lideranca"
                        ? `${membro.nome} (Liderança)`
                        : membro.nome;

                  return (
                    <tr
                      key={`${membro.kind}-${membro.id}`}
                      className={`border-b hover:bg-gray-50 ${itemOriginal.status === "INATIVO" ? "opacity-50" : ""}`}
                    >
                      <td className="p-3">
                        <p className="font-medium text-gray-900 truncate">{nomeExibicao}</p>
                        <p className="text-xs text-gray-500 truncate">{membro.id}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-gray-600 truncate">{funcao}</p>
                      </td>
                      {MESES.map((mLabel) => {
                        const mesRef = `${anoReferencia}-${mLabel.value}`;
                        const comissao = membro.comissoes.find((c) => c.mesReferencia === mesRef);
                        const temFalta = comissao?.temFalta ?? false;

                        return (
                          <td key={mLabel.value} className="p-2 text-center">
                            <FaltaCheckbox
                              inputId={`falta-${membro.id}-${mLabel.value}`}
                              ariaLabel={`Falta de ${nomeExibicao} em ${mLabel.label}`}
                              checked={temFalta}
                              onChange={(checked) => onToggleFalta(membro.id, mesRef, checked)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
