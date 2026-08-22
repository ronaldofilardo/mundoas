import { Suspense } from "react";
import { PainelMetasVendasClient } from "./components/painel-metas-vendas-client";

export const dynamic = "force-dynamic";

export default function MetasVendasPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Painel Metas de Vendas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Acompanhe a produção e as metas dos consultores PF por setor.
        </p>
      </header>

      <Suspense fallback={null}>
        <PainelMetasVendasClient />
      </Suspense>
    </div>
  );
}
