export default function AcessoSuspensoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white border rounded-lg p-8 text-center space-y-3">
        <div className="text-4xl">⛔</div>
        <h1 className="text-xl font-bold text-gray-900">Acesso suspenso</h1>
        <p className="text-sm text-gray-500">
          O acesso desta unidade está temporariamente suspenso. Entre em
          contato com o financeiro para regularizar a situação.
        </p>
      </div>
    </div>
  );
}
