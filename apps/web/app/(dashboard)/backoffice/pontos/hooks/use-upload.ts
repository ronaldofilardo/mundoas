import { useState, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { extrairLinhasUpload, type UploadLinha } from "../components/parceiros-pontos.utils";

interface UploadResultado {
  total: number;
  sucesso: number;
  erros: number;
  criados: number;
  detalhes: Array<{
    linha: number;
    nome?: string;
    status: "sucesso" | "erro";
    mensagem: string;
  }>;
}

interface UseUploadOptions {
  onSuccess?: () => void;
}

interface UseUploadResult {
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
  uploadLoading: boolean;
  uploadFile: File | null;
  uploadLinhas: UploadLinha[];
  uploadResultado: UploadResultado | null;
  uploadInputRef: React.Ref<HTMLInputElement>;
  resetarUpload: () => void;
  handleUploadFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUploadImportar: () => Promise<void>;
  baixarModeloParceiros: () => void;
}

export function useUpload({ onSuccess }: UseUploadOptions = {}): UseUploadResult {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLinhas, setUploadLinhas] = useState<UploadLinha[]>([]);
  const [uploadResultado, setUploadResultado] = useState<UploadResultado | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const resetarUpload = () => {
    setUploadFile(null);
    setUploadLinhas([]);
    setUploadResultado(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleUploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadFile(file);
    setUploadResultado(null);

    try {
      const linhas = await extrairLinhasUpload(file);
      if (linhas.length === 0) {
        toast.error("Nenhuma linha encontrada no arquivo.");
        return;
      }
      setUploadLinhas(linhas);
    } catch (err) {
      console.error("[UploadParceiros] Erro ao ler arquivo:", err);
      toast.error("Erro ao ler o arquivo. Verifique o formato.");
    }
  };

  const handleUploadImportar = async () => {
    if (!uploadFile) {
      toast.error("Selecione um arquivo primeiro.");
      return;
    }

    const linhasComErro = uploadLinhas.filter((l) => l.erros.length > 0).length;
    if (linhasComErro > 0) {
      const confirmado = window.confirm(
        `${linhasComErro} linha(s) com erro serão ignoradas. Deseja continuar importando apenas as ${uploadLinhas.length - linhasComErro} linha(s) válida(s)?`,
      );
      if (!confirmado) return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/v1/backoffice/parceiros/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao importar planilha.");
      }

      setUploadResultado(json);

      if (json.criados > 0) {
        toast.success(
          `${json.criados} parceiro(s) criado(s) com sucesso.`,
        );
        onSuccess?.();
      }

      if (json.erros > 0 && json.criados === 0) {
        toast.error("Nenhum parceiro foi criado. Verifique os erros abaixo.");
      }
    } catch (err) {
      console.error("[UploadParceiros] Erro ao importar:", err);
      const mensagem =
        err instanceof Error ? err.message : "Erro ao importar planilha.";
      toast.error(mensagem);
    } finally {
      setUploadLoading(false);
    }
  };

  const baixarModeloParceiros = () => {
    const dados = [
      {
        Nome: "João Silva",
        Email: "joao@empresa.com",
        CPF: "12345678900",
      },
      {
        Nome: "Maria Souza",
        Email: "maria@empresa.com",
        CPF: "98765432100",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(dados);
    ws["!cols"] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parceiros");
    XLSX.writeFile(wb, "modelo-parceiros.xlsx");
  };

  return {
    uploadOpen,
    setUploadOpen,
    uploadLoading,
    uploadFile,
    uploadLinhas,
    uploadResultado,
    uploadInputRef,
    resetarUpload,
    handleUploadFileChange,
    handleUploadImportar,
    baixarModeloParceiros,
  };
}
