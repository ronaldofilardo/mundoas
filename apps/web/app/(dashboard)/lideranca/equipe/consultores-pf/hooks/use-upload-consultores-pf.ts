"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { validarLinha } from "@/lib/upload/consultores-pf/validation";
import {
  extrairLinhasDoArquivo,
  parsePlanilhaLinhas,
} from "@/lib/upload/consultores-pf/parsers";
import type { LinhaPlanilha, ResultadoImportacao } from "@/lib/upload/consultores-pf/types";

export interface UseUploadConsultoresPfOptions {
  fetchImpl?: typeof fetch;
}

export function useUploadConsultoresPf(options: UseUploadConsultoresPfOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [linhas, setLinhas] = useState<LinhaPlanilha[]>([]);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [setoresValidos, setSetoresValidos] = useState<string[]>([]);

  useEffect(() => {
    fetchImpl("/api/v1/setores?origem=regras-consultores")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Array<{ id: string; nome: string }> | null) => {
        const setores = data?.map((s) => s.nome) ?? [];
        setSetoresValidos(setores);
        setLinhas((atuais) =>
          atuais.map((linha) => ({
            ...linha,
            erros: validarLinha(linha, setores),
          })),
        );
      })
      .catch(() => {
        setSetoresValidos([]);
        toast.error("Não foi possível carregar os setores de Regras: Consultores");
      });
  }, [fetchImpl]);

  const resetar = useCallback(() => {
    setArquivo(null);
    setLinhas([]);
    setResultado(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const fechar = useCallback(() => {
    resetar();
    setOpen(false);
  }, [resetar]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const nomeLower = file.name.toLowerCase();
      if (
        !nomeLower.endsWith(".xlsx") &&
        !nomeLower.endsWith(".xls") &&
        !nomeLower.endsWith(".csv")
      ) {
        toast.error("Formato inválido. Envie um arquivo .xlsx, .xls ou .csv.");
        return;
      }

      setArquivo(file);
      setResultado(null);

      try {
        const linhasBrutas = await extrairLinhasDoArquivo(file);
        if (linhasBrutas.length === 0) {
          toast.error("Nenhuma linha encontrada no arquivo.");
          return;
        }

        const parsed = parsePlanilhaLinhas(linhasBrutas);
        const linhasComValidacao = parsed.map((linha) => ({
          ...linha,
          erros: validarLinha(linha, setoresValidos),
        }));

        setLinhas(linhasComValidacao);
      } catch (err) {
        console.error("[UploadPlanilhaConsultoresPf] Erro ao ler arquivo:", err);
        toast.error("Erro ao ler o arquivo. Verifique o formato.");
      }
    },
    [fetchImpl, setoresValidos],
  );

  const baixarModelo = useCallback(() => {
    const dados = [
      {
        Nome: "João Silva",
        Email: "joao@empresa.com",
        CPF: "12345678900",
        Telefone: "11999999999",
        Setores: "<nome do setor 1>; <nome do setor 2>",
      },
      {
        Nome: "Maria Souza",
        Email: "maria@empresa.com",
        CPF: "98765432100",
        Telefone: "11988888888",
        Setores: "<nome do setor>",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(dados);
    ws["!cols"] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 14 },
      { wch: 15 },
      { wch: 35 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consultores PF");
    XLSX.writeFile(wb, "modelo-consultores-pf.xlsx");
  }, []);

  const handleImportar = useCallback(async () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo primeiro.");
      return;
    }

    const linhasComErro = linhas.filter((l) => l.erros.length > 0).length;
    if (linhasComErro > 0) {
      const confirmado = window.confirm(
        `${linhasComErro} linha(s) com erro serão ignoradas. Deseja continuar importando apenas as ${linhas.length - linhasComErro} linha(s) válida(s)?`,
      );
      if (!confirmado) return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetchImpl(
        "/api/v1/lideranca/equipe/consultores-pf/importar",
        { method: "POST", body: formData },
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao importar planilha.");
      }

      setResultado(json);

      if (json.criados > 0) {
        toast.success(
          `${json.criados} consultor(es) criado(s) com sucesso.`,
        );
        router.refresh();
      }

      if (json.erros > 0 && json.criados === 0) {
        toast.error("Nenhum consultor foi criado. Verifique os erros abaixo.");
      }
    } catch (err) {
      console.error("[UploadPlanilhaConsultoresPf] Erro ao importar:", err);
      const mensagem = err instanceof Error ? err.message : "Erro ao importar planilha.";
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }, [arquivo, linhas, fetchImpl, router]);

  const linhasValidas = linhas.filter((l) => l.erros.length === 0).length;
  const linhasInvalidas = linhas.length - linhasValidas;

  return {
    open,
    loading,
    arquivo,
    linhas,
    resultado,
    setoresValidos,
    inputRef,
    linhasValidas,
    linhasInvalidas,
    setOpen,
    resetar,
    fechar,
    handleFileChange,
    handleImportar,
    baixarModelo,
  };
}
