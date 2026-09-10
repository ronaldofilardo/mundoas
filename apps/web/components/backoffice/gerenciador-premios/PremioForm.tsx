"use client";

export function PremioForm({
  formData,
  setFormData,
  editandoId,
  setEditandoId,
  setShowForm,
  onSubmit,
}: {
  formData: {
    nome: string;
    descricao: string;
    custoPontos: string;
    imagemUrl: string;
  };
  setFormData: (value: {
    nome: string;
    descricao: string;
    custoPontos: string;
    imagemUrl: string;
  }) => void;
  editandoId: string | null;
  setEditandoId: (value: string | null) => void;
  setShowForm: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome
        </label>
        <input
          type="text"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Notebook Dell XPS 13"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.descricao}
          onChange={(e) =>
            setFormData({ ...formData, descricao: e.target.value })
          }
          placeholder="Descrição detalhada do prêmio..."
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custo em Pontos
          </label>
          <input
            type="number"
            value={formData.custoPontos}
            onChange={(e) =>
              setFormData({ ...formData, custoPontos: e.target.value })
            }
            placeholder="Ex: 5000"
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL da Imagem
          </label>
          <input
            type="url"
            value={formData.imagemUrl}
            onChange={(e) =>
              setFormData({ ...formData, imagemUrl: e.target.value })
            }
            placeholder="https://exemplo.com/imagem.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          {editandoId ? "Atualizar" : "Criar"} Prêmio
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setEditandoId(null);
            setFormData({
              nome: "",
              descricao: "",
              custoPontos: "",
              imagemUrl: "",
            });
          }}
          className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
