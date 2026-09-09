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

function parseLinhaTSV(line: string, linhaNumero: number): {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  metaStr?: string;
  mesReferenciaRaw?: string;
  erro?: string;
} {
  const parts = line.split("\t").map((p) => p.trim());
  
  if (parts.length < 3) {
    return {
      nome: "",
      email: "",
      cpf: "",
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
    return {
      nome,
      email,
      cpf,
      erro: "Nome, Email e CPF são obrigatórios.",
    };
  }

  return {
    nome,
    email,
    cpf,
    telefone,
    metaStr,
    mesReferenciaRaw,
  };
}

export { parseMesReferencia, parseLinhaTSV };