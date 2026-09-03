import { prisma } from "@asa/database";
import { read, utils } from "xlsx";

type PlanilhaCell = string | number | Date | null;
type LiderancaRef = { id: string };
type PessoaRef = { id: string; nome: string };
type ParceiroRef = {
  id: string;
  nome: string;
  cpf: string;
  comercialId: string | null;
  gestorId: string | null;
  indicacoes: Array<{ id: string; cpf: string }>;
};

interface PreviewRow {
  rowNumber: number;
  dataReferencia: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  unidade: string;
  usuarioDaConta: string;
  valorComissao?: number;
  valorTotal?: number;
  status: "VALIDO" | "ORFAO" | "REJEITADO" | "DUPLICADA";
  motivo?: string;
  alerta?: string;
  parceiroNome?: string;
  comercialNome?: string;
  gestorNome?: string;
  consultorPfNome?: string;
  resgatadoPorConsultorPf?: boolean;
}

interface ParseResult {
  fileName: string;
  previewRows: PreviewRow[];
  hasMore: boolean;
  totalRows: number;
  summary: {
    total: number;
    validos: number;
    resgatados: number;
    orfaos: number;
    rejeitados: number;
    duplicadas: number;
    totalComissao: number;
    colunasEncontradas: string[];
    colunasObrigatorias: string[];
    colunasOpcionais: string[];
  };
}

const COLUNAS_OBRIGATORIAS = [
  "Data de Referência",
  "Paciente",
  "Procedimento",
  "Usuário da conta",
];

const COLUNAS_OPCIONAIS = [
  "CPF",
  "Forma Pagamento",
  "Unidade",
  "Tipo Procedimento",
];

