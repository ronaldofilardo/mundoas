"use client";

import { Suspense } from "react";
import { BonusConsultorPf } from "../../metas-vendas/components/bonus-consultor-pf";
import { ConfiguracaoBonus } from "./components/configuracao-bonus";

function BonusConfigContent() {
  return <ConfiguracaoBonus />;
}

function BonusCiclosContent() {
  return <BonusConsultorPf />;
}

export default function ConfiguracoesBonusPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações · Bônus</h1>
        <p className="text-gray-500 text-sm">
          Conversão de produção em pontos de bônus e parâmetros de ciclos do Consultor PF
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversão de Produção em Bônus</h2>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            }
          >
            <BonusConfigContent />
          </Suspense>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ciclos e Reset</h2>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            }
          >
            <BonusCiclosContent />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
