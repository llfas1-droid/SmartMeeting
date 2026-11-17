import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  buildMeetingChatSystemInstruction,
  validateChatPayload,
} from './src/lib/meetingChatContext.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

function isTransientApiError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return (
    status === 503 ||
    status === 429 ||
    message.includes('"code":503') ||
    message.includes('"code":429') ||
    message.includes('UNAVAILABLE') ||
    message.toLowerCase().includes('high demand') ||
    message.toLowerCase().includes('temporarily')
  );
}

function formatFriendlyGeminiError(err: unknown): { statusCode: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;

  if (
    status === 503 ||
    raw.includes('"code":503') ||
    raw.includes('UNAVAILABLE') ||
    raw.toLowerCase().includes('high demand')
  ) {
    return {
      statusCode: 503,
      message:
        'O serviço de IA está temporariamente com elevada procura. Por favor, aguarde alguns segundos e tente novamente.',
    };
  }

  if (status === 429 || raw.includes('"code":429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      statusCode: 429,
      message:
        'Foi atingido o limite temporário de pedidos ao assistente. Aguarde um momento antes de enviar nova pergunta.',
    };
  }

  if (status === 401 || status === 403 || raw.includes('API_KEY_INVALID')) {
    return {
      statusCode: 502,
      message:
        'A chave de API do Gemini configurada no servidor é inválida ou não tem permissões para este modelo.',
    };
  }

  return {
    statusCode: 502,
    message: 'Não foi possível obter resposta do Assistente da Reunião neste momento. Tente novamente.',
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/meeting-chat', async (req: Request, res: Response) => {
    const validation = validateChatPayload(req.body);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'A chave GEMINI_API_KEY não está configurada no servidor. Configure a variável de ambiente para ativar o Assistente da Reunião.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = buildMeetingChatSystemInstruction(validation.meeting);
      const formattedHistory = validation.history.map((entry) => ({
        role: entry.role,
        parts: [{ text: entry.text }],
      }));

      const maxAttempts = 3;
      let lastError: unknown;
      let replyText = '';

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const chat = ai.chats.create({
            model: MODEL_NAME,
            history: formattedHistory,
            config: {
              systemInstruction,
            },
          });

          const response = await chat.sendMessage({
            message: validation.message,
          });

          replyText = response.text?.trim() ?? '';
          break;
        } catch (attemptErr: unknown) {
          lastError = attemptErr;
          if (attempt < maxAttempts && isTransientApiError(attemptErr)) {
            await wait(800 * attempt);
            continue;
          }
          throw attemptErr;
        }
      }

      if (!replyText) {
        if (lastError) throw lastError;
        res.status(502).json({
          error: 'O assistente não devolveu uma resposta válida para esta pergunta.',
        });
        return;
      }

      res.json({ reply: replyText });
    } catch (err: unknown) {
      console.error('Erro em POST /api/meeting-chat:', err);
      const friendly = formatFriendlyGeminiError(err);
      res.status(friendly.statusCode).json({ error: friendly.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartMeeting server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
