import { ETAPAS_ONBOARDING, PLANO_LABEL } from "../constants";
import { etapaAtualOnboarding } from "../utils";
import type { Assinatura } from "../types";

interface OnboardingProgressProps {
  assinatura: Assinatura;
  acaoEmAndamento: boolean;
  onSincronizarAsaas: () => void;
}

export function OnboardingProgress({
  assinatura,
  acaoEmAndamento,
  onSincronizarAsaas,
}: OnboardingProgressProps) {
  const atual = etapaAtualOnboarding(assinatura);

  return (
    <div className="border-t pt-4">
      <span className="text-xs font-medium text-gray-500 mb-3 block">
        Progresso do onboarding
      </span>
      <div className="flex items-center">
        {ETAPAS_ONBOARDING.map((etapa, idx) => {
          const concluida = idx < atual;
          const emAndamento = idx === atual;
          return (
            <div key={etapa.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                    concluida
                      ? "bg-green-600 text-white"
                      : emAndamento
                        ? "bg-amber-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {concluida ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-[11px] mt-1 text-center max-w-[80px] ${
                    emAndamento ? "text-amber-700 font-medium" : "text-gray-500"
                  }`}
                >
                  {etapa.label}
                </span>
              </div>
              {idx < ETAPAS_ONBOARDING.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-4 ${
                    idx < atual ? "bg-green-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-4">
        <div>
          <dt className="inline text-gray-400">Termos aceitos: </dt>
          <dd className="inline text-gray-700">
            {assinatura.termosAceitosEm
              ? `${new Date(assinatura.termosAceitosEm).toLocaleString("pt-BR")} (v${assinatura.termosVersao})`
              : "ainda não"}
          </dd>
        </div>
        <div>
          <dt className="inline text-gray-400">Plano escolhido: </dt>
          <dd className="inline text-gray-700">
            {assinatura.planoAssinatura ? PLANO_LABEL[assinatura.planoAssinatura] : "ainda não"}
          </dd>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <div>
            <dt className="inline text-gray-400">Assinatura Asaas: </dt>
            <dd className="inline text-gray-700 font-mono">
              {assinatura.asaasSubscriptionId || "ainda não criada"}
            </dd>
          </div>
          {assinatura.asaasSubscriptionId && (
            <button
              onClick={onSincronizarAsaas}
              disabled={acaoEmAndamento}
              className="text-xs text-primary-600 font-medium hover:underline disabled:opacity-50"
            >
              Sincronizar faturas do Asaas
            </button>
          )}
        </div>
      </dl>
    </div>
  );
}
