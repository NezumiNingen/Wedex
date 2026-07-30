import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { CliStatus, CodexEvent } from '../types';
import { t, type Language } from '../lib/i18n';

interface WireEvent {
  type: string;
  content: string;
  status: string;
  metadata: Record<string, unknown>;
}

const messageTypes = new Set<CodexEvent['type']>(['user', 'assistant', 'thinking', 'status', 'command', 'command_result', 'file_read', 'file_edit', 'diff', 'approval', 'error', 'completed', 'system', 'raw_log']);
const statuses = new Set<CodexEvent['status']>(['idle', 'starting', 'thinking', 'running', 'waiting_approval', 'completed', 'cancelled', 'error']);

function normalise(event: WireEvent): CodexEvent {
  const metadata: NonNullable<CodexEvent['metadata']> = {};
  for (const [key, value] of Object.entries(event.metadata)) {
    metadata[key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value);
  }
  return {
    type: messageTypes.has(event.type as CodexEvent['type']) ? event.type as CodexEvent['type'] : 'raw_log',
    content: event.content,
    status: statuses.has(event.status as CodexEvent['status']) ? event.status as CodexEvent['status'] : 'running',
    metadata,
  };
}

export const kimiAdapter = {
  check: (cliPath: string) => invoke<CliStatus>('check_kimi', { cliPath }),
  async run(
    cwd: string,
    prompt: string,
    cliPath: string,
    model: string,
    sessionId: string | undefined,
    language: Language | undefined,
    onEvent: (event: CodexEvent) => void,
  ): Promise<void> {
    const unlisten = await listen<WireEvent>('kimi-event', ({ payload }) => {
      const event = normalise(payload);
      onEvent(event);
      if (event.type === 'completed' || event.type === 'error') void unlisten();
    });
    onEvent({ type: 'status', content: t(language, 'startingKimiCli'), status: 'starting' });
    try {
      await invoke('start_kimi_task', {
        cwd,
        prompt,
        cliPath,
        sessionId,
        model: model.trim() || null,
      });
    } catch (error) {
      void unlisten();
      throw error;
    }
  },
  cancel: () => invoke('cancel_kimi_task'),
};
