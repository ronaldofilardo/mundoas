"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

type TipoArredondamento = "PISO" | "TETO" | "PADRAO";

function isTipoArredondamento(value: string): value is TipoArredondamento {
  return value === "PISO" || value === "TETO" || value === "PADRAO";
}

interface Configuracao {
  id: string;
  valorPorPonto: string;
  tipoArredondamento: TipoArredondamento;
  vigenteDesde: string;
  vigenteAte?: string;
  vigente: boolean;
}

export function ConfiguracaoBonus() {
  const [isLoading, setIsLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [valorPorPonto, setValorPorPonto] = useState("");
  const [tipoArredondamento, setTipoArredondamento] = useState<"PISO" | "TETO" | "PADRAO">("PADRAO");
  const [configs, setConfigs] = useState<Configuracao[]>([]);

  const configVigente = configs.find((c) => c.vigente);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/v1/backoffice/configuracoes/bonus");
        if (res.ok) {
          const body = await res.json();
          setConfigs(body.configuracao ?? []);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações de bônus:", err);
      } finally {
        setCarregando(false);
      }
    }

    void carregar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = configVigente
        ? `/api/v1/backoffice/configuracoes/bonus?id=${configVigente.id}`
        : "/api/v1/backoffice/configuracoes/bonus";

      const method = configVigente ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorPorPonto: parseFloat(valorPorPonto), tipoArredondamento }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || result.error || "Erro ao salvar configuração de bônus");
      }

      toast.success(configVigente ? "Configuração de bônus atualizada!" : "Configuração de bônus criada!");
      setValorPorPonto("");
      const updated = await fetch("/api/v1/backoffice/configuracoes/bonus");
      if (updated.ok) {
        const body = await updated.json();
        setConfigs(body.configuracao ?? []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar configuração de bônus";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {carregando ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {configVigente && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-800">Conversão de Produção em Bônus vigente</p>
              <p className="mt-1 text-sm text-green-700">
                R$ {parseFloat(configVigente.valorPorPonto).toFixed(2)} por ponto de bônus
                <span className="mx-2 text-green-400">·</span>
                Arredondamento: {configVigente.tipoArredondamento}
              </p>
              <p className="mt-1 text-xs text-green-600">
                Desde {new Date(configVigente.vigenteDesde).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {configVigente ? "Editar Configuração Vigente" : "Nova Configuração de Bônus"}
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="valorPorPonto" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor em Reais (R$) por ponto de bônus
                </label>
                <input
                  id="valorPorPonto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorPorPonto}
                  onChange={(e) => setValorPorPonto(e.target.value)}
                  placeholder="Ex: 0.50 (R$ 0,50 = 1 ponto de bônus)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Defina quanto de produção o consultor PF precisa gerar para ganhar 1 ponto de bônus
                </p>
              </div>

              <div>
                <label htmlFor="tipoArredondamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de arredondamento
                </label>
                <select
                  id="tipoArredondamento"
                  value={tipoArredondamento}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isTipoArredondamento(value)) setTipoArredondamento(value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="PADRAO">Padrão (arredonda normal)</option>
                  <option value="PISO">Piso (sempre para baixo)</option>
                  <option value="TETO">Teto (sempre para cima)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Como tratar casas decimais no cálculo de pontos de bônus
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !valorPorPonto}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Salvando..." : configVigente ? "Atualizar Configuração" : "Criar Configuração"}
            </button>
          </form>

          {configs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Configurações</h3>
              <div className="space-y-3">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className={`border p-4 rounded-lg ${config.vigente ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${config.vigente ? "text-green-700" : "text-gray-500"}`}>
                          {config.vigente ? "● Vigente" : "○ Encerrada"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(config.vigenteDesde).toLocaleDateString("pt-BR")}
                        {config.vigenteAte && ` a ${new Date(config.vigenteAte).toLocaleDateString("pt-BR")}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-gray-500">Valor por ponto de bônus</p>
                        <p className="font-medium text-gray-900">R$ {parseFloat(config.valorPorPonto).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Arredondamento</p>
                        <p className="font-medium text-gray-900">{config.tipoArredondamento}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
