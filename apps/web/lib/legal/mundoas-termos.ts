// Textos jurídicos do onboarding mundoAS (Etapa 2 do Plano de Implementação).
//
// IMPORTANTE: esta é uma minuta gerada para viabilizar o fluxo de produto.
// Não substitui revisão por advogado antes de entrar em produção — em
// especial os pontos de isenção de responsabilidade, cláusulas de
// cancelamento e a autorização de débito recorrente, que têm implicações
// contratuais e regulatórias (Bacen/arranjos de pagamento) reais.
//
// Sempre que o texto de qualquer um dos 3 documentos mudar de forma
// materialmente relevante, incremente TERMOS_VERSAO — o valor aceito fica
// gravado em `assinaturas.termos_versao` para rastreabilidade histórica de
// qual versão cada unidade aceitou.

export const TERMOS_VERSAO = "2026-09-02-v1";

const CONTRATANTE = {
  razaoSocial: "BE SMART LTDA",
  cnpj: "55.405.487/0001-84",
  sede: "Curitiba/PR",
  representante: "Ronaldo Domingues Filardo",
  representanteCpf: "875.457.729-20",
  representanteEndereco: "Av. República Argentina, 2773, ap 44 bl A, Curitiba/PR",
} as const;

export const PLANOS = {
  MENSAL: { label: "Mensal", valor: 350, valorFormatado: "R$ 350,00/mês" },
  ANUAL: { label: "Anual", valor: 3500, valorFormatado: "R$ 3.500,00/ano (2 meses grátis)" },
} as const;

export const DIA_VENCIMENTO = 15;

export const TERMO_USO_PLATAFORMA = `TERMOS DE USO DA PLATAFORMA MUNDOAS

CONTRATANTE (Licenciante): ${CONTRATANTE.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ nº ${CONTRATANTE.cnpj}, com sede em ${CONTRATANTE.sede}, doravante denominada "mundoAS", neste ato representada por seu representante legal ${CONTRATANTE.representante}, inscrito no CPF sob o nº ${CONTRATANTE.representanteCpf}.

CONTRATADA (Licenciada): a unidade/franquia identificada no cadastro da plataforma, doravante denominada "Unidade" ou "Backoffice".

1. OBJETO
1.1. O presente instrumento regula a licença de uso, por prazo determinado e mediante remuneração periódica, da plataforma de software mundoAS, destinada à gestão de pontos, metas e comissões da Unidade.
1.2. O mundoAS fornece exclusivamente a infraestrutura tecnológica da plataforma. O mundoAS não define, não gerencia, não audita e não interfere nas regras de negócio, metas, comissões, pontuações ou políticas comerciais configuradas pela Unidade — essas são de responsabilidade exclusiva da Unidade e de sua rede interna (incluindo, quando aplicável, sua matriz ou grupo franqueador).

2. ESCOPO DA LICENÇA
2.1. Acesso às funcionalidades disponibilizadas no plano contratado.
2.2. Atualizações de sistema, correções e melhorias, aplicadas de forma contínua, sem custo adicional além da mensalidade/anuidade.
2.3. Armazenamento dos dados inseridos pela Unidade em ambiente de nuvem, com os cuidados de segurança descritos na Política de Privacidade (documento apartado).
2.4. Suporte técnico relativo ao funcionamento da plataforma (disponibilidade, bugs, dúvidas de uso). Não inclui consultoria sobre regras de negócio, comissionamento ou gestão comercial da Unidade.

3. ISENÇÃO DE RESPONSABILIDADE SOBRE REGRAS DE NEGÓCIO
3.1. O mundoAS é neutro quanto ao conteúdo configurado pela Unidade na plataforma: fórmulas de pontuação, metas, percentuais de comissão, políticas de premiação e critérios afins são de exclusiva responsabilidade de quem os configura.
3.2. Eventuais disputas entre a Unidade e terceiros (consultores, parceiros, colaboradores) decorrentes dessas regras de negócio não envolvem o mundoAS e não geram responsabilidade para o mundoAS.

4. OBRIGAÇÕES DA UNIDADE
4.1. Utilizar a plataforma em conformidade com a legislação aplicável.
4.2. Manter sigilo sobre suas credenciais de acesso.
4.3. Fornecer informações verdadeiras no cadastro.
4.4. Efetuar o pagamento da mensalidade/anuidade nos termos da Autorização de Débito Recorrente (documento apartado).

5. VIGÊNCIA E CANCELAMENTO
5.1. A licença vigora por prazo indeterminado, renovando-se automaticamente a cada ciclo de cobrança (mensal ou anual, conforme plano contratado), até que seja cancelada.
5.2. A Unidade pode cancelar a qualquer momento, diretamente pelo painel da plataforma, sem multa. O cancelamento interrompe a renovação futura; o acesso permanece ativo até o fim do ciclo já pago.
5.3. O mundoAS pode suspender o acesso em caso de inadimplência, observado o disposto na Autorização de Débito Recorrente, ou encerrar a prestação do serviço mediante aviso prévio de 30 (trinta) dias, ressalvada rescisão por justa causa.

6. DISPONIBILIDADE E LIMITES
6.1. O mundoAS empenha-se para manter a plataforma disponível, mas não garante disponibilidade ininterrupta (100%), podendo haver janelas de manutenção programada ou indisponibilidades eventuais decorrentes de terceiros (provedores de nuvem, conectividade).

7. FORO
7.1. Fica eleito o foro da comarca de ${CONTRATANTE.sede}, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer controvérsias oriundas deste instrumento.`;

