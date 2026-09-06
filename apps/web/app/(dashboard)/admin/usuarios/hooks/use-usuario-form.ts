"use client";

import { useState } from "react";
import type { Usuario, UsuarioForm } from "../types";

const emptyForm: UsuarioForm = {
  nome: "",
  email: "",
  telefone: "",
  razaoSocial: "",
  cnpj: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  percentualComissaoDefault: "",
  percentualComissaoMax: "",
};

export function useUsuarioForm() {
  const [form, setForm] = useState<UsuarioForm>(emptyForm);

  const fillFrom = (usuario: Usuario) => {
    setForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      telefone: usuario.telefone || "",
      razaoSocial: usuario.razaoSocial || "",
      cnpj: usuario.cnpj || "",
      cep: usuario.cep || "",
      logradouro: usuario.logradouro || "",
      numero: usuario.numero || "",
      complemento: usuario.complemento || "",
      bairro: usuario.bairro || "",
      cidade: usuario.cidade || "",
      uf: usuario.uf || "",
      percentualComissaoDefault:
        usuario.percentualComissaoDefault?.toString() || "",
      percentualComissaoMax: usuario.percentualComissaoMax?.toString() || "",
    });
  };

  const setField = (field: keyof UsuarioForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => setForm(emptyForm);

  return { form, fillFrom, setField, reset };
}