"use client";

import Link from "next/link";

/**
 * Seção "Configurações"
 * Página em construção: o conteúdo será adicionado nas próximas etapas.
 * O submenu "Regras" já está disponível e foi movido para cá.
 */
export default function ConfiguracoesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm">
          Preferências e parâmetros gerais do backoffice
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
        <p className="text-sm text-gray-600">
          Esta página faz parte da nova seção "Configurações" e ainda está vazia.
        </p>
        <p className="text-sm text-gray-600">
          <Link
            href="/backoffice/configuracoes/regras"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Ir para Configurações · Regras →
          </Link>
        </p>
      </div>
    </div>
  );
}