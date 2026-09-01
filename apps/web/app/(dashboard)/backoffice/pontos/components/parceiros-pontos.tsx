"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Indicado {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  status: string;
  createdAt: string;
}

interface ParceiroPayload {
  nome: string;
  email: string;
  cpf: string;
  id?: string;
}

type WindowWithCpfTimeout = Window & { cpfTimeout?: ReturnType<typeof setTimeout> };

interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  pixChave: string | null;
  status: string;
  totalIndicados: number;
  desligadoEm: string | null;
  createdAt: string;
  indicacoes: Indicado[];
}

export function ParceirosPontos() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editParceiro, setEditParceiro] = useState<Parceiro | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
  });
  const [saving, setSaving] = useState(false);
  const [cpfValidation, setCpfValidation] = useState<"valid" | "invalid" | "">(
    "",
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLinhas, setUploadLinhas] = useState<
    Array<{ linha: number; nome?: string; email?: string; cpf?: string; erros: string[] }>
  >([]);
  const [uploadResultado, setUploadResultado] = useState<{
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
  } | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchParceiros();
  }, []);

  async function fetchParceiros() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/parceiros");
      const data = await res.json();
      if (Array.isArray(data)) {
        setParceiros(data);
      }
    } catch {
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditParceiro(null);
    setForm({
      nome: "",
      email: "",
      cpf: "",
    });
    setCpfValidation("");
    setShowModal(true);
  }

  async function validateCpfRealTime(cpf: string) {
    if (cpf.length < 11) {
      setCpfValidation("");
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/backoffice/parceiros/check-cpf?cpf=${encodeURIComponent(cpf)}`,
      );
      const data = await res.json();
      setCpfValidation(data.valid ? "valid" : "invalid");
      if (!data.valid) {
        toast.error(data.message);
      }
    } catch {
      setCpfValidation("invalid");
    }
  }

  function openEdit(p: Parceiro) {
    setEditParceiro(p);
    setForm({
      nome: p.nome,
      email: p.email,
      cpf: p.cpf,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[Parceiros] Submit iniciado:", form);
    setSaving(true);

    try {
      const url = editParceiro
        ? "/api/v1/backoffice/parceiros"
        : "/api/v1/backoffice/parceiros";
      const method = editParceiro ? "PUT" : "POST";

      const payload: ParceiroPayload = editParceiro
        ? { ...form, id: editParceiro.id }
        : { ...form };

      console.log("[Parceiros] Enviando payload:", payload);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[Parceiros] Resposta:", res.status);

      const data = await res.json();
      console.log("[Parceiros] Data:", data);

      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      if (!editParceiro && data.link) {
        await navigator.clipboard.writeText(data.link);
        toast.success("Parceiro criado! Link copiado para clipboard.");
      } else {
        toast.success("Parceiro atualizado com sucesso");
      }

      setShowModal(false);
      fetchParceiros();
    } catch {
      console.error("[Parceiros] Erro ao salvar parceiro");
      toast.error("Erro ao salvar parceiro");
    } finally {
      setSaving(false);
    }
  }

  async function handleReativar(p: Parceiro) {
    if (!confirm(`Reativar ${p.nome}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/v1/backoffice/parceiros/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao reativar");
        return;
      }

      toast.success("Parceiro reativado com sucesso");
      fetchParceiros();
    } catch {
      toast.error("Erro ao reativar parceiro");
    }
  }

  async function handleDesligar(p: Parceiro) {
    if (
      !confirm(
        `Desligar ${p.nome}? Os vínculos com clientes serão desfeitos.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/backoffice/parceiros?id=${p.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao desligar");
        return;
      }

      toast.success("Parceiro desligado com sucesso");
      fetchParceiros();
    } catch {
      toast.error("Erro ao desligar parceiro");
    }
  }

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function toggleExpand(id: string) {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function normalizarChaveUpload(chave: string): string {
    return chave
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  const MAPA_COLUNAS_UPLOAD: Record<string, string> = {
    nome: "nome",
    "nome completo": "nome",
    name: "nome",
    email: "email",
    "e-mail": "email",
    cpf: "cpf",
  };

  function mapearColunasUpload(row: Record<string, unknown>) {
    const resultado: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(row)) {
      const chaveNormalizada = normalizarChaveUpload(chave);
      const alvo = MAPA_COLUNAS_UPLOAD[chaveNormalizada];
      if (alvo) {
        resultado[alvo] = valor;
      }
    }
    return resultado;
  }

  function parseCsvUpload(texto: string): Record<string, string>[] {
    const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (linhas.length === 0) return [];

    const splitLinha = (linha: string): string[] => {
      const campos: string[] = [];
      let atual = "";
      let dentroAspas = false;
      for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
        if (char === '"') {
          if (dentroAspas && linha[i + 1] === '"') {
            atual += '"';
            i++;
          } else {
            dentroAspas = !dentroAspas;
          }
        } else if (char === "," && !dentroAspas) {
          campos.push(atual);
          atual = "";
        } else {
          atual += char;
        }
      }
      campos.push(atual);
      return campos.map((c) => c.trim());
    };

    const cabecalho = splitLinha(linhas[0]).map((c) =>
      c.replace(/^"|"$/g, "").trim(),
    );

    return linhas.slice(1).map((linha) => {
      const valores = splitLinha(linha);
      const obj: Record<string, string> = {};
      cabecalho.forEach((col, idx) => {
        obj[col] = (valores[idx] || "").replace(/^"|"$/g, "").trim();
      });
      return obj;
    });
  }

  async function extrairLinhasUpload(file: File): Promise<
    Array<{ linha: number; nome?: string; email?: string; cpf?: string; erros: string[] }>
  > {
    const nomeArquivo = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let linhasBrutas: Record<string, unknown>[];
    if (nomeArquivo.endsWith(".csv") || file.type === "text/csv") {
      const texto = buffer.toString("utf-8");
      linhasBrutas = parseCsvUpload(texto);
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
      const primeiraAba = workbook.SheetNames[0];
      if (!primeiraAba) return [];
      const worksheet = workbook.Sheets[primeiraAba];
      linhasBrutas = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
          raw: false,
          blankrows: false,
        },
      );
    }

    if (linhasBrutas.length === 0) return [];

    return linhasBrutas.map((row, idx) => {
      const mapeado = mapearColunasUpload(row);
      const nome = String(mapeado.nome || "").trim();
      const email = String(mapeado.email || "").trim();
      const cpf = String(mapeado.cpf || "").trim();
      const erros: string[] = [];

      if (!nome || nome.length < 3) {
        erros.push("Nome obrigatório (mínimo 3 caracteres)");
      }
      if (!email) {
        erros.push("Email obrigatório");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erros.push("Email inválido");
      }
      if (!cpf) {
        erros.push("CPF obrigatório");
      } else if (cpf.replace(/\D/g, "").length < 11) {
        erros.push("CPF deve ter 11 dígitos");
      }

      return {
        linha: idx + 2,
        nome: nome || undefined,
        email: email || undefined,
        cpf: cpf || undefined,
        erros,
      };
    });
  }

  function baixarModeloParceiros() {
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
  }

  function resetarUpload() {
    setUploadFile(null);
    setUploadLinhas([]);
    setUploadResultado(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  async function handleUploadFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
  }

  async function handleUploadImportar() {
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
        fetchParceiros();
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
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parceiros</h1>
          <p className="text-gray-500 text-sm">
            Gerencie parceiros e suas indicações
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="bg-white text-primary-600 border border-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 text-sm font-medium focus-ring flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Planilha
          </button>
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium focus-ring"
          >
            + Novo Parceiro
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={`skeleton-${i}`} className="card animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-32 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : parceiros.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-300 text-5xl mb-4">👥</div>
          <p className="text-gray-500 mb-4">Nenhum parceiro cadastrado</p>
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Criar primeiro parceiro
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-600 w-8"></th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Nome
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  CPF
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Email
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Indicados
                </th>
                <th className="text-left p-3 font-semibold text-gray-600">
                  Status
                </th>
                <th className="text-right p-3 font-semibold text-gray-600">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {parceiros.map((p) => (
                <Fragment key={p.id}>
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="text-gray-500 hover:text-gray-700 text-lg"
                      >
                        {expandedIds.has(p.id) ? "▼" : "▶"}
                      </button>
                    </td>
                    <td className="p-3 font-medium text-gray-900">{p.nome}</td>
                    <td className="p-3 text-gray-600">{formatCpf(p.cpf)}</td>
                    <td className="p-3 text-gray-600">{p.email}</td>
                    <td className="p-3 text-gray-600">{p.totalIndicados}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          p.status === "ATIVO"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.status === "ATIVO" ? "Ativo" : "Desligado"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                        >
                          Editar
                        </button>
                        {p.status === "ATIVO" ? (
                          <button
                            onClick={() => handleDesligar(p)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Desligar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativar(p)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedIds.has(p.id) && p.indicacoes.length > 0 && (
                    <tr key={`${p.id}-indicados`} className="bg-gray-50">
                      <td colSpan={8} className="p-0">
                        <div className="px-6 py-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Clientes Indicados por {p.nome}
                          </p>
                          <table className="w-full text-xs bg-white rounded border">
                            <thead>
                              <tr className="border-b bg-gray-100">
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Nome
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  CPF
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Status
                                </th>
                                <th className="text-left p-2 font-medium text-gray-600">
                                  Data/Hora
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.indicacoes.map((i) => (
                                <tr
                                  key={i.id}
                                  className="border-b last:border-b-0"
                                >
                                  <td className="p-2 text-gray-900">
                                    {i.nome}
                                  </td>
                                  <td className="p-2 text-gray-600">
                                    {formatCpf(i.cpf)}
                                  </td>
                                  <td className="p-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        i.status === "ATIVO"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {i.status === "ATIVO"
                                        ? "Ativo"
                                        : "Desvinculado"}
                                    </span>
                                  </td>
                                  <td className="p-2 text-gray-500">
                                    {formatDateTime(i.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedIds.has(p.id) && p.indicacoes.length === 0 && (
                    <tr key={`${p.id}-empty`} className="bg-gray-50">
                      <td
                        colSpan={8}
                        className="p-3 text-center text-gray-500 text-sm"
                      >
                        Nenhum cliente indicado ainda
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editParceiro ? "Editar Parceiro" : "Novo Parceiro"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="parceiro-nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  id="parceiro-nome"
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>
              <div>
                <label htmlFor="parceiro-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="parceiro-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
                />
              </div>
              <div>
                <label htmlFor="parceiro-cpf" className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  id="parceiro-cpf"
                  type="text"
                  required
                  maxLength={14}
                  value={form.cpf}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    const masked = v.length > 11 ? v.slice(0, 11) : v;
                    const f =
                      masked.length > 9
                        ? `${masked.slice(0, 3)}.${masked.slice(3, 6)}.${masked.slice(6, 9)}-${masked.slice(9)}`
                        : masked.length > 6
                          ? `${masked.slice(0, 3)}.${masked.slice(3, 6)}.${masked.slice(6)}`
                          : masked.length > 3
                            ? `${masked.slice(0, 3)}.${masked.slice(3)}`
                            : masked;
                    setForm({ ...form, cpf: f });

                    if (!editParceiro && masked.length === 11) {
                      const windowWithTimeout = window as WindowWithCpfTimeout;
                      if (windowWithTimeout.cpfTimeout) {
                        clearTimeout(windowWithTimeout.cpfTimeout);
                      }
                      windowWithTimeout.cpfTimeout = setTimeout(() => {
                        validateCpfRealTime(f);
                      }, 500);
                    } else if (!editParceiro) {
                      setCpfValidation("");
                    }
                  }}
                  placeholder="000.000.000-00"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus-ring ${
                    !editParceiro && cpfValidation === "invalid"
                      ? "border-red-500"
                      : !editParceiro && cpfValidation === "valid"
                        ? "border-green-500"
                        : ""
                  }`}
                  disabled={!!editParceiro}
                />
                {!editParceiro && cpfValidation === "invalid" && (
                  <p className="text-xs text-red-600 mt-1">
                    CPF inválido ou não disponível
                  </p>
                )}
                {!editParceiro && cpfValidation === "valid" && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ CPF disponível
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    (!editParceiro &&
                      (cpfValidation === "invalid" ||
                        !form.cpf ||
                        cpfValidation !== "valid"))
                  }
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? "Salvando..."
                    : editParceiro
                      ? "Atualizar"
                      : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Upload de Planilha — Parceiros
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Cada linha cria um parceiro com os mesmos campos do cadastro
                  manual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  resetarUpload();
                }}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Formato esperado da planilha:</p>
                <p>
                  Colunas obrigatórias: <strong>Nome, Email, CPF</strong>.
                </p>
                <p className="mt-1">
                  Formatos aceitos: <strong>.xlsx, .xls, .csv</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={baixarModeloParceiros}
                  className="text-xs text-primary-700 hover:text-primary-900 underline"
                >
                  Baixar modelo .xlsx
                </button>
                <span className="text-xs text-gray-400">•</span>
                <label className="text-xs cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
                  {uploadFile ? uploadFile.name : "Selecionar arquivo..."}
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleUploadFileChange}
                    className="hidden"
                  />
                </label>
                {uploadFile && !uploadResultado && (
                  <button
                    type="button"
                    onClick={resetarUpload}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Remover
                  </button>
                )}
              </div>

              {uploadLinhas.length > 0 && !uploadResultado && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-700">
                      Preview — {uploadLinhas.length} linha(s) encontrada(s)
                    </p>
                    <div className="text-xs flex gap-3">
                      <span className="text-green-700">
                        ✓{" "}
                        {uploadLinhas.filter((l) => l.erros.length === 0).length}{" "}
                        válida(s)
                      </span>
                      {uploadLinhas.some((l) => l.erros.length > 0) && (
                        <span className="text-red-700">
                          ✗{" "}
                          {uploadLinhas.filter((l) => l.erros.length > 0).length}{" "}
                          com erro
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Linha
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Nome
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Email
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            CPF
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadLinhas.map((l) => (
                          <tr
                            key={l.linha}
                            className={
                              l.erros.length > 0
                                ? "bg-red-50"
                                : "hover:bg-gray-50"
                            }
                          >
                            <td className="p-2 text-gray-500">{l.linha}</td>
                            <td className="p-2">{l.nome || "—"}</td>
                            <td className="p-2">{l.email || "—"}</td>
                            <td className="p-2">{l.cpf || "—"}</td>
                            <td className="p-2">
                              {l.erros.length === 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  OK
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  {l.erros.map((erro, idx) => (
                                    <p
                                      key={idx}
                                      className="text-xs text-red-700"
                                    >
                                      {erro}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadResultado && (
                <div className="space-y-3">
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      uploadResultado.criados > 0
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <p className="font-semibold">
                      Importação concluída: {uploadResultado.criados} criado(s),{" "}
                      {uploadResultado.erros} erro(s)
                    </p>
                  </div>

                  <div className="border rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Linha
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Nome
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Status
                          </th>
                          <th className="text-left p-2 font-medium text-gray-600">
                            Mensagem
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResultado.detalhes.map((d, idx) => (
                          <tr
                            key={idx}
                            className={
                              d.status === "erro"
                                ? "bg-red-50"
                                : "hover:bg-gray-50"
                            }
                          >
                            <td className="p-2 text-gray-500">{d.linha}</td>
                            <td className="p-2">{d.nome || "—"}</td>
                            <td className="p-2">
                              {d.status === "sucesso" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Sucesso
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Erro
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-gray-700">
                              {d.mensagem}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  resetarUpload();
                }}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Fechar
              </button>
              {!uploadResultado && (
                <button
                  type="button"
                  onClick={handleUploadImportar}
                  disabled={
                    uploadLoading ||
                    !uploadFile ||
                    uploadLinhas.length === 0 ||
                    uploadLinhas.every((l) => l.erros.length > 0)
                  }
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadLoading
                    ? "Importando..."
                    : `Importar ${uploadLinhas.filter((l) => l.erros.length === 0).length} parceiro(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