export const POLITICA_PRIVACIDADE_LGPD = `POLÍTICA DE PRIVACIDADE E TRATAMENTO DE DADOS (LGPD) — MUNDOAS

Controlador: ${CONTRATANTE.razaoSocial}, CNPJ nº ${CONTRATANTE.cnpj}, com sede em ${CONTRATANTE.sede}.

1. DADOS COLETADOS
1.1. Dados cadastrais da Unidade e de seus usuários: nome, CPF/CNPJ, razão social, endereço, telefone, e-mail.
1.2. Dados de uso da plataforma: registros de acesso, ações realizadas no sistema, configurações inseridas (metas, comissões, pontuação).
1.3. Dados de pagamento: processados diretamente pelo gateway de pagamentos Asaas; o mundoAS armazena apenas identificadores de referência (ID de cliente e de assinatura no Asaas) e o histórico de faturas (valor, vencimento, status), não armazenando dados sensíveis de cartão.

2. FINALIDADE DO TRATAMENTO
2.1. Viabilizar a operação da plataforma contratada (Art. 7º, V, LGPD — execução de contrato).
2.2. Processar cobranças e emitir cobranças recorrentes (Art. 7º, V, LGPD).
2.3. Cumprir obrigações legais e regulatórias, quando aplicável (Art. 7º, II, LGPD).

3. COMPARTILHAMENTO DE DADOS
3.1. Dados de faturamento são compartilhados com o gateway de pagamentos Asaas, exclusivamente para viabilizar a cobrança — etapa indispensável ao funcionamento do serviço.
3.2. O mundoAS não vende, aluga ou compartilha dados com terceiros para fins de marketing.

4. RETENÇÃO
4.1. Os dados são mantidos durante a vigência da licença de uso e pelo prazo adicional necessário ao cumprimento de obrigações legais, fiscais e regulatórias.

5. DIREITOS DO TITULAR
5.1. Nos termos do Art. 18 da LGPD, o titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e informações sobre compartilhamento de seus dados, mediante solicitação pelos canais de suporte da plataforma.

6. SEGURANÇA
6.1. O mundoAS adota medidas técnicas e administrativas razoáveis para proteger os dados contra acessos não autorizados, perda ou alteração indevida.`;

export const AUTORIZACAO_DEBITO_RECORRENTE = `AUTORIZAÇÃO DE DÉBITO RECORRENTE — MUNDOAS

Pelo presente instrumento, o responsável financeiro da Unidade autoriza a ${CONTRATANTE.razaoSocial} (CNPJ nº ${CONTRATANTE.cnpj}) a realizar, por meio do gateway de pagamentos Asaas, a cobrança automática e recorrente referente à licença de uso da plataforma mundoAS, nas seguintes condições:

1. PLANO E VALOR
1.1. O valor cobrado corresponde ao plano escolhido pela Unidade no ato da contratação: Mensal (R$ 350,00) ou Anual (R$ 3.500,00), sujeito a reajuste mediante aviso prévio de 30 (trinta) dias.

2. VENCIMENTO
2.1. O vencimento das cobranças ocorre todo dia 15 (quinze) do ciclo correspondente (mensal ou anual).

3. MÉTODO DE PAGAMENTO
3.1. A cobrança é processada no método escolhido pela Unidade: cartão de crédito, PIX ou boleto bancário, podendo ser alterado a qualquer momento pelo painel.

4. RETENTATIVA EM CASO DE FALHA
4.1. Em caso de falha na cobrança via cartão de crédito, o sistema realiza novas tentativas automáticas em dias alternados, conforme configuração do gateway Asaas, mantendo o acesso ativo durante o período de retentativas.
4.2. Persistindo a falha após todas as tentativas, ou em caso de boleto/PIX não pago após o prazo de tolerância, o acesso à plataforma poderá ser suspenso até a regularização.

5. CANCELAMENTO DA AUTORIZAÇÃO
5.1. Esta autorização pode ser cancelada a qualquer momento pelo responsável financeiro, diretamente no painel da plataforma, sem incidência de multa. O cancelamento interrompe as cobranças futuras; eventual saldo já faturado permanece devido.`;
