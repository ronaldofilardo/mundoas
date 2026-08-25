-- Revisão obrigatória antes da aplicação.
-- Esta migration remove definitivamente as tabelas legadas autorizadas:
-- estabelecimentos, usuarios_estabelecimento(s), documentos,
-- cupons_config, cupons_importados e consultas.
-- Não executar automaticamente neste pacote de patch.

BEGIN;

DROP TABLE IF EXISTS
  "consultas",
  "cupons_importados",
  "cupons_config",
  "documentos",
  "usuarios_estabelecimento",
  "usuarios_estabelecimentos",
  "estabelecimentos"
CASCADE;

-- Os tipos abaixo só são removidos se não houver nenhuma tabela restante usando-os.
DROP TYPE IF EXISTS "TipoDocumento";
DROP TYPE IF EXISTS "StatusCupom";
DROP TYPE IF EXISTS "StatusCupomImportado";
DROP TYPE IF EXISTS "StatusConsulta";

COMMIT;
