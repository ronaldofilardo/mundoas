"use client";

import { EquipeItem } from "@/app/(dashboard)/backoffice/comissionamento/equipe/types";
import { TabelaConsultores } from "@/comissionamento/components/TabelaConsultores";

interface TabConsultoresProps {
  itens: EquipeItem[];
  refetch?: () => Promise<void>;
}

export function TabConsultores({ itens, refetch }: TabConsultoresProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <TabelaConsultores itens={itens} onRefetch={refetch} />
      </div>
    </div>
  );
}