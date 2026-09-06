import { STATUS_COLOR, STATUS_LABEL } from "../constants";
import { etapaAtualOnboarding } from "../utils";
import type { Assinatura } from "../types";
import { OnboardingProgress } from "./onboarding-progress";

interface StatusCardProps {
  assinatura: Assinatura;
  acaoEmAndamento: boolean;
  onBloquear: () => void;
  onLiberar: () => void;
  onConcederCortesia: () => void;
  onEncerrarCortesia: () => void;
  onSincronizarAsaas: () => void;
}

export function StatusCard({
  assinatura,
  acaoEmAndamento,
  onBloquear,
  onLiberar,
  onConcederCortesia,
  onEncerrarCortesia,
  onSincronizarAsaas,
}: StatusCardProps) {
  const status = assinatura.statusAssinatura;
  const bloqueada = status === "BLOQUEADA_MANUAL";
  const cortesia = status === "CORTESIA";

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Status da assinatura</span>
        <span className={`px-3 py-1 rounded text-sm ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {etapaAtualOnboarding(assinatura) >= 0 && (
        <OnboardingProgress
          assinatura={assinatura}
          acaoEmAndamento={acaoEmAndamento}
          onSincronizarAsaas={onSincronizarAsaas}
        />
      )}

      {bloqueada && (
        <div className="text-xs text-gray-500 border-l-2 border-neutral-300 pl-3">
          Bloqueado em {assinatura.bloqueadoEm && new Date(assinatura.bloqueadoEm).toLocaleString("pt-BR")}
          <br />
          Motivo: {assinatura.motivoBloqueio}
        </div>
      )}

      {cortesia && (
        <div className="text-xs text-gray-500 border-l-2 border-blue-300 pl-3">
          Cortesia desde {assinatura.cortesiaDesde && new Date(assinatura.cortesiaDesde).toLocaleString("pt-BR")}
          <br />
          Motivo: {assinatura.motivoCortesia}
          {assinatura.cortesiaExpiraEm && (
            <>
              <br />
              Expira em {new Date(assinatura.cortesiaExpiraEm).toLocaleDateString("pt-BR")}
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {!bloqueada && (
          <button
            onClick={onBloquear}
            disabled={acaoEmAndamento}
            className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Bloquear acesso
          </button>
        )}

        {bloqueada && (
          <button
            onClick={onLiberar}
            disabled={acaoEmAndamento}
            className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Liberar acesso
          </button>
        )}

        {!cortesia && !bloqueada && (
          <button
            onClick={onConcederCortesia}
            disabled={acaoEmAndamento}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Conceder cortesia
          </button>
        )}

        {cortesia && (
          <button
            onClick={onEncerrarCortesia}
            disabled={acaoEmAndamento}
            className="px-3 py-2 rounded text-sm font-medium text-gray-600 border hover:bg-gray-50 disabled:opacity-50"
          >
            Encerrar cortesia
          </button>
        )}
      </div>
    </div>
  );
}
