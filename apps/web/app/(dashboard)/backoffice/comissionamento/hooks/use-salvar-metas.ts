import { useCallback } from "react";
import { toast } from "sonner";
import type { Comercial, Meta, RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { parseMoeda } from "../../usuarios/comerciais/utils";
import { calcularValorComissaoNum, getComissaoFromFuncao } from "@/lib/comissao-calculo";

export interface SalvarMetasDeps {
  metasInputs: Record<string, Record<string, string>>;
  metasAlteradas: Set<string>;
  producaoInputs: Record<string, Record<string, string>>;
  producaoAlteradas: Set<string>;
  comissaoAlteradas: Set<string>;
  comerciais: Comercial[];
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
  setMetasAlteradas: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setProducaoAlteradas: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setComissaoAlteradas: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  fetchRegrasGerais: () => Promise<void>;
}

export function useSalvarTodasMetas(deps: SalvarMetasDeps) {
  const {
    metasInputs,
    metasAlteradas,
    producaoInputs,
    producaoAlteradas,
    comissaoAlteradas,
    comerciais,
    regrasComerciais,
    regrasGestores,
    setMetasAlteradas,
    setProducaoAlteradas,
    setComissaoAlteradas,
    fetchRegrasGerais,
  } = deps;

  const handleSalvarTodasMetas = useCallback(async () => {
    const metasParaSalvar: Array<{ comercialId: string; mes: string; valor: string }> = [];
    metasAlteradas.forEach((key) => {
      const [comercialId, mes] = key.split("|");
      const valor = metasInputs[comercialId]?.[mes];
      if (valor) {
        metasParaSalvar.push({ comercialId, mes, valor });
      }
    });

    const producoesParaSalvar: Array<{ comercialId: string; mes: string; valor: string }> = [];
    producaoAlteradas.forEach((key) => {
      const [comercialId, mes] = key.split("|");
      const valor = producaoInputs[comercialId]?.[mes];
      if (valor) {
        producoesParaSalvar.push({ comercialId, mes, valor });
      }
    });

    type Registro = { comercialId: string; mes: string; valorMeta?: string; valorAtingido?: string; valorComissao?: number };
    const registros = new Map<string, Registro>();
    metasParaSalvar.forEach(({ comercialId, mes, valor }) => {
      const key = `${comercialId}|${mes}`;
      registros.set(key, { ...(registros.get(key) || { comercialId, mes }), valorMeta: valor });
    });
    producoesParaSalvar.forEach(({ comercialId, mes, valor }) => {
      const key = `${comercialId}|${mes}`;
      const comercial = comerciais.find((c) => c.id === comercialId);
      const percentualRegra = getComissaoFromFuncao({ regrasComerciais, regrasGestores }, comercial?.funcao);
      const valorComissaoCalc = calcularValorComissaoNum(valor, percentualRegra);
      registros.set(key, {
        ...(registros.get(key) || { comercialId, mes }),
        valorAtingido: valor,
        valorComissao: valorComissaoCalc,
      });
    });

    if (registros.size === 0) {
      toast.info("Nenhuma meta ou produção para salvar");
      return;
    }

    try {
      let salvos = 0;
      let erros = 0;

      await Promise.all(
        Array.from(registros.values()).map(async ({ comercialId, mes, valorMeta, valorAtingido, valorComissao }) => {
          if (valorMeta !== undefined) {
            const valorNumerico = parseMoeda(valorMeta);
            const num = parseFloat(valorNumerico);
            if (isNaN(num) || num < 0) {
              erros++;
              return;
            }
          }
          if (valorAtingido !== undefined) {
            const valorNumerico = parseMoeda(valorAtingido);
            const num = parseFloat(valorNumerico);
            if (isNaN(num) || num < 0) {
              erros++;
              return;
            }
          }

          try {
            const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mesReferencia: mes,
                ...(valorMeta !== undefined ? { valorMeta: parseFloat(parseMoeda(valorMeta)) } : {}),
                ...(valorAtingido !== undefined ? { valorAtingido: parseFloat(parseMoeda(valorAtingido)) } : {}),
                ...(valorComissao !== undefined ? { valorComissao } : {}),
              }),
            });

            if (res.ok) {
              salvos++;
            } else {
              erros++;
            }
          } catch {
            erros++;
          }
        })
      );

      if (erros === 0) {
        toast.success(`${salvos} registro(s) salvo(s) com sucesso!`);
      } else {
        toast.warning(`${salvos} salvos, ${erros} com erro`);
      }

      setMetasAlteradas(new Set<string>());
      setProducaoAlteradas(new Set<string>());
      setComissaoAlteradas(new Set<string>());
      await fetchRegrasGerais();
    } catch {
      toast.error("Erro ao salvar metas");
    }
  }, [
    metasInputs,
    metasAlteradas,
    producaoInputs,
    producaoAlteradas,
    comissaoAlteradas,
    comerciais,
    regrasComerciais,
    regrasGestores,
    setMetasAlteradas,
    setProducaoAlteradas,
    setComissaoAlteradas,
    fetchRegrasGerais,
  ]);

  return { handleSalvarTodasMetas };
}
