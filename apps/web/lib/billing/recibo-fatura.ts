import { jsPDF } from "jspdf";
import { formatarData, formatarDataHora } from "@/util/format-data";
import { isFaturaPaga } from "@/lib/billing/fatura-status";
import { EMITENTE } from "@/lib/legal/mundoas-termos";

export interface ReciboFatura {
  id: string;
  valor: number;
  vencimento: string;
  statusPagamento: string;
  pagoManualmente?: boolean | null;
  pagoEm?: string | null;
  marcadoPagoEm?: string | null;
  formaPagamento?: string | null;
  asaasPaymentId?: string | null;
}

export interface ReciboFaturaContexto {
  unidade: { nome: string; cpf: string };
}

export function origemPagamentoFatura(f: ReciboFatura): string {
  if (f.pagoManualmente) return "Baixa manual";
  if (f.asaasPaymentId) return "Asaas";
  if (isFaturaPaga(f)) return "Pagamento registrado";
  return "—";
}

export function dataPagamentoFatura(f: ReciboFatura): string | null {
  const data = f.marcadoPagoEm ?? f.pagoEm;
  return data ? formatarDataHora(data) : null;
}

export function periodoMensalidade(vencimento: string): {
  inicio: string;
  fim: string;
  mesLabel: string;
  textoPeriodo: string;
} {
  const match = vencimento.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  const base = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(vencimento);

  // Ciclo 16 a 15: fim = dia 15 do mês do vencimento; início = dia 16 do mês anterior.
  // Ex.: venc. 15/09 → mensalidade de agosto, 16/08 a 15/09.
  const fim = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 15));
  const inicio = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 16),
  );
  const nomeMes = (d: Date) =>
    d.toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
  const capitalizar = (s: string) =>
    `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
  const mesLabel = capitalizar(nomeMes(inicio));
  const ano = inicio.getUTCFullYear();
  const textoPeriodo = `de ${inicio.getUTCDate()} de ${nomeMes(inicio)} a ${fim.getUTCDate()} de ${nomeMes(fim)} de ${ano}`;

  return {
    inicio: formatarData(inicio.toISOString()),
    fim: formatarData(fim.toISOString()),
    mesLabel,
    textoPeriodo,
  };
}

function safeText(value: string): string {
  return value.replace(/[^\x20-\x7EÀ-ÿ]/g, "");
}

async function carregarLogoDataUrl(): Promise<string | null> {
  if (typeof window === "undefined" || typeof fetch !== "function") return null;
  try {
    const res = await fetch("/branding/be-smart-logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function valorBrl(valor: number): string {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Gera e baixa o recibo PDF da fatura (paga):
 * mensalidade do período, com emitente BE SMART e logo.
 */
export async function baixarReciboFaturaPdf(
  fatura: ReciboFatura,
  contexto: ReciboFaturaContexto,
): Promise<void> {
  if (!isFaturaPaga(fatura)) {
    throw new Error("Recibo disponível apenas para faturas pagas.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const margem = 18;
  const periodo = periodoMensalidade(fatura.vencimento);
  let y = 20;

  const logo = await carregarLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margem, y - 12, 88, 28);
      y += 24;
    } catch {
      // logo opcional — segue sem imagem
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("Plataforma mundoAS — licença de uso", margem, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RECIBO DE MENSALIDADE", margem, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    safeText(
      `Referente à mensalidade do mês de ${periodo.mesLabel.toLowerCase()} - período de validade ${periodo.textoPeriodo}.`,
    ),
    margem,
    y,
  );
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Emitido em ${formatarDataHora(new Date())}`, margem, y);
  y += 8;

  doc.setDrawColor(180);
  doc.line(margem, y, largura - margem, y);
  y += 10;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Unidade / prestador do serviço", margem, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(safeText(contexto.unidade.nome), margem, y);
  y += 6;
  doc.text(safeText(`CPF: ${contexto.unidade.cpf}`), margem, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Pagamento", margem, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const linhas: string[] = [
    `Valor pago: ${valorBrl(fatura.valor)}`,
    `Mensalidade do mês de ${periodo.mesLabel.toLowerCase()} - período de validade ${periodo.textoPeriodo}`,
    `Vencimento: ${formatarData(fatura.vencimento)}`,
    `Forma de pagamento: ${fatura.formaPagamento || "—"}`,
    `Origem do pagamento: ${origemPagamentoFatura(fatura)}`,
  ];

  const dataPagto = dataPagamentoFatura(fatura);
  if (dataPagto) {
    linhas.push(`Data/hora do pagamento: ${dataPagto}`);
  }
  linhas.push(`Referência da fatura: ${fatura.id}`);

  for (const linha of linhas) {
    doc.text(safeText(linha), margem, y);
    y += 6;
  }

  y += 8;
  doc.setDrawColor(180);
  doc.line(margem, y, largura - margem, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    safeText(
      `${EMITENTE.razaoSocial} — CNPJ ${EMITENTE.cnpj} — ${EMITENTE.sede}`,
    ),
    margem,
    y,
  );
  y += 5;
  doc.text(
    "Documento comprovante gerado eletronicamente pela plataforma mundoAS.",
    margem,
    y,
  );

  const nomeArquivo = `recibo-fatura-${fatura.id}.pdf`;
  doc.save(nomeArquivo);
}
