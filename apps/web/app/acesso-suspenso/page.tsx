"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, ArrowLeft, MessageCircle, CreditCard } from "lucide-react";

const WHATSAPP_ADMIN = "5541992415220";
const NOME_ADMIN = "Ronaldo Filardo";

function AcessoSuspensoConteudo() {
  const searchParams = useSearchParams();
  const motivo = searchParams?.get("motivo") ?? null;
  const linkFatura = searchParams?.get("linkFatura") ?? null;

  const isInadimplencia =
    motivo === "INADIMPLENCIA_ATRASO_15_DIAS" || motivo === "INADIMPLENTE";

  const mensagemWa = encodeURIComponent(
    `Olá, ${NOME_ADMIN}! Meu acesso ao mundoAS foi suspenso por inadimplência. Gostaria de regularizar minha situação financeira e recuperar o acesso. Pode me ajudar?`,
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_ADMIN}?text=${mensagemWa}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-6">
        {/* Ícone */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-200/60 text-red-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isInadimplencia ? "Acesso Bloqueado por Inadimplência" : "Acesso Temporariamente Suspenso"}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isInadimplencia
              ? "Sua mensalidade mundoAS está com mais de 15 dias de atraso. O acesso foi bloqueado automaticamente."
              : "O acesso a esta unidade mundoAS encontra-se suspenso devido a pendência financeira ou bloqueio administrativo."}
          </p>
        </div>

        {/* Box de instrução */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-xs text-left space-y-2">
          <p className="font-semibold text-amber-800">Como regularizar seu acesso:</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700">
            <li>Efetue o pagamento da fatura em aberto via PIX ou boleto.</li>
            <li>Após o pagamento, o acesso é liberado automaticamente em instantes.</li>
            <li>
              Ou entre em contato com o administrador{" "}
              <span className="font-bold">{NOME_ADMIN}</span>{" "}
              para regularização via WhatsApp.
            </li>
          </ul>
        </div>

        {/* Botão de pagar fatura (se tiver link) */}
        {linkFatura && (
          <a
            href={linkFatura}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            Pagar Fatura Agora ↗
          </a>
        )}

        {/* Botão WhatsApp Admin */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="btn-whatsapp-admin"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebd5a] transition shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com {NOME_ADMIN} no WhatsApp
          <span className="text-xs opacity-80">({NOME_ADMIN === "Ronaldo Filardo" ? "(41) 99241-5220" : ""})</span>
        </a>

        {/* Botão de revalidar */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Verificar Regularização
        </button>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition pt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para a tela de login
        </Link>
      </div>
    </div>
  );
}

export default function AcessoSuspensoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
        </div>
      }
    >
      <AcessoSuspensoConteudo />
    </Suspense>
  );
}
