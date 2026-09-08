"use client";

import { EquipeItem } from "@/app/(dashboard)/backoffice/comissionamento/equipe/types";
import { useState } from "react";
import { toast } from "sonner";
import { FiltrosConsultores } from "@/comissionamento/components/FiltrosConsultores";
import { TabelaConsultores } from "@/comissionamento/components/TabelaConsultores";

interface TabConsultoresProps {
  itens: EquipeItem[];
}

export function TabConsultores({ itens }: TabConsultoresProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <FiltrosConsultores itens={itens} />

      <div className="card overflow-hidden">
        <TabelaConsultores itens={itens} />
      </div>

      {showModal && (
        <div>
          <p>Modal de consultor PF</p>
        </div>
      )}
    </div>
  );
}