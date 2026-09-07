"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { CicloPontosItem, DistribuicaoPontosItem } from "../pontos-types";
import { TabelaDistribuicaoFiltros } from "./tabela-distribuicao-filtros";
import { TabelaDistribuicaoTable } from "./tabela-distribuicao-table";
import { TabelaDistribuicaoAcoes } from "./tabela-distribuicao-acoes";

interface TabelaDistribuicaoProps {
  data?: DistribuicaoPontosItem[];
  ciclo?: CicloPontosItem;
  onDistribuir?: () => void;
  onAtualizar?: () => void;
}

export function TabelaDistribuicao({ data, ciclo, onDistribuir, onAtualizar }: TabelaDistribuicaoProps) {
  const [filtroParceiro, setFiltroParceiro] = useState("");
  const [filtroIndicado, setFiltroIndicado] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [distribuindoTodos, setDistribuindoTodos] = useState(false);

  const parceiros = useMemo(() => {
    if (!data) return [];
    const unique = new Map(
      data
        .filter((p: DistribuicaoPontosItem) => p.parceiro?.nome)
        .map((p: DistribuicaoPontosItem) => [p.parceiro!.nome!, p.parceiro!])
    );
    return Array.from(unique.values());
  }, [data]);

  const producoesFiltradas = useMemo(() => {
    if (!data) return [];

    return data.filter((producao: DistribuicaoPontosItem) => {
      const parceiroMatch = !filtroParceiro || producao.parceiro?.nome === filtroParceiro;
      const indicadoMatch = !filtroIndicado ||
        producao.paciente?.toLowerCase().includes(filtroIndicado.toLowerCase());

      const dataTexto = producao.dataReferencia || producao.dataProcedimento;
      if (!dataTexto) return false;
      const dataProc = new Date(dataTexto);
      const dataInicioMatch = !filtroDataInicio || dataProc >= new Date(filtroDataInicio);
      const dataFimMatch = !filtroDataFim || dataProc <= new Date(filtroDataFim + "T23:59:59");

      return parceiroMatch && indicadoMatch && dataInicioMatch && dataFimMatch;
    });
  }, [data, filtroParceiro, filtroIndicado, filtroDataInicio, filtroDataFim]);

  const pendentes = useMemo(
    () => (data || []).filter((p) => !p.pontosDistribuidos).length,
    [data],
  );

  const handleDistribuir = async (producaoId: string) => {
    try {
      const res = await fetch("/api/v1/backoffice/pontos/distribuir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producaoId }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao distribuir pontos");
        return;
      }

      toast.success(
        `${json.pontos} pontos distribuídos para ${json.parceiro.nome}!`,
      );

      onDistribuir?.();
    } catch {
      toast.error("Erro ao distribuir pontos");
    }
  };

  const handleDistribuirTodos = async () => {
    if (!pendentes) return;
    if (!window.confirm(`Distribuir pontos de ${pendentes} produção(ões) pendente(s)?`)) return;

    setDistribuindoTodos(true);
    try {
      const res = await fetch("/api/v1/backoffice/pontos/distribuir-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao distribuir pontos em lote");
        return;
      }

      if (json.erros?.length) {
        toast.warning(
          `${json.distribuidos} produção(ões) creditada(s), ${json.totalPontos} pontos no total. ${json.erros.length} com erro.`,
        );
      } else {
        toast.success(json.mensagem || "Pontos distribuídos com sucesso!");
      }

      onDistribuir?.();
    } catch {
      toast.error("Erro ao distribuir pontos em lote");
    } finally {
      setDistribuindoTodos(false);
    }
  };

  const handleAtualizar = async () => {
    setAtualizando(true);
    try {
      await onAtualizar?.();
      toast.success("Configuração de pontos atualizada com sucesso!");
    } catch {
      toast.error("Erro ao atualizar configuração de pontos");
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <div>
      <TabelaDistribuicaoAcoes
        distribuindoTodos={distribuindoTodos}
        setDistribuindoTodos={setDistribuindoTodos}
        pendentes={pendentes}
        onDistribuirTodos={handleDistribuirTodos}
        onAtualizar={handleAtualizar}
        setAtualizando={setAtualizando}
      />

      {ciclo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Ciclo vigente:</strong> {ciclo.nome}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Fonte: produções válidas da lista de produção por upload deste Backoffice.
            Os pontos são calculados por <strong>valor da produção ÷ R$ por ponto</strong>,
            conforme a configuração vigente na data de referência.
          </p>
        </div>
      )}

      <TabelaDistribuicaoFiltros
        filtroParceiro={filtroParceiro}
        setFiltroParceiro={setFiltroParceiro}
        filtroIndicado={filtroIndicado}
        setFiltroIndicado={setFiltroIndicado}
        filtroDataInicio={filtroDataInicio}
        setFiltroDataInicio={setFiltroDataInicio}
        filtroDataFim={filtroDataFim}
        setFiltroDataFim={setFiltroDataFim}
        producoesFiltradas={producoesFiltradas}
        data={data}
        limparFiltros={() => {
          setFiltroParceiro("");
          setFiltroIndicado("");
          setFiltroDataInicio("");
          setFiltroDataFim("");
        }}
      />

      <TabelaDistribuicaoTable
        producoesFiltradas={producoesFiltradas}
      />
    </div>
  );
}