import { Injectable } from '@nestjs/common';

@Injectable()
export class LlmService {
  async answer(question: string, context: string): Promise<string> {
    const provider = 'gemini'

    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY || '';
      if (!key) return this.mockAnswer(question, context, 'gemini (sem chave)');
      return this.answerWithGemini(key, question, context);
    }

    // if (provider === 'openai') {
    //   const key = process.env.OPENAI_API_KEY || '';
    //   if (!key) return this.mockAnswer(question, context, 'openai (sem chave)');
    //   return this.answerWithOpenAI(key, question, context);
    // }

    if (process.env.GEMINI_API_KEY) return this.answerWithGemini(process.env.GEMINI_API_KEY, question, context);
    return this.mockAnswer(question, context, 'nenhum provedor configurado');
  }

  private mockAnswer(question: string, context: string, reason: string) {
    return `MOCK (${reason})\nPergunta: ${question}\nResumo do contexto: ${
      context.slice(0, 240).replace(/\s+/g, ' ')
    }...`;
  }

  private async answerWithGemini(apiKey: string, question: string, context: string) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const modelId = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    // limita contexto para 20.000 caracteres
    const safeContext = context.slice(0, 20_000);

    const systemInstruction =
      'Você é um assistente que responde com base no texto OCR fornecido. ' +
      'Responda de forma objetiva e cite trechos do contexto quando relevante. ' +
      'Se não souber, diga que não encontrou no documento.';

    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Documento (OCR):\n"""${safeContext}"""\n\nPergunta: ${question}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: Number(process.env.LLM_MAX_TOKENS || 400),
      },
    });

    return result.response.text();
  }

//   private async answerWithOpenAI(apiKey: string, question: string, context: string) {
//     const OpenAI = (await import('openai')).default;
//     const client = new OpenAI({ apiKey });

//     const model = process.env.LLM_MODEL || 'gpt-4o-mini';
//     const maxTokens = Number(process.env.LLM_MAX_TOKENS || 400);
//     const safeContext = context.slice(0, 20_000);

//     const sys =
//       'Você é um assistente que responde com base no texto OCR fornecido. ' +
//       'Responda de forma objetiva e cite trechos do contexto quando relevante. ' +
//       'Se não souber, diga que não encontrou no documento.';

//     const completion = await client.chat.completions.create({
//       model,
//       max_tokens: maxTokens,
//       temperature: 0.2,
//       messages: [
//         { role: 'system', content: sys },
//         { role: 'user', content: `Documento (OCR):\n"""${safeContext}"""\n\nPergunta: ${question}` },
//       ],
//     });

//     return completion.choices?.[0]?.message?.content ?? '';
//   }
}
