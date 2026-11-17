import { MeetingRecording } from '../types/index.ts';

export const INITIAL_MEETINGS: MeetingRecording[] = [
  {
    id: 'rec_sprint_44_planning',
    title: 'Sprint 44 Planning & Arquitetura de Pagamentos',
    date: '2026-10-23',
    durationSeconds: 1945, // ~32 min
    fileType: 'audio/mp3',
    fileName: 'sprint_44_audio_final.mp3',
    fileSizeBytes: 24.8 * 1024 * 1024,
    managerApprovalStatus: 'pending',
    summary: {
      executiveSummary: 'Alinhamento crítico sobre a transição do gateway de pagamentos para suporte multi-moeda e migração da base de dados sem downtime. Ficou definido o congelamento de novas features na sexta-feira.',
      keyDecisions: [
        'Adoção da estratégia Blue/Green deployment para a migração da base de dados.',
        'Refatoração da camada de checkout para abstrair provedores de pagamento.',
        'Notificações de tarefas só serão disparadas após validação final do Tech Lead / Gestor de Projeto.'
      ],
      blockersAndRisks: [
        'Dependência do sandbox da Adyen para validação 3DS 2.0 antes de quarta-feira.',
        'Capacidade reduzida da equipa de QA devido a licenças programadas.'
      ],
      nextSteps: [
        'Validação do Mapa de Distribuição de Tarefas pelo Gestor.',
        'Disparo sincronizado via Webhook para o Jira e Slack da equipa.'
      ]
    },
    tasks: [
      {
        id: 'task-101',
        title: 'Criar spec técnica para adapter de pagamentos Stripe + Adyen',
        description: 'Desenvolver a interface unificada com fallback automático em caso de timeout superior a 800ms.',
        assignee: {
          name: 'Bernardo Costa',
          email: 'bernardo.costa@empresa.com',
          role: 'Senior Backend Engineer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
        },
        dueDate: '2026-10-27',
        priority: 'high',
        estimatedHours: 12,
        status: 'pending_approval',
        contextSnippet: 'Bernardo: "Consigo ter o rascunho do adapter pronto até terça-feira para podermos rever antes do sprint review."'
      },
      {
        id: 'task-102',
        title: 'Atualizar testes E2E do fluxo de compra com 3D Secure',
        description: 'Cobrir cenários de recusa por suspeita de fraude e redirecionamento bancário em dispositivos móveis.',
        assignee: {
          name: 'Margarida Vale',
          email: 'margarida.vale@empresa.com',
          role: 'QA Automation Lead',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
        },
        dueDate: '2026-10-29',
        priority: 'medium',
        estimatedHours: 8,
        status: 'pending_approval',
        contextSnippet: 'Margarida: "Vou precisar que os mock endpoints estejam de pé para escrever os testes Cypress sem falsos positivos."'
      },
      {
        id: 'task-103',
        title: 'Desenhar tela de confirmação de pagamento com autenticação biométrica',
        description: 'Ajustar micro-interações do modal de checkout no Figma conforme o novo design system.',
        assignee: {
          name: 'Tomás Saraiva',
          email: 'tomas.saraiva@empresa.com',
          role: 'Product Designer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
        },
        dueDate: '2026-10-28',
        priority: 'medium',
        estimatedHours: 6,
        status: 'pending_approval',
        contextSnippet: 'Tomás: "Já tenho os wireframes básicos, só falta polir os estados de erro e loading no protótipo."'
      },
      {
        id: 'task-104',
        title: 'Configurar canal de alertas de anomalias no Datadog para transações rejeitadas',
        description: 'Threshold configurado para alertar o canal #oncall-payments se a taxa de recusa ultrapassar 3.5%.',
        assignee: {
          name: 'Diogo Ribeiro',
          email: 'diogo.ribeiro@empresa.com',
          role: 'DevOps / SRE',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
        },
        dueDate: '2026-10-26',
        priority: 'urgent',
        estimatedHours: 4,
        status: 'pending_approval',
        contextSnippet: 'Diogo: "Posso criar o monitor no Datadog na segunda-feira de manhã, é rápido e crítico para o release."'
      }
    ],
    transcript: [
      { speaker: 'Rita (Gestora de Projeto)', time: '00:15', text: 'Bom dia equipa. O foco desta reunião é fechar o plano da Sprint 44 e alinhar a migração de pagamentos sem quebrar o fluxo dos utilizadores.' },
      { speaker: 'Bernardo (Backend)', time: '02:40', text: 'A nossa principal dor hoje é a latência do gateway legado. O ideal é isolar a Stripe e a Adyen através de um adapter pattern unificado.' },
      { speaker: 'Rita (Gestora de Projeto)', time: '05:12', text: 'Perfeito. Mas precisamos de garantir que nenhuma tarefa é delegada sem a minha revisão operacional para não sobrecarregarmos o Diogo.' },
      { speaker: 'Margarida (QA)', time: '08:30', text: 'Concordo. Eu só começo os testes E2E quando o Bernardo publicar a especificação dos contratos da API.' },
      { speaker: 'Tomás (Design)', time: '14:20', text: 'Pelo lado de UX, vou rever o modal de autenticação biométrica para que o utilizador entenda o redirecionamento bancário.' },
      { speaker: 'Rita (Gestora de Projeto)', time: '21:05', text: 'Ótimo. Assim que a transcrição estiver pronta, vou validar os prazos e responsáveis no SmartMeeting antes de notificar no Jira.' }
    ]
  }
];
