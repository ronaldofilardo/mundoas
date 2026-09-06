"use client";

import { useComerciaisMetas } from "../hooks/use-comerciais-metas";
import { useFetchMetas } from "../hooks/use-fetch-metas";
import { useChangeMetas } from "../hooks/use-change-metas";
import { useSalvarTodasMetas } from "../hooks/use-salvar-metas";
import { useComerciaisAcoes } from "../hooks/use-comerciais-acao";
import { ComerciaisTable } from "./comerciais-table";
import { NovoComercialForm } from "../../usuarios/comerciais/components/novo-comercial-form";
import { ComercialModal } from "../../usuarios/comerciais/components/comercial-modal";

export function TabComerciais() {
  const metaHook = useComerciaisMetas();
  const { state: metaState, setters, markAltered, refetchComerciais, setComerciais } = metaHook;
  const fetchHandlers = useFetchMetas(metaState, setters);
  const changeHandlers = useChangeMetas({
    comerciais: metaState.comerciais,
    regrasComerciais: metaState.regrasComerciais,
    regrasGestores: metaState.regrasGestores,
    setters,
    fetchMetasGerais: fetchHandlers.fetchMetasGerais,
    markAltered,
  });
  const { handleSalvarTodasMetas } = useSalvarTodasMetas({
    metasInputs: metaState.metasInputs,
    metasAlteradas: metaState.metasAlteradas,
    producaoInputs: metaState.producaoInputs,
    producaoAlteradas: metaState.producaoAlteradas,
    comissaoAlteradas: metaState.comissaoAlteradas,
    comerciais: metaState.comerciais,
    regrasComerciais: metaState.regrasComerciais,
    regrasGestores: metaState.regrasGestores,
    setMetasAlteradas: setters.setMetasAlteradas,
    setProducaoAlteradas: setters.setProducaoAlteradas,
    setComissaoAlteradas: setters.setComissaoAlteradas,
    fetchRegrasGerais: fetchHandlers.fetchRegrasGerais,
  });
  const acoes = useComerciaisAcoes({
    comerciais: metaState.comerciais,
    refetchComerciais,
    setComerciais,
  });

  const totalAlteradas = metaState.metasAlteradas.size + metaState.producaoAlteradas.size;

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        <NovoComercialForm onCreated={refetchComerciais} />
      </div>

      <div className="card mt-6 flex-grow overflow-hidden">
        <div className="flex justify-end items-center mb-4">
          <button
            onClick={handleSalvarTodasMetas}
            disabled={totalAlteradas === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              totalAlteradas > 0
                ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            💾 Salvar ({totalAlteradas})
          </button>
        </div>
        <ComerciaisTable
          comerciais={metaState.comerciais}
          metaVersion={metaState.metaVersion}
          metasInputs={metaState.metasInputs}
          producaoInputs={metaState.producaoInputs}
          comissaoInputs={metaState.comissaoInputs}
          metasAlteradas={metaState.metasAlteradas}
          producaoAlteradas={metaState.producaoAlteradas}
          regrasComerciais={metaState.regrasComerciais}
          regrasGestores={metaState.regrasGestores}
          onEditar={acoes.handleEditarComercial}
          onDeletar={acoes.handleDeletarComercial}
          onChangeMeta={changeHandlers.handleChangeMeta}
          onChangeProducao={changeHandlers.handleChangeProducao}
          onSalvarMeta={changeHandlers.handleSalvarMetaGeral}
          onSalvarProducao={changeHandlers.handleSalvarProducaoGeral}
          loadingMetasGerais={metaState.loadingMetasGerais}
        />
      </div>

      {acoes.showModal && acoes.comercialEditando && (
        <ComercialModal
          comercial={acoes.comercialEditando}
          onSave={acoes.handleSalvarEdicao}
          onClose={() => {
            acoes.setShowModal(false);
            acoes.setComercialEditando(null);
          }}
        />
      )}
    </div>
  );
}
