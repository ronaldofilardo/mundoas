import { LinhaConsultor } from "./linha-consultor";
import { aplicarOrdenacao, filtrarPorNome } from "./ordenacao";
import type {
  ConsultorResumo,
  ModoVisualizacao,
  SortKey,
} from "./types";

export { aplicarOrdenacao };

export function CardSetor({
  setorId,
  setorNome,
  consultores,
  modo,
  mesSelecionado,
  sort,
  busca,
  ano,
  onMetaSaved,
}: {
  setorId: string;
  setorNome: string;
  consultores: ConsultorResumo[];
  modo: ModoVisualizacao;
  mesSelecionado: string | null;
  sort: SortKey;
  busca: string;
  ano: number;
  onMetaSaved?: () => void;
}) {
  const filtrados = filtrarPorNome(consultores, busca);
  const ordenados = aplicarOrdenacao(filtrados, sort);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">
          {setorNome}{" "}
          <span className="text-gray-500 font-normal">
            ({ordenados.length})
          </span>
        </h2>
      </header>
      {ordenados.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          {busca
            ? "Nenhum consultor encontrado para a busca."
            : "Nenhum consultor neste setor."}
        </p>
      ) : (
        <div>
          {ordenados.map((c) => (
            <LinhaConsultor
              key={c.consultorPfId}
              consultor={c}
              modo={modo}
              mesSelecionado={mesSelecionado}
              setorId={setorId}
              ano={ano}
              onMetaSaved={onMetaSaved}
            />
          ))}
        </div>
      )}
    </section>
  );
}
