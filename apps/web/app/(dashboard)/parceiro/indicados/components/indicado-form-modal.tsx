"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { formatCpf } from "@/app/(dashboard)/parceiro/indicados/utils";
import type { Indicado } from "@/app/(dashboard)/parceiro/indicados/types";

export interface IndicadoFormModalProps {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  form: { nome: string; cpf: string; telefone: string };
  setForm: (v: { nome: string; cpf: string; telefone: string }) => void;
  cpfValidation: "valid" | "invalid" | "";
  validateCpfRealTime: (cpf: string) => void;
  saving: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function IndicadoFormModal({
  showModal,
  setShowModal,
  form,
  setForm,
  cpfValidation,
  validateCpfRealTime,
  saving,
  handleSubmit,
}: IndicadoFormModalProps) {
  const cpfTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Cadastrar Cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nome">
              Nome Completo
            </label>
            <input
              id="nome"
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cpf">
              CPF
            </label>
             <input
               id="cpf"
               type="text"
               required
               maxLength={14}
               value={form.cpf}
               onChange={(e) => {
                 const v = e.target.value.replace(/\D/g, "");
                 const masked =
                   v.length > 9
                     ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
                     : v.length > 6
                       ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`
                       : v.length > 3
                         ? `${v.slice(0, 3)}.${v.slice(3)}`
                         : v;
                 setForm({ ...form, cpf: masked });

                 // Validate CPF in real-time
                 if (v.length === 11) {
                   if (cpfTimeoutRef.current) {
                     clearTimeout(cpfTimeoutRef.current);
                   }
                   // eslint-disable-next-line react-hooks/exhaustive-deps
                   setTimeout(() => {
                     validateCpfRealTime(masked);
                   }, 500);
                 }
               }}
               placeholder="000.000.000-00"
               className={`w-full px-3 py-2 border rounded-lg text-sm focus-ring ${
                 cpfValidation === "invalid" ? "border-red-500" : cpfValidation === "valid" ? "border-green-500" : ""
               }`}
             />
          </div>
          {cpfValidation === "invalid" && (
            <p className="text-xs text-red-600 mt-1">
              CPF inválido ou não disponível
            </p>
          )}
          {cpfValidation === "valid" && (
            <p className="text-xs text-green-600 mt-1">
              ✓ CPF disponível
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefone">
              Telefone (opcional)
            </label>
            <input
              id="telefone"
              type="text"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 border rounded-lg text-sm focus-ring"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || cpfValidation === "invalid" || !form.cpf || cpfValidation !== "valid"}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}