import type { Usuario, UsuarioForm } from "../types";
import { EditFormField } from "./edit-form-fields";

interface BackofficeFieldsProps {
  usuario: Usuario;
  form: UsuarioForm;
  onFieldChange: (field: keyof UsuarioForm, value: string) => void;
}

export function BackofficeFields({
  usuario,
  form,
  onFieldChange,
}: BackofficeFieldsProps) {
  return (
    <>
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Dados da Unidade
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <EditFormField
            id="edit-razao-social"
            label="Razão Social"
            value={form.razaoSocial}
            onChange={(v) => onFieldChange("razaoSocial", v)}
          />
          <EditFormField
            id="edit-cnpj"
            label="CNPJ"
            value={form.cnpj}
            onChange={(v) => onFieldChange("cnpj", v)}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Endereço</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <EditFormField
              id="edit-logradouro"
              label="Logradouro"
              value={form.logradouro}
              onChange={(v) => onFieldChange("logradouro", v)}
            />
          </div>
          <EditFormField
            id="edit-numero"
            label="Número"
            value={form.numero}
            onChange={(v) => onFieldChange("numero", v)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <EditFormField
            id="edit-complemento"
            label="Complemento"
            value={form.complemento}
            onChange={(v) => onFieldChange("complemento", v)}
          />
          <EditFormField
            id="edit-bairro"
            label="Bairro"
            value={form.bairro}
            onChange={(v) => onFieldChange("bairro", v)}
          />
          <EditFormField
            id="edit-cep"
            label="CEP"
            value={form.cep}
            onChange={(v) => onFieldChange("cep", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <EditFormField
            id="edit-cidade"
            label="Cidade"
            value={form.cidade}
            onChange={(v) => onFieldChange("cidade", v)}
          />
          <EditFormField
            id="edit-uf"
            label="UF"
            value={form.uf}
            maxLength={2}
            uppercase
            onChange={(v) => onFieldChange("uf", v)}
          />
        </div>
      </div>
    </>
  );
}