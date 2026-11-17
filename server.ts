import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import {
  buildMeetingChatSystemInstruction,
  validateChatPayload,
} from './src/lib/meetingChatContext.ts';
import type { TaskItem } from './src/types/index.ts';

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

function normalizePriority(value: unknown): TaskItem['priority'] {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'urgent') {
    return value;
  }
  return 'medium';
}

function normalizeDueDate(value: unknown, fallbackDate: string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  return fallbackDate;
}

function buildAssigneeEmail(name: string, managerName?: string, managerEmail?: string): string {
  const cleanedName = name.trim();
  if (
    managerName &&
    managerEmail &&
    cleanedName.toLowerCase() === managerName.trim().toLowerCase()
  ) {
    return managerEmail.trim();
  }
  const slug = cleanedName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return slug ? `${slug}@empresa.com` : managerEmail?.trim() || 'equipa@empresa.com';
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

  app.post('/api/extract-tasks', async (req: Request, res: Response) => {
    const body = req.body as {
      title?: string;
      transcriptText?: string;
      transcript?: Array<{ speaker?: string; time?: string; text?: string }>;
      managerName?: string;
      managerEmail?: string;
    } | null;

    const rawText =
      typeof body?.transcriptText === 'string' && body.transcriptText.trim()
        ? body.transcriptText.trim()
        : Array.isArray(body?.transcript)
        ? body.transcript
            .filter((entry) => entry && typeof entry.text === 'string' && entry.text.trim())
            .map(
              (entry) =>
                `[${entry.time || '00:00'}] ${entry.speaker || 'Participante'}: ${entry.text?.trim()}`
            )
            .join('\n')
        : '';

    if (!rawText) {
      res.status(400).json({
        error: 'Forneça uma transcrição válida para extrair o resumo e o mapa de tarefas.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'A chave GEMINI_API_KEY não está configurada no servidor. Configure a variável de ambiente para extrair tarefas com IA.',
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

      const todayIso = new Date().toISOString().split('T')[0];
      const meetingTitle = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : 'Reunião';
      const managerFallback = typeof body?.managerName === 'string' && body.managerName.trim() ? body.managerName.trim() : 'Equipa';

      const prompt = [
        'És um analista sénior de produtividade do SmartMeeting.',
        'Analisa a transcrição da reunião abaixo e extrai EXCLUSIVAMENTE o que foi discutido, sem inventar factos.',
        `Data de referência de hoje: ${todayIso}. Converte prazos relativos (ex: "amanhã", "sexta-feira") para o formato YYYY-MM-DD ou usa ${todayIso} caso não haja prazo específico.`,
        `Se uma tarefa não tiver responsável explícito, atribui a "${managerFallback}".`,
        '',
        `Título da reunião: ${meetingTitle}`,
        'Transcrição:',
        rawText,
      ].join('\n');

      const maxAttempts = 3;
      let responseText = '';
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  executiveSummary: { type: Type.STRING },
                  keyDecisions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  blockersAndRisks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  nextSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        assigneeName: { type: Type.STRING },
                        assigneeRole: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        priority: {
                          type: Type.STRING,
                          enum: ['low', 'medium', 'high', 'urgent'],
                        },
                        estimatedHours: { type: Type.NUMBER },
                        contextSnippet: { type: Type.STRING },
                      },
                      required: [
                        'title',
                        'description',
                        'assigneeName',
                        'assigneeRole',
                        'dueDate',
                        'priority',
                      ],
                    },
                  },
                },
                required: [
                  'executiveSummary',
                  'keyDecisions',
                  'blockersAndRisks',
                  'nextSteps',
                  'tasks',
                ],
              },
            },
          });

          responseText = response.text?.trim() ?? '';
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

      if (!responseText) {
        if (lastError) throw lastError;
        res.status(502).json({
          error: 'A IA não devolveu uma estrutura válida para o Mapa de Tarefas.',
        });
        return;
      }

      const parsed = JSON.parse(responseText) as {
        executiveSummary?: string;
        keyDecisions?: string[];
        blockersAndRisks?: string[];
        nextSteps?: string[];
        tasks?: Array<{
          title?: string;
          description?: string;
          assigneeName?: string;
          assigneeRole?: string;
          dueDate?: string;
          priority?: string;
          estimatedHours?: number;
          contextSnippet?: string;
        }>;
      };

      const timestampBase = Date.now();
      const mappedTasks: TaskItem[] = (Array.isArray(parsed.tasks) ? parsed.tasks : [])
        .filter((item) => item && typeof item.title === 'string' && item.title.trim())
        .map((item, idx) => {
          const assigneeName =
            typeof item.assigneeName === 'string' && item.assigneeName.trim()
              ? item.assigneeName.trim()
              : managerFallback;
          const assigneeRole =
            typeof item.assigneeRole === 'string' && item.assigneeRole.trim()
              ? item.assigneeRole.trim()
              : 'Participante';

          return {
            id: `task_${timestampBase}_${idx + 1}`,
            title: item.title!.trim(),
            description:
              typeof item.description === 'string' && item.description.trim()
                ? item.description.trim()
                : 'Extraído automaticamente da reunião para validação no Mapa de Tarefas.',
            assignee: {
              name: assigneeName,
              email: buildAssigneeEmail(assigneeName, body?.managerName, body?.managerEmail),
              role: assigneeRole,
            },
            dueDate: normalizeDueDate(item.dueDate, todayIso),
            priority: normalizePriority(item.priority),
            estimatedHours:
              typeof item.estimatedHours === 'number' && item.estimatedHours > 0
                ? item.estimatedHours
                : undefined,
            status: 'pending_approval',
            contextSnippet:
              typeof item.contextSnippet === 'string' && item.contextSnippet.trim()
                ? item.contextSnippet.trim()
                : undefined,
          };
        });

      res.json({
        summary: {
          executiveSummary:
            typeof parsed.executiveSummary === 'string' && parsed.executiveSummary.trim()
              ? parsed.executiveSummary.trim()
              : 'Resumo gerado a partir da transcrição da reunião.',
          keyDecisions: Array.isArray(parsed.keyDecisions)
            ? parsed.keyDecisions.filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
            : [],
          blockersAndRisks: Array.isArray(parsed.blockersAndRisks)
            ? parsed.blockersAndRisks.filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
            : [],
          nextSteps: Array.isArray(parsed.nextSteps)
            ? parsed.nextSteps.filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
            : [],
        },
        tasks: mappedTasks,
      });
    } catch (err: unknown) {
      console.error('Erro em POST /api/extract-tasks:', err);
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
