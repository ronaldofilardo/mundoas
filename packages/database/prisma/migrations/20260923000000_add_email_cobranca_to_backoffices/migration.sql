-- Email de cobrança da unidade (avisos Asaas). NULL = usa o email de acesso (Usuario.email).
ALTER TABLE public.backoffices ADD COLUMN IF NOT EXISTS email_cobranca varchar(255);
