"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

const SETORES_VALIDOS = [
  "Cartão Acesso Saúde",
  "CIRE Ativo",
  "CIRE Receptivo",
  "Franchising Acesso",
  "Franchising Cartão",
  "Unidade",
];

interface LinhaPlanilha {
  linhaOriginal: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  setoresTexto: string;
  setoresParsed: string[];
  erros: string[];
}

interface ResultadoImportacao {
  total: number;
  sucesso: number;
  erros: number;
  criados: number;
  detalhes: Array<{
    linha: number;
    nome?: string;
    status: "sucesso" | "erro";
    mensagem: string;
    senhaTemporaria?: string;
  }>;
}

function normalizarChave(chave: string): string {
  return chave
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const MAPA_COLUNAS: Record<string, string> = {
  nome: "nome",
  "nomecompleto": "nome",
  name: "nome",
  email: "email",
  "e-mail": "email",
  cpf: "cpf",
  telefone: "telefone",
  phone: "telefone",
  "telefoneopcional": "telefone",
  setor: "setores",
  setores: "setores",
  sector: "setores",
  sectors: "setores",
};

function parseSetores(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor
      .flatMap((v) => String(v).split(/[,;|]/))
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (typeof valor === "string") {
    return valor
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

function validarLinha(linha: LinhaPlanilha): string[] {
  const erros: string[] = [];

  if (!linha.nome || linha.nome.length < 3) {
    erros.push("Nome obrigatório (mínimo 3 caracteres)");
  }

  if (!linha.email) {
    erros.push("Email obrigatório");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linha.email)) {
    erros.push("Email inválido");
  }

  if (!linha.cpf) {
    erros.push("CPF obrigatório");
  } else {
    const cpfClean = linha.cpf.replace(/\D/g, "");
    if (cpfClean.length < 11) {
      erros.push("CPF deve ter 11 dígitos");
    }
  }

  if (linha.setoresParsed.length === 0) {
    erros.push("Selecione ao menos um setor");
  } else {
    const invalidos = linha.setoresParsed.filter(
      (s) => !SETORES_VALIDOS.includes(s),
    );
    if (invalidos.length > 0) {
      erros.push(`Setor(es) inválido(s): ${invalidos.join(", ")}`);
    }
  }

  return erros;
}

async function extrairLinhasDoArquivo(
  file: File,
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const nomeArquivo = file.name.toLowerCase();

  if (nomeArquivo.endsWith(".csv") || file.type === "text/csv") {
    const texto = new TextDecoder("utf-8").decode(buffer);
    const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (linhas.length === 0) return [];

    const splitCsv = (linha: string): string[] => {
      const campos: string[] = [];
      let atual = "";
      let dentroAspas = false;
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === '"') {
          if (dentroAspas && linha[i + 1] === '"') {
            atual += '"';
            i++;
          } else {
            dentroAspas = !dentroAspas;
          }
        } else if (ch === "," && !dentroAspas) {
          campos.push(atual);
          atual = "";
        } else {
          atual += ch;
        }
      }
      campos.push(atual);
      return campos.map((c) => c.trim());
    };

    const cabecalho = splitCsv(linhas[0]).map((c) =>
      c.replace(/^"|"$/g, "").trim(),
    );
    return linhas.slice(1).map((linha) => {
      const valores = splitCsv(linha);
      const obj: Record<string, unknown> = {};
      cabecalho.forEach((col, idx) => {
        obj[col] = (valores[idx] || "").replace(/^"|"$/g, "").trim();
      });
      return obj;
    });
  }

  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const primeiraAba = workbook.SheetNames[0];
  if (!primeiraAba) return [];

  const worksheet = workbook.Sheets[primeiraAba];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });
}

function mapearColunas(row: Record<string, unknown>): {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  setoresTexto: string;
  setoresParsed: string[];
} {
  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(row)) {
    const chaveNorm = normalizarChave(chave);
    const alvo = MAPA_COLUNAS[chaveNorm];
    if (alvo) {
      resultado[alvo] = valor;
    }
  }

  const setoresTexto = Array.isArray(resultado.setores)
    ? resultado.setores.join(", ")
    : String(resultado.setores || "").trim();

  return {
    nome: String(resultado.nome || "").trim(),
    email: String(resultado.email || "").trim(),
    cpf: String(resultado.cpf || "").trim(),
    telefone: String(resultado.telefone || "").trim(),
    setoresTexto,
    setoresParsed: parseSetores(resultado.setores),
  };
}

