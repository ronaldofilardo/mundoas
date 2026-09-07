import type { PasswordCheck, SenhaErrors } from "./utils/validar-senha";

export type PrimeiroAcessoFormState = {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
  loading: boolean;
  errors: SenhaErrors;
  showSenhaAtual: boolean;
  showNovaSenha: boolean;
  showConfirmarSenha: boolean;
  passwordChecks: PasswordCheck[];
  onToggleSenhaAtual: () => void;
  onToggleNovaSenha: () => void;
  onToggleConfirmarSenha: () => void;
  onSenhaAtualChange: (value: string) => void;
  onNovaSenhaChange: (value: string) => void;
  onConfirmarSenhaChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};