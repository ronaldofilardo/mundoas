import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useComerciais } from "../../usuarios/comerciais/hooks/use-comerciais";
import type { Comercial, Meta, RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { formatarMoeda, parseMoeda } from "../../usuarios/comerciais/utils";

const mesesAno = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

export interface MetasState {
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
  metasGerais: Record<string, Meta[]>;
  loadingMetasGerais: boolean;
  metaVersion: number;
  metasInputs: Record<string, Record<string, string>>;
  metasAlteradas: Set<string>;
  producaoInputs: Record<string, Record<string, string>>;
  producaoAlteradas: Set<string>;
  comissaoInputs: Record<string, Record<string, string>>;
  comissaoAlteradas: Set<string>;
  comerciais: Comercial[];
}

export interface MetasSetters {
  setRegrasComerciais: (v: RegrasComerciais | null) => void;
  setRegrasGestores: (v: RegrasGestores | null) => void;
  setMetasGerais: (v: Record<string, Meta[]>) => void;
  setLoadingMetasGerais: (v: boolean) => void;
  setMetaVersion: (v: number | ((prev: number) => number)) => void;
  setMetasInputs: (v: Record<string, Record<string, string>> | ((prev: Record<string, Record<string, string>>) => Record<string, Record<string, string>>)) => void;
  setMetasAlteradas: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setProducaoInputs: (v: Record<string, Record<string, string>> | ((prev: Record<string, Record<string, string>>) => Record<string, Record<string, string>>)) => void;
  setProducaoAlteradas: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setComissaoInputs: (v: Record<string, Record<string, string>> | ((prev: Record<string, Record<string, string>>) => Record<string, Record<string, string>>)) => void;
  setComissaoAlteradas: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

export function useComerciaisMetas() {
  const { comerciais, refetch: refetchComerciais, setComerciais } = useComerciais();
  const [regrasComerciais, setRegrasComerciais] = useState<RegrasComerciais | null>(null);
  const [regrasGestores, setRegrasGestores] = useState<RegrasGestores | null>(null);
  const [metasGerais, setMetasGerais] = useState<Record<string, Meta[]>>({});
  const [loadingMetasGerais, setLoadingMetasGerais] = useState(false);
  const [metaVersion, setMetaVersion] = useState(0);
  const [metasInputs, setMetasInputs] = useState<Record<string, Record<string, string>> >({});
  const [metasAlteradas, setMetasAlteradas] = useState<Set<string>>(new Set());
  const [producaoInputs, setProducaoInputs] = useState<Record<string, Record<string, string>> >({});
  const [producaoAlteradas, setProducaoAlteradas] = useState<Set<string>>(new Set());
  const [comissaoInputs, setComissaoInputs] = useState<Record<string, Record<string, string>> >({});
  const [comissaoAlteradas, setComissaoAlteradas] = useState<Set<string>>(new Set());

  const setters: MetasSetters = {
    setRegrasComerciais,
    setRegrasGestores,
    setMetasGerais,
    setLoadingMetasGerais,
    setMetaVersion,
    setMetasInputs,
    setMetasAlteradas,
    setProducaoInputs,
    setProducaoAlteradas,
    setComissaoInputs,
    setComissaoAlteradas,
  };

  function markAltered(setter: (fn: (prev: Set<string>) => Set<string>) => void, key: string) {
    setter((prev) => {
      const nova = new Set(prev);
      nova.add(key);
      return nova;
    });
  }

  return {
    state: {
      regrasComerciais,
      regrasGestores,
      metasGerais,
      loadingMetasGerais,
      metaVersion,
      metasInputs,
      metasAlteradas,
      producaoInputs,
      producaoAlteradas,
      comissaoInputs,
      comissaoAlteradas,
      comerciais,
      mesesAno,
    } as const,
    setters,
    markAltered,
    refetchComerciais,
    setComerciais,
  };
}
