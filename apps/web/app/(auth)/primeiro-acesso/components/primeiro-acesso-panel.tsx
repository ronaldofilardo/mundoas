export function PrimeiroAcessoPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col justify-between p-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow">
          <span className="text-primary-600 font-black text-sm">AS</span>
        </div>
        <div>
          <span className="text-white font-bold text-lg">Acesso Saúde</span>
          <span className="text-primary-200 text-sm ml-1">Aqui</span>
        </div>
      </div>

      <div>
        <h2 className="text-white text-4xl font-bold leading-tight mb-4">
          Primeiro Acesso
          <br />
          Configure sua senha
        </h2>
        <p className="text-primary-100 text-lg leading-relaxed">
          Para sua segurança, altere a senha temporária (CPF)
          <br />
          por uma senha pessoal e segura.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white"></div>
        <div className="w-2 h-2 rounded-full bg-primary-300"></div>
        <div className="w-2 h-2 rounded-full bg-primary-300"></div>
      </div>
    </div>
  );
}