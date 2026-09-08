function parseMesReferencia(valor: string): string | null {
  const trim = valor.trim();
  if (/^\d{4}-\d{2}$/.test(trim)) return trim;

  const partes = trim.toLowerCase().split(/\s+/);
  if (partes.length >= 2) {
    const mesNome = partes[0];
    const ano = partes[1];
    const mesesValidos = [
      "janeiro","fevereiro","março","abril","maio","junho",
      "julho","agosto","setembro","outubro","novembro","dezembro",
    ];
    const idx = mesesValidos.indexOf(mesNome);
    if (idx >= 0 && /^\d{4}$/.test(ano)) {
      return `${ano}-${String(idx + 1).padStart(2, "0")}`;
    }
  }
  return null;
}

function parseLinhaImport(linha: string, linhaNumero: number) {
  const parts = linha.split("\t").map((p) => p.trim());
  
  if (parts.length < 3) {
    return {
      erro: "Formato esperado: Nome [TAB] Email [TAB] CPF [TAB] Telefone [TAB] Meta [TAB] Mês",
    };
  }

  const nome = parts[0];
  const email = parts[1]?.toLowerCase().trim();
  const cpf = parts[2]?.replace(/\D/g, "");
  const telefone = parts[3]?.trim() || undefined;
  const metaStr = parts[4]?.replace(/\D/g, "");
  const mesReferenciaRaw = parts[5]?.trim() || "";

  if (!nome || !email || !cpf) {
    return { erro: "Nome, Email e CPF são obrigatórios." };
  }

  const mesReferencia = parseMesReferencia(mesReferenciaRaw);
  if (!mesReferencia) {
    return { erro: "Formato de mês inválido. Use YYYY-MM ou nome do mês e ano." };
  }

  return {
    nome,
    email,
    cpf,
    telefone,
    meta: metaStr ? parseFloat(metaStr) / 100 : undefined,
    mesReferencia,
  };
}

export { parseMesReferencia, parseLinhaImport };