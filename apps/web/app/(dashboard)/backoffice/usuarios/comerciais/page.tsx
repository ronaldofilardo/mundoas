"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useComerciais } from "./hooks/use-comerciais";
import { useRegras } from "./hooks/use-regras";
import type { Comercial, Meta } from "./types";
import { formatCpf } from "./utils";
import { ComercialModal } from "./components/comercial-modal";
import { NovoComercialForm } from "./components/novo-comercial-form";

const mesesAno = [
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

export default function UsuariosComerciaisPage() {
  const { comerciais, loading, refetch: refetchComerciais, setComerciais } = useComerciais();
  const { regrasComerciais, regrasGestores, loading: loadingRegras, refetch: refetchRegras } = useRegras();
  
  const [selectedComercial, setSelectedComercial] = useState<string | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [anoReferencia] = useState(new Date().getFullYear());
  const [metasGerais, setMetasGerais] = useState<Record<string, Meta[]>>({});
  const [loadingMetasGerais, setLoadingMetasGerais] = useState(false);
  const [metaVersion, setMetaVersion] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [comercialEditando, setComercialEditando] = useState<Comercial | null>(null);

  async function fetchDetail(comercialId: string) {
    setLoadingDetail(true);
    try {
      const metasRes = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`);
      setMetas(metasRes.ok ? await metasRes.json() : []);
    } catch {
      toast.error("Erro ao carregar detalhes");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function fetchMetasGerais() {
    setLoadingMetasGerais(true);
    try {
      const promises = comerciais.map(async (c) => {
        const res = await fetch(`/api/v1/backoffice/comerciais/${c.id}/metas`);
        const metas = res.ok ? await res.json() : [];
        return { comercialId: c.id, metas };
      });
      const results = await Promise.all(promises);
      const map: Record<string, Meta[]> = {};
      results.forEach((r) => {
        map[r.comercialId] = r.metas;
      });
      setMetasGerais(map);
      setMetaVersion((v) => v + 1);
    } catch {
      toast.error("Erro ao carregar metas gerais");
    } finally {
      setLoadingMetasGerais(false);
    }
  }

  async function handleEditarComercial(comercialId: string) {
    const comercial = comerciais.find((c) => c.id === comercialId);
    if (!comercial) return;
    setComercialEditando(comercial);
    setShowModal(true);
  }

  async function handleSalvarEdicao(formData: Comercial) {
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email.toLowerCase().trim(),
          cpf: formData.cpf,
          telefone: formData.telefone || undefined,
          funcao: formData.funcao || undefined,
          lideranca: formData.lideranca || undefined,
          status: formData.status,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao editar comercial");
        return;
      }
      toast.success("Comercial editado com sucesso");
      setShowModal(false);
      setComercialEditando(null);
      await refetchComerciais();
    } catch {
      toast.error("Erro ao editar comercial");
    }
  }

  async function handleDeletarComercial(comercialId: string) {
    const comercial = comerciais.find((c) => c.id === comercialId);
    if (!comercial) return;
    
    let comissoesExistentes = false;
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/comissoes`);
      if (res.ok) {
        const data = await res.json();
        comissoesExistentes = data && data.length > 0;
      }
    } catch { /* ignora */ }
    
    const msg = comissoesExistentes
      ? `⚠️ ATENÇÃO: Este comercial pode ter comissões a receber.\n\nDeseja realmente deletar "${comercial.nome}"?`
      : `Tem certeza que deseja deletar "${comercial.nome}"?`;
    
    if (!confirm(msg)) return;
    
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao deletar comercial");
        return;
      }
      toast.success("Comercial deletado");
      setComerciais((prev) => prev.filter((c) => c.id !== comercialId));
      setMetasGerais((prev) => {
        const novo = { ...prev };
        delete novo[comercialId];
        return novo;
      });
      await refetchComerciais();
    } catch {
      toast.error("Erro ao deletar comercial");
    }
  }

  async function handleSalvarMetaGeral(comercialId: string, mes: string, valor: string) {
    const num = parseFloat(valor);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorMeta: num }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta salva");
      fetchMetasGerais();
      if (selectedComercial) fetchDetail(selectedComercial);
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  useEffect(() => {
    refetchComerciais();
    refetchRegras();
  }, []);

  useEffect(() => {
    if (selectedComercial) fetchDetail(selectedComercial);
  }, [selectedComercial]);

  useEffect(() => {
    if (comerciais.length > 0) {
      fetchMetasGerais();
    }
  }, [comerciais]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários - Comerciais</h1>
        <p className="text-gray-500 text-sm">
          Cadastre e configure sua equipe Comercial, defina o percentual individual de cada um e cadastre metas mensais em R$.
        </p>
      </div>

      <NovoComercialForm onCreated={refetchComerciais} />

<div className="card mt-6 flex-grow overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Comerciais Cadastrados - Metas Anual ({anoReferencia})
        </h2>
        {loadingMetasGerais ? (
          <p className="text-sm text-gray-500">Carregando metas...</p>
        ) : comerciais.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum comercial cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-y-auto overflow-x-hidden flex-grow max-h-[600px]">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b bg-gray-50 sticky top-0 z-10">
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[150px]">Comercial</th>
                  <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[90px]">Função</th>
                  <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[130px]">Ações</th>
                  {mesesAno.map((m) => (
                    <th key={m.value} className="text-center p-2 font-semibold text-gray-700">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comerciais.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <button
                        onClick={() => handleEditarComercial(c.id)}
                        className="text-left hover:text-primary-600 hover:underline"
                      >
                        <p className="font-medium text-gray-900 truncate">{c.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{formatCpf(c.cpf)}</p>
                      </button>
                    </td>
                    <td className="p-3">
                      <p className="text-xs text-gray-600 truncate">{c.funcao ? c.funcao.replace(/_/g, " ") : "-"}</p>
                      <p className="text-xs text-gray-500 truncate">{c.status}</p>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEditarComercial(c.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeletarComercial(c.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-1 rounded hover:bg-red-50"
                          title="Deletar"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </td>
                    {mesesAno.map((m) => {
                      const mesRef = `${anoReferencia}-${m.value}`;
                      const meta = metasGerais[c.id]?.find(
                        (mt) => mt.mesReferencia === mesRef
                      );
                      return (
                        <td key={`${m.value}-${metaVersion}`} className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={meta ? Number(meta.valorMeta) : ""}
                            placeholder="R$"
                            className="w-full px-2 py-1 border rounded text-xs text-center focus-ring"
                            onBlur={(e) => {
                              const valor = e.target.value;
                              if (valor) {
                                handleSalvarMetaGeral(c.id, mesRef, valor);
                              }
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && comercialEditando && (
        <ComercialModal
          comercial={comercialEditando}
          onSave={handleSalvarEdicao}
          onClose={() => {
            setShowModal(false);
            setComercialEditando(null);
          }}
        />
      )}
    </div>
  );
}
