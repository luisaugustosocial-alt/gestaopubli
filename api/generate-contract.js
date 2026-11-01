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
          return res.status(503).json({ error: 'O Gemini está temporariamente sobrecarregado. Aguarde um minuto e tente gerar a minuta novamente.' });
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
