"use client";

import { Suspense } from "react";
import { TabRegras } from "@/app/(dashboard)/backoffice/comissionamento/components/tab-regras";

function RegrasContent() {
  return <TabRegras />;
}

export default function ConfiguracoesRegrasPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações · Regras</h1>
        <p className="text-gray-500 text-sm">
          Regras de comissionamento para consultores, líderes/supervisores e faltas
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
          <RegrasContent />
        </Suspense>
      </div>
    </div>
  );
}