"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import { NovoComercialForm } from "../../../usuarios/comerciais/components/novo-comercial-form";
import { ComercialModal } from "../../../usuarios/comerciais/components/comercial-modal";
import type { Comercial } from "../../../usuarios/comerciais/types";
import type { EquipeItem } from "../types";
import { useEquipeMutations } from "../hooks/use-equipe-mutations";
import { EquipeTabela } from "./equipe-tabela";

interface TabEquipeProps {
  itens: EquipeItem[];
  refetch: () => Promise<void>;
}

export function TabEquipe({ itens: propsItens, refetch }: TabEquipeProps) {
  const [showModal, setShowModal] = useState(false);
  const [comercialEditando, setComercialEditando] = useState<Comercial | null>(null);
  const [editandoKind, setEditandoKind] = useState<"comercial" | "lideranca">(
    "comercial",
  );
  const [liderancaExpandida, setLiderancaExpandida] = useState<string | null>(null);

  const {
    handleDeletarComercial,
    handleEditarComercial,
    handleEditarLideranca,
    handleDeletarLideranca,
    handleSalvarEdicao,
    handleToggleStatusLideranca,
  } = useEquipeMutations(
    refetch,
    editandoKind,
    setEditandoKind,
    setShowModal,
    setComercialEditando,
  );

  const itensEffective = propsItens.length > 0 ? propsItens : [];

  if (showModal && comercialEditando == null) {
    setShowModal(false);
  }

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        <NovoComercialForm onCreated={refetch} />
      </div>

      <div className="card mt-6 flex-grow overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Equipe Cadastrada
          </h2>
        </div>
        {itensEffective.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum membro cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <EquipeTabela
              itens={itensEffective}
              liderancaExpandida={liderancaExpandida}
              setLiderancaExpandida={setLiderancaExpandida}
              onEditar={item => {
                if (item.kind === "comercial") {
                  handleEditarComercial(item);
                } else {
                  handleEditarLideranca(item);
                }
              }}
              onDeletarComercial={comercialId =>
                handleDeletarComercial(comercialId, itensEffective)
              }
              onDeletarLideranca={id =>
                handleDeletarLideranca(id, itensEffective)
              }
              onToggleStatusLideranca={(id, statusAtual) =>
                handleToggleStatusLideranca(id, statusAtual)
              }
            />
          </div>
        )}
      </div>

      {showModal && comercialEditando && (
        <ComercialModal
          comercial={comercialEditando}
          onSave={handleSalvarEdicao}
          onClose={() => {
            setShowModal(false);
            setComercialEditando(null);
          }}
        />
      )}
    </div>
  );
}