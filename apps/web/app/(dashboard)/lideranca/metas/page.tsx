"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MesData {
  mes: string;
  mesLabel: string;
  lideranca: {
    meta: number;
    atingido: number;
    percentual: number;
  };
  membros: Array<{
    tipo: "CONSULTOR_PF";
    id: string;
    nome: string;
    meta: number;
    atingido: number;
    percentual: number;
  }>;
  totais: {
    meta: number;
    atingido: number;
    percentual: number;
  };
}

interface MetasResponse {
  ano: number;
  meses: MesData[];
  consultores: Array<{ id: string; nome: string }>;
}

const MESES = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

export default function MetasPage() {
  const [data, setData] = useState<MetasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [anoReferencia] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchMetas();
  }, []);

  async function fetchMetas() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lideranca/metas");
      if (!res.ok) throw new Error("Erro ao carregar metas");
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarMetaLideranca(mesReferencia: string, valor: string) {
    try {
      const num = parseFloat(valor);
      if (Number.isNaN(num) || num < 0) {
        toast.error("Valor inválido");
        return;
      }
      const res = await fetch("/api/v1/lideranca/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia, valorMeta: num }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta da liderança salva");
      fetchMetas();
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getCorPercentual(p: number) {
    if (p >= 100) return "text-green-600";
    if (p >= 80) return "text-yellow-600";
    return "text-red-600";
  }

  // Totals computed inline (no useMemo needed - simple reductions)
  const totalMetaLideranca = data?.meses.reduce((s, m) => s + m.lideranca.meta, 0) ?? 0;
  const totalAtingidoLideranca = data?.meses.reduce((s, m) => s + m.lideranca.atingido, 0) ?? 0;
  const totalPercentualLideranca =
    totalMetaLideranca > 0
      ? Math.round((totalAtingidoLideranca / totalMetaLideranca) * 100)
      : 0;

  const totalMetaEquipe = data?.meses.reduce((s, m) => s + m.totais.meta, 0) ?? 0;
  const totalAtingidoEquipe = data?.meses.reduce((s, m) => s + m.totais.atingido, 0) ?? 0;
  const totalPercentualEquipe =
    totalMetaEquipe > 0
      ? Math.round((totalAtingidoEquipe / totalMetaEquipe) * 100)
      : 0;

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando metas...</p>;
  }

  if (!data) {
    return <div className="text-center text-gray-500 py-8">Nenhum dado disponível</div>;
  }

  const renderInputMeta = (
    mesLabel: { value: string; label: string },
    valor: number,
    onSave: (mes: string, valor: string) => void,
  ) => {
    const mesRef = `${anoReferencia}-${mesLabel.value}`;
    return (
      <td key={mesLabel.value} className="p-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            defaultValue={valor > 0 ? String(valor) : ""}
            placeholder="0"
            className="w-full px-2 py-1 border rounded text-xs text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onBlur={(e) => {
              const val = e.target.value;
              if (val) onSave(mesRef, val);
            }}
          />
        </div>
      </td>
    );
  };

  const renderAtingido = (
    mesLabel: { value: string; label: string },
    atingido: number,
  ) => {
    return (
      <td key={mesLabel.value} className="p-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">R$</span>
          <span className="w-full px-2 py-1 border rounded text-xs text-center text-blue-600 font-medium bg-gray-50">
            {formatarMoeda(atingido)}
          </span>
        </div>
      </td>
    );
  };

  const renderPercentual = (
    mesLabel: { value: string; label: string },
    percentual: number,
  ) => {
    return (
      <td key={mesLabel.value} className="p-2">
        <span className={`${getCorPercentual(percentual)} font-bold text-sm`}>
          {percentual}%
        </span>
      </td>
    );
  };

  return (
    <div className="font-sans space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas Anual ({data.ano})</h1>
          <p className="text-sm text-gray-500">
            Meta da Liderança + Metas dos Consultores PF
          </p>
        </div>
      </div>

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
                {data.meses.map((m) =>
                  renderInputMeta(
                    { value: m.mesLabel, label: m.mesLabel },
                    m.lideranca.meta,
                    handleSalvarMetaLideranca,
                  ),
                )}
              </tr>

              <tr className="border-b bg-green-50 hover:bg-green-50">
                <td className="p-3" />
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">Atingido</p>
                </td>
                {data.meses.map((m) =>
                  renderAtingido({ value: m.mesLabel, label: m.mesLabel }, m.lideranca.atingido),
                )}
              </tr>

              <tr className="border-b bg-green-50 hover:bg-green-50">
                <td className="p-3" />
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">%</p>
                </td>
                {data.meses.map((m) =>
                  renderPercentual(
                    { value: m.mesLabel, label: m.mesLabel },
                    m.lideranca.percentual,
                  ),
                )}
              </tr>

              {data.meses[0]?.membros.map((membro) => (
                <>
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
                      return renderInputMeta(
                        { value: m.mesLabel, label: m.mesLabel },
                        mm?.meta || 0,
                        () => {},
                      );
                    })}
                  </tr>
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
                      return renderAtingido(
                        { value: m.mesLabel, label: m.mesLabel },
                        mm?.atingido || 0,
                      );
                    })}
                  </tr>
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
                      return renderPercentual(
                        { value: m.mesLabel, label: m.mesLabel },
                        mm?.percentual || 0,
                      );
                    })}
                  </tr>
                </>
              ))}

              <tr className="border-t-2 bg-gray-50 font-semibold hover:bg-gray-50">
                <td className="p-3 sticky left-0 bg-gray-50">
                  <p className="font-medium text-gray-900">Total Equipe</p>
                </td>
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">Meta</p>
                </td>
                {data.meses.map((m) =>
                  renderInputMeta(
                    { value: m.mesLabel, label: m.mesLabel },
                    m.totais.meta,
                    () => {},
                  ),
                )}
              </tr>

              <tr className="border-b bg-gray-50 hover:bg-gray-50">
                <td className="p-3" />
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">Atingido</p>
                </td>
                {data.meses.map((m) =>
                  renderAtingido(
                    { value: m.mesLabel, label: m.mesLabel },
                    m.totais.atingido,
                  ),
                )}
              </tr>

              <tr className="border-b bg-gray-50 hover:bg-gray-50">
                <td className="p-3" />
                <td className="p-3">
                  <p className="text-xs font-semibold text-gray-500">%</p>
                </td>
                {data.meses.map((m) =>
                  renderPercentual(
                    { value: m.mesLabel, label: m.mesLabel },
                    m.totais.percentual,
                  ),
                )}
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
    </div>
  );
}