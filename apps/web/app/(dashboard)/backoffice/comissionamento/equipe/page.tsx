"use client";

import { TabEquipe } from "./components/tab-equipe";

export default function ComissionamentoEquipePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
        <p className="text-gray-500 text-sm">
          Cadastro e gestão da equipe de comerciais
        </p>
      </div>
      <TabEquipe />
    </div>
  );
}
