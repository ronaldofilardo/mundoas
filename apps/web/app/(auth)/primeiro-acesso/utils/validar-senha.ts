export type PasswordCheck = {
  label: string;
  test: boolean;
};

export type SenhaErrors = Record<string, string>;

const ESPECIAL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "Mínimo 8 caracteres", test: password.length >= 8 },
    { label: "Pelo menos 1 maiúscula", test: /[A-Z]/.test(password) },
    { label: "Pelo menos 1 número", test: /[0-9]/.test(password) },
    { label: "Pelo menos 1 caractere especial", test: ESPECIAL_REGEX.test(password) },
  ];
}

export function validatePrimeiroAcesso(senhaAtual: string, novaSenha: string, confirmarSenha: string): SenhaErrors {
  const newErrors: SenhaErrors = {};

  if (!senhaAtual.trim()) {
    newErrors.senhaAtual = "Senha atual é obrigatória";
  }

  if (!novaSenha.trim()) {
    newErrors.novaSenha = "Nova senha é obrigatória";
  } else {
    if (novaSenha.length < 8) {
      newErrors.novaSenha = "Mínimo 8 caracteres";
    } else if (!/[A-Z]/.test(novaSenha)) {
      newErrors.novaSenha = "Pelo menos 1 letra maiúscula";
    } else if (!/[0-9]/.test(novaSenha)) {
      newErrors.novaSenha = "Pelo menos 1 número";
    } else if (!ESPECIAL_REGEX.test(novaSenha)) {
      newErrors.novaSenha = "Pelo menos 1 caractere especial (!@#$%^&*...)";
    }
  }

  if (!confirmarSenha.trim()) {
    newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
  } else if (novaSenha !== confirmarSenha) {
    newErrors.confirmarSenha = "As senhas não coincidem";
  }

  return newErrors;
}