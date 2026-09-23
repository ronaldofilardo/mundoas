"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatarDataHora } from "@/util/format-data";
import {
  TERMO_USO_PLATAFORMA,
  POLITICA_PRIVACIDADE_LGPD,
  AUTORIZACAO_DEBITO_RECORRENTE,
} from "@/lib/legal/mundoas-termos";
import {
  baixarDocumentoTermoPdf,
  type DocumentoTermoPdf,
} from "@/lib/billing/pdf-termos";
import type { AssinaturaData } from "../page";

const DOCUMENTOS: DocumentoTermoPdf[] = [
  {
    key: "uso",
    titulo: "Termos de Uso da Plataforma mundoAS",
    texto: TERMO_USO_PLATAFORMA,
  },
  {
    key: "privacidade",
    titulo: "Política de Privacidade e Tratamento de Dados (LGPD)",
    texto: POLITICA_PRIVACIDADE_LGPD,
  },
  {
    key: "debito",
    titulo: "Autorização de Débito Recorrente",
    texto: AUTORIZACAO_DEBITO_RECORRENTE,
  },
];

interface TabContaProps {
  data: AssinaturaData;
}

export function TabConta({ data }: TabContaProps) {
  const [baixando, setBaixando] = useState<string | null>(null);
  const conta = data.backoffice;
  const aceito = Boolean(data.termosAceitosEm);

  async function baixar(doc: DocumentoTermoPdf) {
    if (!conta) {
      toast.error("Dados da conta indisponíveis");
      return;
    }
    setBaixando(doc.key);
    try {
      await baixarDocumentoTermoPdf(doc, {
        unidade: { nome: conta.nome, cpf: conta.cpf },
        aceitoEm: data.termosAceitosEm,
        versao: data.termosVersao,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar documento");
    } finally {
      setBaixando(null);
    }
  }

  if (!conta) {
    return (
      <div className="card text-sm text-gray-500">
        Dados de cadastro indisponíveis no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Dados da conta</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Unidade</dt>
            <dd className="text-gray-900">{conta.nome}</dd>
          </div>
          {conta.razaoSocial && (
            <div>
              <dt className="text-xs text-gray-500">Razão social</dt>
              <dd className="text-gray-900">{conta.razaoSocial}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-500">CPF</dt>
            <dd className="text-gray-900">{conta.cpf}</dd>
          </div>
          {conta.cnpj && (
            <div>
              <dt className="text-xs text-gray-500">CNPJ</dt>
              <dd className="text-gray-900">{conta.cnpj}</dd>
            </div>
          )}
          {conta.telefone && (
            <div>
              <dt className="text-xs text-gray-500">Telefone</dt>
              <dd className="text-gray-900">{conta.telefone}</dd>
            </div>
          )}
          {conta.email && (
            <div>
              <dt className="text-xs text-gray-500">E-mail de acesso</dt>
              <dd className="text-gray-900">{conta.email}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-500">E-mail para cobrança</dt>
            <dd className="text-gray-900">
              {conta.emailCobranca || conta.email || "—"}
              {!conta.emailCobranca && conta.email && (
                <span className="text-gray-400"> (usa o e-mail de acesso)</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="border-t border-gray-100 pt-3 text-xs text-gray-600">
          {aceito ? (
            <>
              Documentos de onboarding aceitos em{" "}
              <strong>{formatarDataHora(data.termosAceitosEm)}</strong>
              {data.termosVersao ? ` (versão ${data.termosVersao})` : null}.
            </>
          ) : (
            <span className="text-amber-700">
              Documentos de onboarding ainda não aceitos.
            </span>
          )}
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Documentos do onboarding
        </h2>
        <p className="text-xs text-gray-500">
          Baixe em PDF os três documentos aceitos, com data e hora do aceite
          global e dados da emitente BE SMART.
        </p>
        <div className="flex flex-wrap gap-2">
          {DOCUMENTOS.map((doc) => (
            <button
              key={doc.key}
              type="button"
              disabled={!aceito || baixando !== null}
              onClick={() => {
                void baixar(doc);
              }}
              className="text-xs font-medium px-3 py-2 rounded border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {baixando === doc.key
                ? "Gerando…"
                : `⬇ ${doc.titulo}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