export async function parsePlanilhaProducao(
  file: File,
  backofficeId: string,
): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Converter planilha para array de arrays
  const jsonData = utils.sheet_to_json<PlanilhaCell[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!jsonData || jsonData.length < 2) {
    throw new Error("Planilha vazia ou sem cabeçalhos");
  }

  // Cabeçalhos estão na linha 2 (índice 1)
  const headersRaw = jsonData[1] || [];
  const headers: Record<string, string> = headersRaw.reduce(
    (acc, h, idx) => {
      const headerStr = h ? String(h).trim() : "";
      if (headerStr) {
        acc[String(idx)] = headerStr;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const colunasEncontradas = Object.values(headers).map((h) => h.toLowerCase());

  // Validar colunas obrigatórias
  const colunasObrigatoriasEncontradas = COLUNAS_OBRIGATORIAS.filter((col) =>
    colunasEncontradas.includes(col.toLowerCase()),
  );

  if (colunasObrigatoriasEncontradas.length !== COLUNAS_OBRIGATORIAS.length) {
    const faltantes = COLUNAS_OBRIGATORIAS.filter(
      (col) => !colunasEncontradas.includes(col.toLowerCase()),
    );
    throw new Error(`Colunas obrigatórias faltando: ${faltantes.join(", ")}`);
  }

  // Mapear índices das colunas
  const normalizar = (s: string) =>
    s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const getColIndex = (nome: string) => {
    const n = normalizar(nome);
    return Object.values(headers).findIndex((h) => normalizar(h) === n);
  };

  const getColIndexFlexible = (nomes: string[]) => {
    for (const nome of nomes) {
      const idx = getColIndex(nome);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxDataRef = getColIndex("Data de Referência");
  const idxPaciente = getColIndex("Paciente");
  const idxCpf = getColIndex("CPF");
  const idxProcedimento = getColIndex("Procedimento");
  const idxUsuarioConta = getColIndex("Usuário da conta");
  const idxUnidade = getColIndex("Unidade");
  const idxTipoProcedimento = getColIndex("Tipo Procedimento");
  const idxValorTotal = getColIndexFlexible([
    "Total Pago",
    "Total Pagto",
    "Valor Total",
    "Total Pagamento",
    "TotalPago",
  ]);

  if (idxValorTotal < 0) {
    throw new Error("Coluna financeira obrigatória faltando: Total Pago, Valor Total ou equivalente");
  }

  // Buscar parceiros do backoffice
  let liderancas: LiderancaRef[] = [];
  let liderancaIds: string[] = [];
  let comerciais: PessoaRef[] = [];
  let consultoresPf: PessoaRef[] = [];
  let gestores: PessoaRef[] = [];
  let parceiros: ParceiroRef[] = [];
  let consultorPorNome = new Map<string, PessoaRef>();
  let comercialPorId = new Map<string, string>();
  let gestorPorNome = new Map<string, PessoaRef>();

  try {
    liderancas = await prisma.equipe.findMany({
      where: { backofficeId, tipo: "LIDERANCA" },
      select: { id: true },
    });
    liderancaIds = liderancas.map((l) => l.id);

const [comerciaisResult, consultoresPfResult, gestoresResult] = await Promise.all([
       prisma.equipe.findMany({
         where: { liderancaId: { in: liderancaIds } },
         select: { id: true, nome: true },
       }),
       prisma.consultorPf.findMany({
         where: { liderancaId: { in: liderancaIds }, status: "ATIVO" },
         select: { id: true, nome: true },
       }),
       prisma.gestor.findMany({
         where: { lideranca: { backofficeId } },
         select: { id: true, nome: true },
       }),
     ]);
     comerciais = comerciaisResult;
     consultoresPf = consultoresPfResult;
     gestores = gestoresResult;

     consultorPorNome = new Map(
       consultoresPf.map((c) => [normalizarNome(c.nome), c]),
     );

     comercialPorId = new Map(comerciais.map((c) => [c.id, c.nome]));

     gestorPorNome = new Map(
       gestores.map((g) => [normalizarNome(g.nome), g]),
     );

    // Buscar parceiros do backoffice para validação de CPF no preview
    parceiros = await prisma.parceiro.findMany({
      where: { backofficeId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        comercialId: true,
        gestorId: true,
        indicacoes: {
          select: { id: true, cpf: true },
        },
      },
    });
  } catch (dbError: unknown) {
    const message = dbError instanceof Error ? dbError.message : "Erro desconhecido";
    const stack = dbError instanceof Error ? dbError.stack : undefined;
    console.error("[parsePlanilhaProducao] ERRO DE BANCO DE DADOS:", message, stack);
    // Se falhar busca de parceiros, continua sem eles (todas as linhas virarão órfãs)
    console.warn("[parsePlanilhaProducao] Continuando sem dados de parceiros/comerciais - preview limitado");
  }

  // Processar linhas (começa do índice 2 para pular título e cabeçalho)
  const previewRows: PreviewRow[] = [];
  let totalValidos = 0;
  let totalResgatados = 0;
  let totalOrfaos = 0;
  let totalRejeitados = 0;
  let totalDuplicadas = 0;

  // A produção não deve aparecer como nova se a mesma chave já estiver
  // persistida em qualquer upload deste Backoffice. A consulta é apenas de
  // leitura e falha de forma não bloqueante para preservar o preview.
  const chavesExistentes = new Set<string>();
  try {
    const existentes = await prisma.procedimentoPF.findMany({
      where: { upload: { backofficeId } },
      select: { dataReferencia: true, cpf: true, procedimento: true, unidade: true },
    });
    for (const existente of existentes) {
      chavesExistentes.add(
        `${dataParaChave(existente.dataReferencia)}|${normalizarCpf(existente.cpf)}|${existente.procedimento}|${existente.unidade}`,
      );
    }
  } catch (error) {
    console.warn("[parsePlanilhaProducao] Não foi possível consultar duplicidades no preview:", error);
  }

  const MAX_PREVIEW_ROWS = 100;

  for (let i = 2; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || Object.keys(row).length === 0) continue;

    const rowNumber = i + 1; // Número da linha na planilha (1-indexed)
    const dataReferenciaRaw = row[idxDataRef];
    const paciente = String(row[idxPaciente] || "").trim();
    const cpfRaw = String(row[idxCpf] || "").trim();
    const procedimento = String(row[idxProcedimento] || "").trim();
    const usuarioDaConta = String(row[idxUsuarioConta] || "").trim();
    const unidade = idxUnidade >= 0 ? String(row[idxUnidade] || "").trim() : "";
    const tipoProcedimento =
      idxTipoProcedimento >= 0
        ? String(row[idxTipoProcedimento] || "").trim()
        : "PARTICULAR";
const valorTotalRaw =
      idxValorTotal >= 0 ? String(row[idxValorTotal] || "").trim() : "";
    let valorTotal: number | null = null;
    if (valorTotalRaw) {
      const limpo = valorTotalRaw.replace(/[^\d.,-]/g, "");
      if (limpo.includes(",")) {
        valorTotal = parseFloat(limpo.replace(/\./g, "").replace(",", "."));
      } else if (/^-?\d+\.\d{1,2}$/.test(limpo)) {
        valorTotal = parseFloat(limpo);
      } else {
        valorTotal = parseFloat(limpo.replace(/\./g, ""));
      }
    }

    // Validar dados
    let status: "VALIDO" | "ORFAO" | "REJEITADO" | "DUPLICADA" = "VALIDO";
    let motivo: string | undefined;
    let alerta: string | undefined;

    if (valorTotal === null || !Number.isFinite(valorTotal)) {
      status = "REJEITADO";
      motivo = "Valor total ausente ou inválido";
    }

    // Validar CPF — linhas sem CPF (ou com CPF inválido) caem para a lógica
    // de "não encontrado" e são marcadas como órfãs, em vez de rejeitadas.
    const cpf = cpfRaw.replace(/\D/g, "");
    const cpfValido = cpf.length === 11;

    // Validar data
    let dataReferencia: string | null = null;
    if (!dataReferenciaRaw) {
      status = "REJEITADO";
      motivo = "Data de referência ausente";
    } else {
      dataReferencia = parseData(dataReferenciaRaw);
      if (!dataReferencia) {
        status = "REJEITADO";
        motivo = "Data de referência inválida";
      }
    }

    // Validar paciente
    if (!paciente) {
      status = "REJEITADO";
      motivo = motivo ? `${motivo}; Paciente ausente` : "Paciente ausente";
    }

    // Validar procedimento
    if (!procedimento) {
      status = "REJEITADO";
      motivo = motivo
        ? `${motivo}; Procedimento ausente`
        : "Procedimento ausente";
    }

    // Verificar se é órfão (não tem parceiro/indicado)
    let parceiroEncontrado: ParceiroRef | undefined;
    let indicadoEncontrado: { id: string; cpf: string } | undefined;
    let consultorPf: PessoaRef | null = null;
    let gestorEncontrado: PessoaRef | null = null;
    let resgatadoPorConsultorPf = false;

    if (status !== "REJEITADO") {
      if (!cpfValido) {
        status = "ORFAO";
        motivo = !cpf ? "CPF ausente" : "CPF inválido";
      } else {
        parceiroEncontrado = parceiros.find(
          (p) => normalizarCpf(p.cpf) === cpf,
        );

        if (!parceiroEncontrado) {
          for (const parceiro of parceiros) {
            indicadoEncontrado = parceiro.indicacoes.find(
              (ind) => normalizarCpf(ind.cpf) === cpf,
            );
            if (indicadoEncontrado) {
              parceiroEncontrado = parceiro;
              break;
            }
          }
        }

        if (!parceiroEncontrado) {
          status = "ORFAO";
          motivo = "Parceiro não encontrado";
        }
      }

      if (usuarioDaConta && !consultorPf) {
        const nomeNormalizado = normalizarNome(usuarioDaConta);
        const resgate = consultorPorNome.get(nomeNormalizado) ?? null;
        if (resgate) {
          consultorPf = resgate;
          gestorEncontrado =
            gestorPorNome.get(nomeNormalizado) ?? null;
          if (!parceiroEncontrado && !indicadoEncontrado) {
            resgatadoPorConsultorPf = true;
            if (status === "ORFAO") {
              status = "VALIDO";
              motivo = undefined;
            }
          }
        }
      }
    }

    if (status === "VALIDO" && dataReferencia && (parceiroEncontrado || resgatadoPorConsultorPf)) {
      const chaveProcedimento = `${dataReferencia}|${cpf}|${procedimento}|${unidade || "NÃO INFORMADA"}`;
      if (chavesExistentes.has(chaveProcedimento)) {
        status = "DUPLICADA";
        motivo = "Produção já existe no banco e será ignorada para evitar duplicidade";
        totalDuplicadas++;
      } else {
        chavesExistentes.add(chaveProcedimento);
      }
    }

    if (status === "VALIDO") {
      if (resgatadoPorConsultorPf) {
        totalResgatados++;
      } else {
        totalValidos++;
      }
    } else if (status === "ORFAO") {
      totalOrfaos++;
    } else if (status === "DUPLICADA") {
      // Duplicadas são contabilizadas separadamente de rejeitadas.
    } else {
      totalRejeitados++;
    }

    if (status === "VALIDO" && usuarioDaConta && !consultorPf) {
      alerta = "Usuário não localizado como Consultor PF; a produção será importada sem esse vínculo.";
    }

    if (resgatadoPorConsultorPf) {
      alerta = "Cliente não indicado, mas vinculado ao Consultor PF da conta. A produção será importada com essa comissão.";
    }

    // Adicionar ao preview (limitado)
    if (previewRows.length < MAX_PREVIEW_ROWS) {
      previewRows.push({
        rowNumber,
        dataReferencia: dataReferencia ?? String(dataReferenciaRaw),
        paciente,
        cpf,
        procedimento,
        tipoProcedimento,
        unidade: unidade || "NÃO INFORMADA",
        usuarioDaConta,
        status,
        motivo,
        alerta,
        parceiroNome: parceiroEncontrado?.nome,
        comercialNome: parceiroEncontrado
          ? comercialPorId.get(parceiroEncontrado.comercialId ?? "")
          : undefined,
        gestorNome: gestorEncontrado?.nome,
        consultorPfNome: consultorPf?.nome,
        resgatadoPorConsultorPf,
        valorComissao: 0,
        valorTotal: valorTotal ?? undefined,
      });
    }
  }

  // Total de linhas de dados (exclui linha 1=título e linha 2=cabeçalho)
  const totalLinhasDados = Math.max(0, jsonData.length - 2);

  return {
    fileName: file.name,
    previewRows,
    hasMore: totalLinhasDados > MAX_PREVIEW_ROWS,
    totalRows: totalLinhasDados,
    summary: {
      total: totalLinhasDados,
      validos: totalValidos,
      resgatados: totalResgatados,
      orfaos: totalOrfaos,
      rejeitados: totalRejeitados,
      duplicadas: totalDuplicadas,
      totalComissao: 0,
      colunasEncontradas: Object.values(headers).map((h) => String(h).trim()),
      colunasObrigatorias: COLUNAS_OBRIGATORIAS,
      colunasOpcionais: COLUNAS_OPCIONAIS,
    },
  };
}

function parseData(dataRaw: PlanilhaCell | undefined): string | null {
  if (!dataRaw) return null;

  if (typeof dataRaw === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dataRaw * 24 * 60 * 60 * 1000);
    return formatDate(date);
  }

  const str = String(dataRaw).trim();

  const patterns = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      } else if (pattern === patterns[1]) {
        return str;
      } else if (pattern === patterns[2]) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      }
    }
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return formatDate(date);
  }

  return null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, "");
  return cpfLimpo.padStart(11, "0");
}

function dataParaChave(data: Date): string {
  return data.toISOString().slice(0, 10);
}
