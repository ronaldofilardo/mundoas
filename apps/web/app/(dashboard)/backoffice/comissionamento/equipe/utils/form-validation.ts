export function validateFormData(
  formData: {
    nome: string;
    email: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  },
  isEditing: boolean
): Record<string, string> {
  const newErrors: Record<string, string> = {};

  if (!formData.nome.trim() || formData.nome.length < 3) {
    newErrors.nome = "Nome deve ter no mínimo 3 caracteres";
  }

  if (!formData.email.trim() || !formData.email.includes("@")) {
    newErrors.email = "Email inválido";
  }

  const cpfNumbers = formData.cpf.replace(/\D/g, "");
  if (cpfNumbers.length !== 11) {
    newErrors.cpf = "CPF deve ter 11 dígitos";
  }
  if (!formData.liderancaId) {
    newErrors.liderancaId = "Selecione uma liderança";
  }
  if (formData.setores.length === 0) {
    newErrors.setores = "Selecione ao menos um setor";
  }

  return newErrors;
}