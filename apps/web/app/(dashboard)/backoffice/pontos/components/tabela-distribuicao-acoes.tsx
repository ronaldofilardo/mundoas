"use client";

import { toast } from "sonner";

export function TabelaDistribuicaoAcoes({
  distribuindoTodos,
  setDistribuindoTodos,
  pendentes,
  onDistribuirTodos,
  onAtualizar,
  setAtualizando,
}: {
  distribuindoTodos: boolean;
  setDistribuindoTodos: (v: boolean) => void;
  pendentes: number;
  onDistribuirTodos: () => void;
  onAtualizar: () => void;
  setAtualizando: (v: boolean) => void;
}) {<tool_call>
<function=bash>
<parameter=command>
wc -l "C:\apps\mundoas\apps\web\app\(dashboard)\backoffice\pontos\components\tabela-distribuicao.tsx"