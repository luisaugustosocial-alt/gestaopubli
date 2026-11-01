function fallbackContract(body) {
  const value = (v) => String(v || '').trim() || '[PREENCHER]';
  const c = body.contractor || {};
  const h = body.hired || {};
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Bahia' });
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
A titularidade, licença de uso, entrega de arquivos editáveis e eventual autorização para uso de marcas, imagens ou portfólio deverão ser definidas expressamente pelas partes, respeitando a legislação aplicável e os direitos de terceiros. Condições específicas: ${value(body.additionalTerms)}.

8. CONFIDENCIALIDADE E DADOS PESSOAIS
As partes deverão tratar com cuidado as informações confidenciais recebidas e utilizar dados pessoais apenas para finalidades legítimas relacionadas à execução do serviço, observando a legislação aplicável, inclusive a LGPD, quando pertinente.

9. ALTERAÇÕES, CANCELAMENTO E RESCISÃO
Alterações de escopo, suspensão ou encerramento antecipado deverão ser comunicados por escrito. Consequências financeiras, prazos de aviso e eventuais compensações devem ser acordados e preenchidos antes da assinatura: [DEFINIR ENTRE AS PARTES].

10. DISPOSIÇÕES GERAIS
Este documento é uma minuta inicial baseada nas informações fornecidas. As partes deverão revisar todos os campos, completar os dados ausentes e confirmar que as cláusulas refletem o que foi efetivamente negociado. Cláusulas adicionais: ${value(body.additionalTerms)}.

11. LOCAL, DATA E ASSINATURAS
Local: [PREENCHER]    Data: ${today}

CONTRATANTE: ____________________________________
Nome: ${value(c.name)}
CPF/CNPJ: ${value(c.document)}

CONTRATADO(A): __________________________________
Nome: ${value(h.name)}
CPF/CNPJ: ${value(h.document)}

TESTEMUNHA 1: __________________ CPF: __________________

TESTEMUNHA 2: __________________ CPF: __________________

NOTA: Minuta preliminar gerada automaticamente a partir do pré-escopo, sem validação jurídica. Recomenda-se revisão por profissional habilitado antes da assinatura.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'A integração com Gemini ainda não está configurada. Adicione GEMINI_API_KEY nas variáveis de ambiente do projeto Vercel e faça novo deploy.' });
  }
  try {
    const body = req.body || {};
    const required = [body.contractor?.name, body.hired?.name, body.service];
    if (required.some(value => !String(value || '').trim())) {
      return res.status(400).json({ error: 'Informe contratante, contratado e serviço.' });
    }
    const prompt = `Redija uma MINUTA / PRÉ-CONTRATO em português brasileiro para prestação de serviços de comunicação, design, conteúdo ou marketing, com linguagem clara e profissional. Não afirme que é aconselhamento jurídico e não garanta validade legal. Não invente CPF/CNPJ, endereço, datas, valores, prazos ou condições que não foram fornecidos: indique [PREENCHER] quando faltar informação essencial. Preserve os termos informados pelo usuário e organize o documento com título, qualificação das partes, objeto, escopo e entregáveis, cronograma e vigência, valor e forma de pagamento, revisões e aprovações, responsabilidades das partes, direitos autorais/licenças e uso de imagem quando pertinente, confidencialidade quando pertinente, cancelamento/rescisão, tratamento de dados pessoais quando pertinente, solução de divergências, local/data e campos de assinatura. Não crie multas ou obrigações específicas não informadas; se relevantes, sinalize como cláusula a definir. Inclua uma nota final de que é minuta para revisão antes da assinatura. Entregue somente o texto final do contrato, sem comentários sobre o prompt.

DADOS DO PRÉ-ESCOPO:
Nome do contrato: ${body.contractName || 'Contrato de prestação de serviços'}
Marca/estúdio: ${body.brand || 'Gestão Publi'}
CONTRATANTE: ${JSON.stringify(body.contractor || {})}
CONTRATADO: ${JSON.stringify(body.hired || {})}
SERVIÇO: ${body.service || ''}
ENTREGÁVEIS: ${body.deliverables || '[A DEFINIR]'}
REVISÕES: ${body.revisions || '[A DEFINIR]'}
PAGAMENTO: ${body.paymentTerms || '[A DEFINIR]'}
INÍCIO: ${body.startDate || '[A DEFINIR]'}
TÉRMINO/PRAZO: ${body.endDate || '[A DEFINIR]'}
PROFISSIONAL NO PERFIL: ${body.professionalName || ''}
TERMOS/INFORMAÇÕES ADICIONAIS: ${body.additionalTerms || '[Nenhuma informação adicional]'}`;
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=' + encodeURIComponent(apiKey);
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 8192 }
      })
    };
    let response;
    let result;
    // Gemini pode retornar 429/503 em picos temporários; tente novamente uma vez.
    for (let attempt = 0; attempt < 2; attempt++) {
      response = await fetch(endpoint, requestOptions);
      result = await response.json();
      if (response.ok) break;
      const message = result?.error?.message || '';
      const temporary = response.status === 429 || response.status === 503 || /high demand|temporar|overload/i.test(message);
      if (!temporary || attempt === 1) {
        console.error('Gemini API error:', response.status, message);
        if (response.status === 401 || response.status === 403 || /API key|api_key|permission|not authorized|invalid key/i.test(message)) {
          return res.status(502).json({ error: 'O Google recusou a chave ou não autorizou este modelo. Confira se a chave GEMINI_API_KEY é do Google AI Studio e se a Gemini API está habilitada no projeto.' });
        }
        if (temporary) {
          console.warn('Gemini indisponível; retornando minuta-base para não bloquear o fluxo.');
          return res.status(200).json({
            contract: fallbackContract(body),
            fallback: true,
            message: 'O Gemini está temporariamente sobrecarregado. Foi criada uma minuta-base com os dados preenchidos para você não ficar bloqueado; revise os campos [PREENCHER].'
          });
        }
        return res.status(502).json({ error: 'O Gemini recusou a solicitação. Verifique se a chave tem acesso à Gemini API e tente novamente.' });
      }
      await new Promise(resolve => setTimeout(resolve, 900));
    }
    const contract = (result.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n').trim();
    if (!contract) return res.status(502).json({ error: 'O Gemini retornou uma resposta vazia. Tente novamente.' });
    return res.status(200).json({ contract });
  } catch (error) {
    console.error('Contract generation failed:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar a minuta.' });
  }
}
