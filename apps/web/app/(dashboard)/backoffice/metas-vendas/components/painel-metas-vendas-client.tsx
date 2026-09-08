"use client";

import { CardSetor } from "./card-setor";
import { BarraProgresso } from "./barra-progresso";
import { useMetasVendas } from "@/util/use-metavendas";
import { formatarMoeda } from "@/util/format-moeda";

export function PainelMetasVendasClient() {
  const {
    ano,
    setAno,
    mesSelecionado,
    setMesSelecionado,
    modo,
    setModo,
    filtroSetor,
    setFiltroSetor,
    sort,
    setSort,
    diasUteis,
    setDiasUteis,
    busca,
    setBusca,
    data,
    loading,
    carregar,
    MESES,
    ANOS_DISPONIVEIS,
    ORDENACOES,
    setoresFiltrados,
    destaques,
  } = useMetasVendas();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setModo("anual")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            modo === "anual"
              ? "bg-orange-500 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Anual
        </button>
        <button
          type="button"
          onClick={() => setModo("mensal")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            modo === "mensal"
              ? "bg-orange-500 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Mensal
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MESES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => {
              setMesSelecionado(m.value);
              setModo("mensal");
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              modo === "mensal" && mesSelecionado === m.value
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {m.label}/{String(ano).slice(2)}
          </button>
        ))}
        <select
          aria-label="Ano de referência"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="ml-2 px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700"
        >
          {ANOS_DISPONIVEIS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="filtro-setor" className="block text-xs font-semibold text-gray-700 mb-1">
              Filtrar por Setor:
            </label>
            <select
              id="filtro-setor"
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="TODOS">Todos os Setores</option>
              {(data?.setores ?? []).map((s) => (
                <option key={s.setorId} value={s.setorId}>
                  {s.setorNome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ordenacao" className="block text-xs font-semibold text-gray-700 mb-1">
              Ordenar por:
            </label>
            <select
              id="ordenacao"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {ORDENACOES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dias-uteis" className="block text-xs font-semibold text-gray-700 mb-1">
              Dias Úteis do Mês:
            </label>
            <input
              id="dias-uteis"
              type="number"
              min={1}
              max={31}
              value={diasUteis}
              onChange={(e) =>
                setDiasUteis(Math.max(1, Math.min(31, Number(e.target.value) || 0)))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label htmlFor="busca" className="block text-xs font-semibold text-gray-700 mb-1">
              Buscar consultor:
            </label>
            <input
              id="busca"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome do consultor…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : !data || data.setores.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">
            Nenhum consultor PF com Setor cadastrado para {ano}.
          </p>
        </div>
      ) : (
        <>
          {destaques.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Destaques do ano
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {destaques.map((c) => (
                  <div
                    key={c.consultorPfId}
                    className="bg-emerald-50 rounded-xl border border-emerald-200 px-4 py-3"
                  >
                    <div className="grid grid-cols-12 items-center gap-3">
                      <div className="col-span-12 md:col-span-4">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {c.nome}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{c.cpf}</p>
                      </div>
                      <div className="col-span-4 md:col-span-2 text-right">
                        <p className="text-xs text-gray-500">Meta Anual</p>
                        <p className="text-sm font-medium text-gray-700 font-mono">
                          R$ {formatarMoeda(c.metaAnual)}
                        </p>
                      </div>
                      <div className="col-span-4 md:col-span-2 text-right">
                        <p className="text-xs text-gray-500">Realizado Anual</p>
                        <p className="text-sm font-medium text-gray-700 font-mono">
                          R$ {formatarMoeda(c.realizadoAnual)}
                        </p>
                      </div>
                      <div className="col-span-4 md:col-span-3">
                        <BarraProgresso atingimento={c.atingimento} />
                      </div>
                      <div className="col-span-12 md:col-span-1 md:text-right">
                        <span className="text-sm font-bold text-emerald-700 font-mono">
                          {c.atingimento.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-emerald-800">
                      Bateu meta em {c.mesesBatidos}{" "}
                      {c.mesesBatidos === 1 ? "mês" : "meses"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-4">
            {setoresFiltrados.map((s) => (
              <CardSetor
                key={s.setorId}
                setorId={s.setorId}
                setorNome={s.setorNome}
                consultores={s.consultores}
                modo={modo}
                mesSelecionado={modo === "mensal" ? mesSelecionado : null}
                sort={sort}
                busca={busca}
                ano={ano}
                onMetaSaved={() => carregar()}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}