export function UploadPlanilhaConsultoresPf() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [linhas, setLinhas] = useState<LinhaPlanilha[]>([]);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  function resetar() {
    setArquivo(null);
    setLinhas([]);
    setResultado(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function fechar() {
    resetar();
    setOpen(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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

      const parsed: LinhaPlanilha[] = linhasBrutas.map((row, idx) => {
        const mapeado = mapearColunas(row);
        const linha: LinhaPlanilha = {
          linhaOriginal: idx + 2,
          ...mapeado,
          erros: [],
        };
        linha.erros = validarLinha(linha);
        return linha;
      });

      setLinhas(parsed);
    } catch (err) {
      console.error("[UploadPlanilhaConsultoresPf] Erro ao ler arquivo:", err);
      toast.error("Erro ao ler o arquivo. Verifique o formato.");
    }
  }

  function baixarModelo() {
    const dados = [
      {
        Nome: "João Silva",
        Email: "joao@empresa.com",
        CPF: "12345678900",
        Telefone: "11999999999",
        Setores: "Cartão Acesso Saúde; CIRE Ativo",
      },
      {
        Nome: "Maria Souza",
        Email: "maria@empresa.com",
        CPF: "98765432100",
        Telefone: "11988888888",
        Setores: "Unidade",
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
  }

  async function handleImportar() {
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

      const res = await fetch(
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
  }

  const linhasValidas = linhas.filter((l) => l.erros.length === 0).length;
  const linhasInvalidas = linhas.length - linhasValidas;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-white text-green-700 border border-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center gap-2"
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
        Upload de Planilha
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Upload de Planilha — Consultores PF
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cada linha cria um consultor PF vinculado à sua liderança, com os
              mesmos campos do cadastro manual.
            </p>
          </div>
          <button
            type="button"
            onClick={fechar}
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
              Colunas obrigatórias: <strong>Nome, Email, CPF, Setores</strong>.
              Coluna opcional: <strong>Telefone</strong>.
            </p>
            <p className="mt-1">
              <strong>Setores:</strong> separe múltiplos valores por{" "}
              <code>;</code>, <code>,</code> ou <code>|</code>. Valores
              permitidos: {SETORES_VALIDOS.join(", ")}.
            </p>
            <p className="mt-1">
              Formatos aceitos: <strong>.xlsx, .xls, .csv</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={baixarModelo}
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              Baixar modelo .xlsx
            </button>
            <span className="text-xs text-gray-400">•</span>
            <label className="text-xs cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
              {arquivo ? arquivo.name : "Selecionar arquivo..."}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {arquivo && (
              <button
                type="button"
                onClick={resetar}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Remover
              </button>
            )}
          </div>

          {linhas.length > 0 && !resultado && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">
                  Preview — {linhas.length} linha(s) encontrada(s)
                </p>
                <div className="text-xs flex gap-3">
                  <span className="text-green-700">
                    ✓ {linhasValidas} válida(s)
                  </span>
                  {linhasInvalidas > 0 && (
                    <span className="text-red-700">
                      ✗ {linhasInvalidas} com erro
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
                        Telefone
                      </th>
                      <th className="text-left p-2 font-medium text-gray-600">
                        Setores
                      </th>
                      <th className="text-left p-2 font-medium text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr
                        key={l.linhaOriginal}
                        className={
                          l.erros.length > 0
                            ? "bg-red-50"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="p-2 text-gray-500">{l.linhaOriginal}</td>
                        <td className="p-2">{l.nome || "—"}</td>
                        <td className="p-2">{l.email || "—"}</td>
                        <td className="p-2">{l.cpf || "—"}</td>
                        <td className="p-2">{l.telefone || "—"}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {l.setoresParsed.length > 0 ? (
                              l.setoresParsed.map((s, idx) => {
                                const invalido = !SETORES_VALIDOS.includes(s);
                                return (
                                  <span
                                    key={`${l.linhaOriginal}-${idx}`}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      invalido
                                        ? "bg-red-100 text-red-800"
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {s}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
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

          {resultado && (
            <div className="space-y-3">
              <div
                className={`rounded-lg p-3 text-sm ${
                  resultado.criados > 0
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <p className="font-semibold">
                  Importação concluída: {resultado.criados} criado(s),{" "}
                  {resultado.erros} erro(s)
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
                      <th className="text-left p-2 font-medium text-gray-600">
                        Senha provisória
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.detalhes.map((d, idx) => (
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
                        <td className="p-2 text-gray-700">{d.mensagem}</td>
                        <td className="p-2">
                          {d.senhaTemporaria ? (
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                              {d.senhaTemporaria}
                            </code>
                          ) : (
                            "—"
                          )}
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
            onClick={fechar}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleImportar}
            disabled={loading || !arquivo || linhas.length === 0 || !!resultado}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Importando..."
              : `Importar ${linhasValidas} consultor(es)`}
          </button>
        </div>
      </div>
    </div>
  );
}
