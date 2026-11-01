function fallbackContract(body) {
  const value = (v) => String(v || '').trim() || '[PREENCHER]';
  const c = body.contractor || {};
  const h = body.hired || {};
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const location = value(body.location || '');
  const includeWitnesses = body.includeWitnesses === 'Sim';
  const additional = String(body.additionalTerms || '').trim();
  const forumMatch = additional.match(/(?:foro|f[oó]rum)\s*(?:escolhido|eleito|de elei[cç][aã]o)?\s*[:\-]\s*([^\n.;]+)/i);
  const forumClause = forumMatch ? `\n\n11. ELEIÇÃO DE FORO\nPara dirimir controvérsias decorrentes deste contrato, as partes elegem o foro da comarca de ${forumMatch[1].trim()}, observadas as regras legais de competência aplicáveis e as hipóteses de competência absoluta.\n` : '';
  const additionalClause = additional && !forumMatch ? `\n\n11. CLÁUSULAS E CONDIÇÕES ADICIONAIS\nAs partes registram a seguinte condição adicional, a ser conferida e detalhada antes da assinatura: ${additional}.` : '';
  const extraClauses = forumClause || additionalClause;
  const finalNumber = extraClauses ? '12' : '11';
  return `${value(body.contractName || 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS').toUpperCase()}

Pelo presente instrumento particular, de um lado:

CONTRATANTE: ${value(c.name)}, CPF/CNPJ ${value(c.document)}, com endereço em ${value(c.address)}, e-mail ${value(c.email)};

e, de outro lado:

CONTRATADO(A): ${value(h.name)}, CPF/CNPJ ${value(h.document)}, com endereço em ${value(h.address)};

resolvem estabelecer as condições preliminares abaixo, que deverão ser conferidas e completadas pelas partes antes da assinatura.

1. OBJETO
O presente instrumento tem por objeto a prestação dos seguintes serviços: ${value(body.service)}.

2. ESCOPO E ENTREGÁVEIS
Os serviços e materiais previstos são: ${value(body.deliverables)}. Qualquer atividade não descrita expressamente deverá ser acordada por escrito entre as partes antes de sua execução.

3. PRAZO E VIGÊNCIA
Início previsto: ${value(body.startDate)}. Término ou prazo de execução: ${value(body.endDate)}. As partes deverão registrar por escrito eventuais alterações de cronograma.

4. PREÇO E PAGAMENTO
Valores, vencimentos e forma de pagamento: ${value(body.paymentTerms)}. Nenhum valor ou condição não informado neste pré-escopo é presumido; os dados pendentes devem ser preenchidos e aceitos pelas partes.

5. REVISÕES E APROVAÇÕES
Estão previstas as seguintes revisões: ${value(body.revisions)}. Solicitações que ultrapassem o escopo ou o limite de revisões deverão ser avaliadas e aprovadas previamente pelas partes, inclusive quanto a eventual custo e prazo adicional.

6. OBRIGAÇÕES DAS PARTES
O(A) CONTRATADO(A) deverá executar os serviços acordados com diligência e comunicar eventuais impedimentos relevantes. O(A) CONTRATANTE deverá fornecer informações, materiais, acessos e aprovações necessários em tempo hábil, além de cumprir as condições de pagamento acordadas.

7. DIREITOS AUTORAIS E USO DE MATERIAIS
A titularidade, licença de uso, entrega de arquivos editáveis e eventual autorização para uso de marcas, imagens ou portfólio deverão ser definidas expressamente pelas partes, respeitando a legislação aplicável e os direitos de terceiros. Condições específicas: [DEFINIR EXPRESSAMENTE ENTRE AS PARTES].

8. CONFIDENCIALIDADE E DADOS PESSOAIS
As partes deverão tratar com cuidado as informações confidenciais recebidas e utilizar dados pessoais apenas para finalidades legítimas relacionadas à execução do serviço, observando a legislação aplicável, inclusive a LGPD, quando pertinente.

9. ALTERAÇÕES, CANCELAMENTO E RESCISÃO
Alterações de escopo, suspensão ou encerramento antecipado deverão ser comunicados por escrito. Consequências financeiras, prazos de aviso e eventuais compensações devem ser acordados e preenchidos antes da assinatura: [DEFINIR ENTRE AS PARTES].

10. DISPOSIÇÕES GERAIS
Este documento é uma minuta inicial baseada nas informações fornecidas. As partes deverão revisar todos os campos, completar os dados ausentes e confirmar que as cláusulas refletem o que foi efetivamente negociado.

    ${extraClauses}\n\n    ${finalNumber}. LOCAL, DATA E ASSINATURAS\n    Local: ${location}    Data: ${today}
