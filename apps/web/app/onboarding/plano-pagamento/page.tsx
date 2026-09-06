"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PLANOS } from "@/lib/legal/mundoas-termos";

type Dados = {
  razaoSocial: string | null;
  cnpj: string | null;
  endereco: {
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
  };
  email: string;
  telefone: string | null;
};

type ResultadoCheckout = {
  metodoPagamento: "CARTAO" | "PIX" | "BOLETO";
  fatura: { valor: number; vencimento: string; linkFatura?: string; linkBoleto?: string } | null;
  pix: { encodedImage: string; payload: string } | null;
};

export default function OnboardingPlanoPagamentoPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [plano, setPlano] = useState<"MENSAL" | "ANUAL">("MENSAL");
  const [metodo, setMetodo] = useState<"CARTAO" | "PIX" | "BOLETO">("PIX");
  const [carregando, setCarregando] = useState(true);
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [planoConfirmado, setPlanoConfirmado] = useState(false);
  const [processandoCheckout, setProcessandoCheckout] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCheckout | null>(null);

  useEffect(() => {
    fetch("/api/v1/backoffice/onboarding/plano", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setDados(data.dados);
        if (data.planoAtual) {
          setPlano(data.planoAtual);
          setPlanoConfirmado(true);
        }
      })
      .catch(() => toast.error("Não foi possível carregar seus dados."))
      .finally(() => setCarregando(false));
  }, []);

  async function handleConfirmarPlano() {
    setSalvandoPlano(true);
    try {
      const res = await fetch("/api/v1/backoffice/onboarding/plano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plano }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Não foi possível salvar o plano.");
        return;
      }
      setPlanoConfirmado(true);
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setSalvandoPlano(false);
    }
  }

  async function handleIniciarPagamento() {
    setProcessandoCheckout(true);
    setResultado(null);
    try {
      const res = await fetch("/api/v1/backoffice/onboarding/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metodoPagamento: metodo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Não foi possível iniciar o pagamento.");
        return;
      }
      setResultado(data);
      if (metodo === "CARTAO" && data.fatura?.linkFatura) {
        window.open(data.fatura.linkFatura, "_blank");
      }
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setProcessandoCheckout(false);
    }
  }

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-primary-300" />
          <div className="w-2 h-2 rounded-full bg-primary-600" />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-400 ml-1">Etapa 2 de 2</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Confirme seus dados e escolha o plano</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Revise os dados cadastrados pelo Admin. Se algo estiver incorreto, solicite a correção — a edição não é feita diretamente aqui.
        </p>

        <div className="border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Dados da unidade (somente leitura)</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-gray-400 text-xs">Razão Social</dt><dd className="text-gray-800">{dados?.razaoSocial || "—"}</dd></div>
            <div><dt className="text-gray-400 text-xs">CNPJ</dt><dd className="text-gray-800">{dados?.cnpj || "—"}</dd></div>
            <div><dt className="text-gray-400 text-xs">E-mail</dt><dd className="text-gray-800">{dados?.email}</dd></div>
            <div><dt className="text-gray-400 text-xs">Telefone</dt><dd className="text-gray-800">{dados?.telefone || "—"}</dd></div>
            <div className="sm:col-span-2">
              <dt className="text-gray-400 text-xs">Endereço</dt>
              <dd className="text-gray-800">
                {[dados?.endereco.logradouro, dados?.endereco.numero, dados?.endereco.bairro, dados?.endereco.cidade, dados?.endereco.uf]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => toast.info("Solicitação enviada ao administrador para correção dos dados.")}
            className="mt-3 text-xs font-medium text-primary-600 hover:underline"
          >
            Solicitar correção
          </button>
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-3">1. Escolha seu plano</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {(Object.keys(PLANOS) as Array<keyof typeof PLANOS>).map((key) => (
            <button
              key={key}
              type="button"
              disabled={planoConfirmado}
              onClick={() => setPlano(key)}
              className={`text-left border rounded-xl p-4 transition disabled:cursor-not-allowed ${
                plano === key
                  ? "border-primary-600 ring-2 ring-primary-100 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="block text-sm font-semibold text-gray-800">{PLANOS[key].label}</span>
              <span className="block text-lg font-bold text-primary-700 mt-1">{PLANOS[key].valorFormatado}</span>
              <span className="block text-xs text-gray-400 mt-1">Vencimento todo dia 15</span>
            </button>
          ))}
        </div>

        {!planoConfirmado ? (
          <button
            type="button"
            onClick={handleConfirmarPlano}
            disabled={salvandoPlano}
            className="w-full mb-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-40"
          >
            {salvandoPlano ? "Salvando..." : "Confirmar plano"}
          </button>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 mt-6">2. Forma de pagamento</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {([
                { key: "PIX", label: "PIX" },
                { key: "BOLETO", label: "Boleto" },
                { key: "CARTAO", label: "Cartão" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMetodo(opt.key)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition ${
                    metodo === opt.key
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {metodo === "CARTAO" && (
              <p className="text-xs text-gray-500 mb-4">
                A primeira mensalidade será cobrada imediatamente para validar o cartão e ativar sua assinatura.
              </p>
            )}

            <button
              type="button"
              onClick={handleIniciarPagamento}
              disabled={processandoCheckout}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-40"
            >
              {processandoCheckout ? "Processando..." : "Ir para pagamento"}
            </button>

            {resultado && (
              <div className="mt-6 border border-gray-200 rounded-xl p-4 bg-gray-50 text-center">
                {resultado.metodoPagamento === "PIX" && resultado.pix ? (
                  <>
                    <p className="text-sm text-gray-600 mb-3">Escaneie o QR Code ou copie o código PIX:</p>
                    <img
                      src={`data:image/png;base64,${resultado.pix.encodedImage}`}
                      alt="QR Code PIX"
                      className="mx-auto w-48 h-48 mb-3"
                    />
                    <textarea
                      readOnly
                      value={resultado.pix.payload}
                      className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white resize-none"
                      rows={3}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                  </>
                ) : resultado.metodoPagamento === "BOLETO" && resultado.fatura?.linkBoleto ? (
                  <a
                    href={resultado.fatura.linkBoleto}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 font-semibold text-sm hover:underline"
                  >
                    Abrir boleto para pagamento →
                  </a>
                ) : resultado.fatura?.linkFatura ? (
                  <a
                    href={resultado.fatura.linkFatura}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 font-semibold text-sm hover:underline"
                  >
                    Abrir checkout do cartão →
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">Pagamento iniciado. Aguardando confirmação.</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  Assim que o pagamento for confirmado, seu acesso será liberado automaticamente.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
