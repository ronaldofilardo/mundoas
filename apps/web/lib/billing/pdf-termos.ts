import { jsPDF } from "jspdf";
import { formatarDataHora } from "@/util/format-data";
import { EMITENTE } from "@/lib/legal/mundoas-termos";

export interface DocumentoTermoPdf {
  key: "uso" | "privacidade" | "debito";
  titulo: string;
  texto: string;
}

export interface TermosPdfContexto {
  unidade: { nome: string; cpf: string };
  /** Aceite global dos 3 documentos (mesmo timestamp no onboarding). */
  aceitoEm: string | Date | null | undefined;
  versao: string | null | undefined;
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

function safeText(value: string): string {
  return value.replace(/[^\x20-\x7EÀ-ÿ]/g, "");
}

export async function baixarDocumentoTermoPdf(
  docTermo: DocumentoTermoPdf,
  contexto: TermosPdfContexto,
): Promise<void> {
  if (!contexto.aceitoEm) {
    throw new Error("Documento ainda não aceito no onboarding.");
  }

  const logo = await carregarLogoDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 16;
  const larguraTexto = largura - margem * 2;
  let y = 18;

  if (logo) {
    try {
      doc.addImage(logo, "PNG", margem, y - 8, 88, 28);
      y += 24;
    } catch {
      // logo opcional
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("Plataforma mundoAS — documento de onboarding", margem, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titulo = doc.splitTextToSize(
    safeText(docTermo.titulo),
    larguraTexto,
  ) as string[];
  for (const linha of titulo) {
    doc.text(linha, margem, y);
    y += 7;
  }
  y += 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(
    safeText(
      `Unidade: ${contexto.unidade.nome} — CPF: ${contexto.unidade.cpf}`,
    ),
    margem,
    y,
  );
  y += 5;
  doc.text(
    safeText(
      `Aceito em ${formatarDataHora(contexto.aceitoEm)} — versão ${contexto.versao || "—"}`,
    ),
    margem,
    y,
  );
  y += 6;

  doc.setDrawColor(180);
  doc.line(margem, y, largura - margem, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFontSize(10);
  const corpo = doc.splitTextToSize(docTermo.texto, larguraTexto) as string[];
  const alturaLinha = 4.5;
  const yMax = altura - 24;

  for (const linha of corpo) {
    if (y > yMax) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        safeText(
          `${EMITENTE.razaoSocial} — CNPJ ${EMITENTE.cnpj} — página continua`,
        ),
        margem,
        altura - 12,
      );
      doc.addPage();
      y = 16;
      doc.setFontSize(10);
      doc.setTextColor(0);
    }
    doc.text(linha, margem, y);
    y += alturaLinha;
  }

  doc.setDrawColor(180);
  doc.line(margem, y + 2, largura - margem, y + 2);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    safeText(
      `${EMITENTE.razaoSocial} — CNPJ ${EMITENTE.cnpj} — ${EMITENTE.sede}`,
    ),
    margem,
    y + 7,
  );
  doc.text(
    "Documento aceito eletronicamente na plataforma mundoAS.",
    margem,
    y + 12,
  );

  doc.save(`documento-${docTermo.key}.pdf`);
}
