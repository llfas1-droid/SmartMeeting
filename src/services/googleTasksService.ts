import { TaskItem } from '../types/index.ts';

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
  notes?: string;
  updated?: string;
  webViewLink?: string;
}

// Fetch all task lists for the user
export async function fetchGoogleTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao obter listas de tarefas do Google Tasks (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    updated: item.updated,
  }));
}

// Create a new task list (e.g. for a specific meeting)
export async function createGoogleTaskList(accessToken: string, title: string): Promise<GoogleTaskList> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao criar nova lista no Google Tasks (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    updated: data.updated,
  };
}

// Fetch tasks from a specific list
export async function fetchTasksFromList(accessToken: string, taskListId: string): Promise<GoogleTask[]> {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao obter tarefas do Google Tasks (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.items || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due: t.due,
    notes: t.notes,
    updated: t.updated,
    webViewLink: t.webViewLink,
  }));
}

// Insert a single task into Google Tasks
export async function createGoogleTask(
  accessToken: string,
  taskListId: string,
  task: {
    title: string;
    notes?: string;
    dueDate?: string; // YYYY-MM-DD
  }
): Promise<GoogleTask> {
  const body: Record<string, any> = {
    title: task.title,
  };

  if (task.notes) {
    body.notes = task.notes;
  }

  if (task.dueDate) {
    // Google Tasks requires RFC 3339 formatted timestamp, e.g. 2026-10-28T00:00:00.000Z
    const dateObj = new Date(task.dueDate);
    if (!isNaN(dateObj.getTime())) {
      body.due = dateObj.toISOString();
    }
  }

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao criar tarefa no Google Tasks (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    status: data.status,
    due: data.due,
    notes: data.notes,
  };
}

// Sync all approved tasks to a Google Task list
export async function syncApprovedTasksToGoogleList(
  accessToken: string,
  taskListId: string,
  tasks: TaskItem[],
  meetingTitle: string
): Promise<{ successCount: number; createdTasks: GoogleTask[] }> {
  const createdTasks: GoogleTask[] = [];

  for (const task of tasks) {
    // Format notes with assignee and quote snippet from meeting
    const notesContent = [
      `Responsável: ${task.assignee.name} (${task.assignee.role})`,
      `Email: ${task.assignee.email}`,
      `Prioridade: ${task.priority.toUpperCase()}`,
      task.estimatedHours ? `Estimativa: ${task.estimatedHours} horas` : null,
      task.description ? `\nDescrição: ${task.description}` : null,
      task.contextSnippet ? `\nContexto da Reunião: "${task.contextSnippet}"` : null,
      `\nOrigem: SmartMeeting · Reunião "${meetingTitle}"`
    ].filter(Boolean).join('\n');

    const created = await createGoogleTask(accessToken, taskListId, {
      title: `[${task.priority.toUpperCase()}] ${task.title}`,
      notes: notesContent,
      dueDate: task.dueDate,
    });

    createdTasks.push(created);
  }

  return {
    successCount: createdTasks.length,
    createdTasks,
  };
}
