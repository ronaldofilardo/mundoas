"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRegras } from "@/hooks/use-regras";
import { RegraCard } from "@/comissionamento/components/RegraCard";
import { FormNovaRegra } from "@/comissionamento/components/FormNovaRegra";
import type { RegrasComerciais, RegrasGestores, RegrasFaltas } from "@/app/(dashboard)/backoffice/usuarios/comerciais/types";

interface TabRegrasProps {}

export function TabRegras({}: TabRegrasProps) {
  const {
    regrasComerciais,
    regrasGestores,
    regrasFaltas,
    loading,
    deleteConfirm,
    setDeleteConfirm,
    newRule,
    setNewRule,
    updateNewRule,
    clearNewRule,
    handleNovaRegra,
    handleEditarPercentual,
    handleExcluirItem,
    openDeleteItemConfirm,
  } = useRegras();

  const handleNovaRegraWrapper = (
  type: "comerciais" | "gestores" | "faltas",
  nome: string,
  percentual: number
) => {
  handleNovaRegra(type);
  clearNewRule(type);
  // O fetchRegras é chamado dentro do useEffect do hook
  setDeleteConfirm(null);
};

  const renderSection = (
    title: string,
    icon: string,
    regras: RegrasComerciais | RegrasGestores | RegrasFaltas | null,
    type: "comerciais" | "gestores" | "faltas"
  ) => (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <span className="text-xs text-gray-500">
          {(regras?.itens || []).length} {(regras?.itens || []).length === 1 ? "regra" : "regras"}
        </span>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {regras?.itens?.map((item: any) => (
            <RegraCard
              key={item.id}
              label={item.nome}
              value={item.percentual}
              onChange={(val) => {
                const num = parseFloat(val) || 0;
                handleEditarPercentual(type, item.id, num);
              }}
              onDelete={() => openDeleteItemConfirm(type, item.id, item.nome)}
            />
          ))}
          {(regras?.itens || []).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma regra personalizada criada. Use o formulário abaixo para adicionar.
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderSection("Regras: Consultores", "💼", regrasComerciais, "comerciais")}
        {renderSection("Regras: Líderes/Supervisores", "👤", regrasGestores, "gestores")}
        {renderSection("Regras: Faltas", "📋", regrasFaltas, "faltas")}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Excluir item "{deleteConfirm.itemName}"?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta ação removerá permanentemente esta regra personalizada.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja prosseguir?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => handleExcluirItem(deleteConfirm.type as "comerciais" | "gestores" | "faltas", deleteConfirm.itemId!)}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm === null && (
        <div>
          <FormNovaRegra
            type="comerciais"
            onSave={handleNovaRegraWrapper}
            onClose={() => setDeleteConfirm(null)}
            initialNome={newRule.comerciais?.nome ?? ""}
            initialPercentual={newRule.comerciais?.percentual ?? ""}
          />
        </div>
      )}
    </div>
  );
}