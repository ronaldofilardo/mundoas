"use client";

import { Suspense } from "react";
import { BonusConsultorPf } from "../../metas-vendas/components/bonus-consultor-pf";

function BonusContent() {
  return <BonusConsultorPf />;
}

export default function EquipeBonusPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bonificação</h1>
        <p className="text-gray-500 text-sm">
          Bônus por gestor e consultor
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          }
        >
          <BonusContent />
        </Suspense>
      </div>
    </div>
  );
}