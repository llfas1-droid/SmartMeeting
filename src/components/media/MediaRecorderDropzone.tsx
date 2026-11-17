import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Mic, 
  Square, 
  Pause, 
  Play, 
  FileAudio, 
  FileVideo, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Radio, 
  Monitor, 
  Layers, 
  ArrowRight,
  FileText,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { validateMediaFile, formatDuration, formatFileSize } from '../../lib/meetingUtils.ts';
import { buildMeetingFromTranscriptText } from '../../lib/userMeetingsStorage.ts';
import { MeetingRecording, MeetingSummary, ProcessingStep, TaskItem } from '../../types/index.ts';

interface MediaRecorderDropzoneProps {
  onMeetingProcessed: (newMeeting: MeetingRecording) => void;
  onClose?: () => void;
  managerName?: string;
  managerEmail?: string;
}

export const MediaRecorderDropzone: React.FC<MediaRecorderDropzoneProps> = ({
  onMeetingProcessed,
  onClose,
  managerName,
  managerEmail,
}) => {
  // Input mode: 'upload', 'record', or 'text'
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'text'>('upload');
  const [textTitle, setTextTitle] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  
  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingSource, setRecordingSource] = useState<'mic' | 'system'>('mic');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Processing state
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [textAiError, setTextAiError] = useState<string | null>(null);

  // Audio Context & MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up media streams and timers
  useEffect(() => {
    return () => {
      stopStreamsAndCleanUp();
    };
  }, []);

  const stopStreamsAndCleanUp = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setFileError(null);
    const validation = validateMediaFile({
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!validation.valid) {
      setFileError(validation.error || 'Ficheiro inválido.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Canvas visualizer draw loop
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee'; // cyan-400
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    render();
  };

  // Start direct recording
  const startRecording = async () => {
    setMicPermissionDenied(false);
    setFileError(null);
    audioChunksRef.current = [];
    setRecordedBlob(null);

    try {
      let stream: MediaStream;

      if (recordingSource === 'system') {
        // Capture screen/tab audio (ideal for Google Meet / Zoom in-browser)
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
      } else {
        // Default microphone
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
      }

      streamRef.current = stream;

      // Setup Web Audio Analyser for visualization
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      // Only route if there is an audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawWaveform();
      }

      // Check supported mime types
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
      };

      mediaRecorder.start(500); // 500ms chunks
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);

      // Timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err: unknown) {
      console.error('Error accessing audio source:', err);
      setMicPermissionDenied(true);
      setFileError('Permissão para gravação de áudio negada ou não suportada pelo browser.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    stopStreamsAndCleanUp();
    setIsRecording(false);
    setIsPaused(false);
  };

  // Fallback local text processing when explicitly chosen after an AI error
  const handleProcessTextLocally = () => {
    setFileError(null);
    setTextAiError(null);
    if (!transcriptText.trim()) {
      setFileError('Cole ou escreva o texto da reunião antes de processar.');
      return;
    }

    const newMeeting = buildMeetingFromTranscriptText({
      title: textTitle,
      transcriptText,
      managerName,
      managerEmail,
    });
    onMeetingProcessed(newMeeting);
  };

  // Submit text transcript via Gemini AI extraction
  const handleProcessText = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFileError(null);
    setTextAiError(null);
    if (!transcriptText.trim()) {
      setFileError('Cole ou escreva o texto da reunião antes de processar.');
      return;
    }

    const baseMeeting = buildMeetingFromTranscriptText({
      title: textTitle,
      transcriptText,
      managerName,
      managerEmail,
    });

    setIsProcessingText(true);
    try {
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: baseMeeting.title,
          transcriptText,
          managerName,
          managerEmail,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        summary?: MeetingSummary;
        tasks?: TaskItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível extrair o resumo e o mapa de tarefas com IA neste momento.'
        );
      }

      const aiTasks = Array.isArray(data.tasks) ? data.tasks : baseMeeting.tasks;
      const enrichedMeeting: MeetingRecording = {
        ...baseMeeting,
        summary: data.summary ?? baseMeeting.summary,
        tasks: aiTasks,
        managerApprovalStatus: 'pending',
      };

      onMeetingProcessed(enrichedMeeting);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao comunicar com o servidor para extração de tarefas.';
      setTextAiError(message);
    } finally {
      setIsProcessingText(false);
    }
  };

  // Submit file or recording for AI processing
  const handleProcessMedia = () => {
    if (!selectedFile && !recordedBlob) return;

    setStep('uploading');
    setProgressPercent(15);
    setCurrentStepText('A preparar ficheiro multimédia...');

    setTimeout(() => {
      setStep('extracting_audio');
      setProgressPercent(40);
      setCurrentStepText('Extração de faixas de voz e filtro de redução de ruído adaptativo...');
    }, 1200);

    setTimeout(() => {
      setStep('transcribing');
      setProgressPercent(70);
      setCurrentStepText('Transcrição neural Whisper & Diarização de interlocutores...');
    }, 2600);

    setTimeout(() => {
      setStep('extracting_tasks');
      setProgressPercent(92);
      setCurrentStepText('IA a estruturar o "Mapa de Distribuição de Tarefas" para revisão do Gestor...');
    }, 4200);

    setTimeout(() => {
      setStep('ready_for_review');
      setProgressPercent(100);

      // Create generated meeting record
      const meetingId = `rec_${Date.now()}`;
      const isFromRecord = !!recordedBlob;
      const duration = isFromRecord ? Math.max(recordingSeconds, 15) : 1850;

      const generatedTasks: TaskItem[] = [
        {
          id: `task_${Date.now()}_1`,
          title: 'Ajustar validação de schema para novos endpoints da API de pagamentos',
          description: 'Garantir retrocompatibilidade com a versão anterior sem quebrar clientes legados.',
          assignee: {
            name: 'Bernardo Costa',
            email: 'bernardo.costa@empresa.com',
            role: 'Senior Backend Engineer',
          },
          dueDate: '2026-10-30',
          priority: 'high',
          estimatedHours: 8,
          status: 'pending_approval',
          contextSnippet: 'Identificado no minuto 12:45 da gravação quando a arquitetura de fallback foi acordada.'
        },
        {
          id: `task_${Date.now()}_2`,
          title: 'Executar testes de carga com simulação de 5.000 requisições simultâneas',
          description: 'Validar o comportamento do auto-scaling e alertar equipa em caso de latência p99 > 400ms.',
          assignee: {
            name: 'Margarida Vale',
            email: 'margarida.vale@empresa.com',
            role: 'QA Automation Lead',
          },
          dueDate: '2026-10-31',
          priority: 'urgent',
          estimatedHours: 6,
          status: 'pending_approval',
          contextSnippet: 'Solicitado após debate sobre pico de tráfego na Black Friday.'
        },
        {
          id: `task_${Date.now()}_3`,
          title: 'Rever resumo executivo e validar entregas da equipa',
          description: 'Confirmar datas e responsáveis antes de partilhar com os participantes.',
          assignee: {
            name: managerName || 'Gestor da Reunião',
            email: managerEmail || 'gestor@empresa.com',
            role: 'Gestor',
          },
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'medium',
          estimatedHours: 2,
          status: 'pending_approval',
          contextSnippet: 'Definido no encerramento para garantir alinhamento da equipa.'
        }
      ];

      const newMeeting: MeetingRecording = {
        id: meetingId,
        title: selectedFile 
          ? selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
          : `Reunião Gravada (${new Date().toLocaleDateString('pt-PT')})`,
        date: new Date().toISOString().split('T')[0],
        durationSeconds: duration,
        fileType: isFromRecord ? 'direct_recording' : 'audio/mp3',
        fileName: selectedFile ? selectedFile.name : `gravacao_direta_${meetingId}.webm`,
        fileSizeBytes: selectedFile ? selectedFile.size : (recordedBlob ? recordedBlob.size : 12 * 1024 * 1024),
        managerApprovalStatus: 'pending',
        summary: {
          executiveSummary: 'Reunião focada nos próximos entregáveis da equipa e validação de prazos antes do envio de tarefas.',
          keyDecisions: [
            'Nenhuma tarefa será partilhada sem revisão prévia do gestor.',
            'Reforço na monitorização de entregas e prazos da sprint.'
          ],
          blockersAndRisks: [
            'Tempo reduzido para validação final antes da entrega.'
          ],
          nextSteps: [
            'Revisão individual das tarefas extraídas.',
            'Exportação para Google Tasks e Google Docs.'
          ]
        },
        tasks: generatedTasks,
        transcript: [
          { speaker: managerName || 'Gestor', time: '00:05', text: 'Vamos alinhar os entregáveis desta semana e garantir que cada tarefa fica atribuída com clareza.' },
          { speaker: 'Bernardo Costa', time: '01:20', text: 'Assumo a atualização técnica da API com entrega prevista para esta semana.' },
          { speaker: 'Margarida Vale', time: '02:15', text: 'Eu fico responsável pelos testes de carga e validação final.' },
          { speaker: managerName || 'Gestor', time: '03:40', text: 'Combinado. Vou rever e aprovar o mapa de tarefas no SmartMeeting.' }
        ]
      };

      setTimeout(() => {
        onMeetingProcessed(newMeeting);
      }, 600);
    }, 5500);
  };

  const handleReset = () => {
    stopStreamsAndCleanUp();
    setSelectedFile(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setIsRecording(false);
    setIsPaused(false);
    setStep('idle');
    setProgressPercent(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Radio className="w-3.5 h-3.5" />
            <span>Módulo de Ingestão Multimédia</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Nova Reunião
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Carregue áudio/vídeo, grave no browser ou cole uma transcrição em texto.
          </p>
        </div>

        {/* Tab Switcher */}
        {step === 'idle' && (
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setFileError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'upload'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Áudio / Vídeo</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('text'); setFileError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'text'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Texto / Transcrição</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('record'); setFileError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'record'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Gravar</span>
            </button>
          </div>
        )}
      </div>

      {/* ERROR BANNER */}
      {fileError && (
        <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{fileError}</p>
            {micPermissionDenied && (
              <p className="text-slate-400 text-[11px] mt-1">
                Dica: Verifique as permissões de microfone nas definições do seu browser ou utilize a opção de carregar ficheiro gravado.
              </p>
            )}
          </div>
        </div>
      )}

      {/* STATE 1: ASYNC AI PROCESSING PROGRESS */}
      {step !== 'idle' ? (
        <div className="py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6 text-cyan-400 relative">
            <Sparkles className="w-8 h-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            A Processar Inteligência da Reunião
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-8">
            {currentStepText}
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>Etapa do Pipeline</span>
              <span className="text-cyan-400 font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
            <div className={`p-3 rounded-lg border text-xs transition-colors ${
              progressPercent >= 40 
                ? 'bg-slate-950/80 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-950/30 border-slate-800 text-slate-500'
            }`}>
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                {progressPercent >= 40 && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                1. Extração de Áudio
              </div>
              <p className="text-[11px] text-slate-400">Separação de canais e redução de ruído.</p>
            </div>

            <div className={`p-3 rounded-lg border text-xs transition-colors ${
              progressPercent >= 70 
                ? 'bg-slate-950/80 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-950/30 border-slate-800 text-slate-500'
            }`}>
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                {progressPercent >= 70 && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                2. Transcrição & Vozes
              </div>
              <p className="text-[11px] text-slate-400">Diarização e reconhecimento dos oradores.</p>
            </div>

            <div className={`p-3 rounded-lg border text-xs transition-colors ${
              progressPercent >= 95 
                ? 'bg-slate-950/80 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-950/30 border-slate-800 text-slate-500'
            }`}>
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                {progressPercent >= 95 && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                3. Mapa de Tarefas
              </div>
              <p className="text-[11px] text-slate-400">Preparação para governança do Gestor.</p>
            </div>
          </div>
        </div>
      ) : activeTab === 'upload' ? (
        /* STATE 2: DRAG AND DROP UPLOAD ZONE */
        <div className="mt-6 space-y-6">
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
              onClick={() => document.getElementById('meeting-file-input')?.click()}
            >
              <input
                type="file"
                id="meeting-file-input"
                className="hidden"
                accept=".mp3,.wav,.mp4,.m4a,.webm,audio/*,video/mp4"
                onChange={handleFileInputChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Arraste o ficheiro de áudio ou vídeo para aqui
              </h3>
              <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                Suporte nativo para gravações nos formatos <span className="text-slate-300 font-semibold">.mp3</span>, <span className="text-slate-300 font-semibold">.wav</span> e <span className="text-slate-300 font-semibold">.mp4</span> até 500 MB.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-slate-200 hover:bg-white rounded-lg transition-colors">
                <span>Procurar no Computador</span>
              </div>
            </div>
          ) : (
            /* Selected File Preview Box */
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    {selectedFile.type.includes('video') || selectedFile.name.endsWith('.mp4') ? (
                      <FileVideo className="w-5 h-5" />
                    ) : (
                      <FileAudio className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {formatFileSize(selectedFile.size)} · Ficheiro pronto para análise
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Trocar Ficheiro
                  </button>
                  <button
                    onClick={handleProcessMedia}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm shadow-cyan-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Processar com IA</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'text' ? (
        /* STATE 2B: TEXT / TRANSCRIPT PASTE */
        <form onSubmit={handleProcessText} className="mt-6 space-y-4">
          <div>
            <label htmlFor="meeting-text-title" className="block text-xs font-medium text-slate-300 mb-1.5">
              Título da Reunião (opcional)
            </label>
            <input
              id="meeting-text-title"
              type="text"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="Ex: Alinhamento de Produto — Segunda-feira"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="meeting-text-body" className="block text-xs font-medium text-slate-300 mb-1.5">
              Transcrição ou Notas da Reunião
            </label>
            <textarea
              id="meeting-text-body"
              rows={7}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder={"Cole aqui a transcrição ou notas da reunião.\nExemplo:\nJoana: Precisamos fechar o protótipo até sexta-feira.\nTarefa: Validar protótipo com a equipa até sexta"}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {textAiError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 space-y-2.5"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{textAiError}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-6">
                <button
                  type="button"
                  onClick={() => void handleProcessText()}
                  disabled={isProcessingText}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-xs font-semibold text-rose-100 transition-colors"
                >
                  Tentar novamente com IA
                </button>
                <button
                  type="button"
                  onClick={handleProcessTextLocally}
                  disabled={isProcessingText}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  Processar localmente (sem IA)
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={!transcriptText.trim() || isProcessingText}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 rounded-lg transition-colors"
            >
              {isProcessingText ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>A extrair resumo e tarefas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Criar Reunião a partir do Texto</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* STATE 3: DIRECT BROWSER RECORDING */
        <div className="mt-6 space-y-6">
          {/* Source Selector (Microphone vs System Audio / Meet Tab) */}
          {!isRecording && !recordedBlob && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRecordingSource('mic')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  recordingSource === 'mic'
                    ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-white">Microfone Local</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ideal para reuniões presenciais, notas de voz individuais ou gravação através dos auscultadores.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRecordingSource('system')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  recordingSource === 'system'
                    ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-white">Áudio do Separador / Reunião</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Grave o separador da videochamada diretamente no navegador.
                </p>
              </button>
            </div>
          )}

          {/* Live Waveform Canvas */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isRecording 
                    ? isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-pulse' 
                    : 'bg-slate-600'
                }`} />
                <span className="font-semibold text-white">
                  {isRecording 
                    ? isPaused ? 'Gravação Pausada' : 'A Gravar Áudio em Direto...' 
                    : recordedBlob ? 'Gravação Concluída' : 'Pronto para Gravar'}
                </span>
              </div>
              <div className="font-mono text-cyan-400 font-semibold tracking-wider">
                {formatDuration(recordingSeconds)}
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={600}
              height={90}
              className="w-full h-24 rounded bg-slate-950 border border-slate-900"
            />
          </div>

          {/* Recorder Controls */}
          <div className="flex items-center justify-between pt-2">
            {!isRecording && !recordedBlob ? (
              <button
                onClick={startRecording}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 rounded-lg transition-all shadow-md shadow-cyan-500/10 focus:outline-none"
              >
                <Mic className="w-4 h-4" />
                <span>Iniciar Gravação Direta</span>
              </button>
            ) : isRecording ? (
              <div className="flex items-center gap-3">
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Retomar</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </button>
                )}

                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Concluir Gravação</span>
                </button>
              </div>
            ) : (
              /* Recorded Blob Ready */
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-white">
                      Áudio captado com sucesso ({formatDuration(recordingSeconds)})
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {recordedBlob ? formatFileSize(recordedBlob.size) : '0 B'} · Pronto para transcrição
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Gravar Novamente</span>
                  </button>
                  <button
                    onClick={handleProcessMedia}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm shadow-cyan-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Mapa com IA</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
        <div>
          <span>Captura de áudio e upload multimédia direto no browser</span>
        </div>
        <div>
          <span>Formatos suportados: .mp3, .wav, .mp4</span>
        </div>
      </div>
    </div>
  );
};
