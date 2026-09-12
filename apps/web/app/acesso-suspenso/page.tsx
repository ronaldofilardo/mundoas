"use client";

import Link from "next/link";
import { ShieldAlert, RefreshCw, Mail, ArrowLeft } from "lucide-react";

export default function AcessoSuspensoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Acesso Temporariamente Suspenso
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            O acesso a esta unidade mundoAS encontra-se suspenso devido a pendência financeira ou bloqueio administrativo.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs text-slate-500 text-left space-y-2">
          <p className="font-semibold text-slate-700">Como regularizar seu acesso:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Efetue o pagamento da fatura em aberto via PIX ou boleto.</li>
            <li>Caso já tenha efetuado a quitação, a compensação via PIX ocorre em poucos instantes.</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Verificar Regularização
          </button>

          <a
            href="mailto:financeiro@mundoas.com?subject=Regulariza%C3%A7%C3%A3o%20de%20Acesso%20-%20mundoAS"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            <Mail className="w-4 h-4 text-slate-500" />
            Contatar Financeiro
          </a>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a tela de login
          </Link>
        </div>
      </div>
    </div>
  );
}
