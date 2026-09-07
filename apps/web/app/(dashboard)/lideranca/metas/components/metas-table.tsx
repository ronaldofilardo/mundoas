"use client";

import type { MetasResponse } from "../types";
import { MESES } from "../types";
import { InputMetaCell, AtingidoCell, PercentualCell } from "./metas-cells";

const NOOP = () => {};

export function MetasTable({
  data,
  anoReferencia,
  onSaveLideranca,
}: {
  data: MetasResponse;
  anoReferencia: number;
  onSaveLideranca: (mes: string, valor: string) => void;
}) {
  const mesRef = (mesLabel: string) => `${anoReferencia}-${mesLabel}`;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto min-w-[1700px]">
          <colgroup>
            <col style={{ width: "240px" }} />
            <col style={{ width: "120px" }} />
            {MESES.map((m) => (
              <col key={m.value} style={{ width: "110px" }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b bg-gray-50 sticky top-0 z-10">
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[240px]">
                Membro
              </th>
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[120px]" />
              {MESES.map((m) => (
                <th
                  key={m.value}
                  className="text-center p-2 font-semibold text-gray-700 bg-gray-50 w-[110px]"
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="border-b bg-green-50 hover:bg-green-50 font-semibold">
              <td className="p-3 sticky left-0 bg-green-50 z-10">
                <p className="font-medium text-gray-900">Liderança</p>
                <p className="text-xs text-gray-500">Equipe</p>
              </td>
              <td className="p-3">
                <p className="text-xs font-semibold text-gray-500">Meta</p>
              </td>
              {data.meses.map((m) => (
                <InputMetaCell
                  key={m.mesLabel}
                  mesLabel={{ value: m.mesLabel, label: m.mesLabel }}
                  mesRef={mesRef(m.mesLabel)}
                  valor={m.lideranca.meta}
                  onSave={onSaveLideranca}
                />
              ))}
            </tr>

            <tr className="border-b bg-green-50 hover:bg-green-50">
              <td className="p-3" />
              <td className="p-3">
                <p className="text-xs font-semibold text-gray-500">Atingido</p>
              </td>
              {data.meses.map((m) => (
                <AtingidoCell key={m.mesLabel} atingido={m.lideranca.atingido} />
              ))}
            </tr>

            <tr className="border-b bg-green-50 hover:bg-green-50">
              <td className="p-3" />
              <td className="p-3">
                <p className="text-xs font-semibold text-gray-500">%</p>
              </td>
              {data.meses.map((m) => (
                <PercentualCell
                  key={m.mesLabel}
                  percentual={m.lideranca.percentual}
                />
              ))}
            </tr>

            {data.meses[0]?.membros.map((membro) => (
              <tr
                key={`${membro.id}-meta`}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-3 sticky left-0">
                  <p className="font-medium text-gray-900 truncate">{membro.nome}</p>
                  <p className="text-xs text-gray-500 truncate">Consultor PF</p>
                </td>
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">Meta</p>
                </td>
                {data.meses.map((m) => {
                  const mm = m.membros.find((mb) => mb.id === membro.id);
                  return (
                    <InputMetaCell
                      key={m.mesLabel}
                      mesLabel={{ value: m.mesLabel, label: m.mesLabel }}
                      mesRef={mesRef(m.mesLabel)}
                      valor={mm?.meta || 0}
                      onSave={NOOP}
                    />
                  );
                })}
              </tr>
            ))}

            {data.meses[0]?.membros.map((membro) => (
              <tr
                key={`${membro.id}-atingido`}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-3" />
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">Atingido</p>
                </td>
                {data.meses.map((m) => {
                  const mm = m.membros.find((mb) => mb.id === membro.id);
                  return (
                    <AtingidoCell
                      key={m.mesLabel}
                      atingido={mm?.atingido || 0}
                    />
                  );
                })}
              </tr>
            ))}

            {data.meses[0]?.membros.map((membro) => (
              <tr
                key={`${membro.id}-pct`}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-3" />
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">%</p>
                </td>
                {data.meses.map((m) => {
                  const mm = m.membros.find((mb) => mb.id === membro.id);
                  return (
                    <PercentualCell
                      key={m.mesLabel}
                      percentual={mm?.percentual || 0}
                    />
                  );
                })}
              </tr>
            ))}

            <tr className="border-t-2 bg-gray-50 font-semibold hover:bg-gray-50">
              <td className="p-3 sticky left-0 bg-gray-50">
                <p className="font-medium text-gray-900">Total Equipe</p>
              </td>
              <td className="p-3">
                <p className="text-xs font-semibold text-gray-500">Meta</p>
              </td>
              {data.meses.map((m) => (
                <InputMetaCell
                  key={m.mesLabel}
                  mesLabel={{ value: m.mesLabel, label: m.mesLabel }}
                  mesRef={mesRef(m.mesLabel)}
                  valor={m.totais.meta}
                  onSave={NOOP}
                />
              ))}
            </tr>

            <tr className="border-b bg-gray-50 hover:bg-gray-50">
              <td className="p-3" />
              <td className="p-3">
                <p className="text-xs font-semibold text-gray-500">Atingido</p>
              </td>
              {data.meses.map((m) => (
                <AtingidoCell key={m.mesLabel} atingido={m.totais.atingido} />
              ))}
            </tr>

            <tr className="border-b bg-gray-50 hover:bg-gray-50">
              <td className="p-3" />
              <td className="p-3">
                <p className="text-xs font-semibold text-gray-500">%</p>
              </td>
              {data.meses.map((m) => (
                <PercentualCell
                  key={m.mesLabel}
                  percentual={m.totais.percentual}
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {data.meses[0]?.membros.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Nenhum consultor PF na equipe
        </div>
      )}
    </div>
  );
}