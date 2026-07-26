import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { CliStatus, CodexEvent } from '../types';
export interface CodexAdapter { check(cliPath: string): Promise<{ installed: boolean; version?: string; error?: string }>; run(cwd: string, prompt: string, cliPath: string, onEvent: (event: CodexEvent) => void): Promise<void>; cancel(): Promise<void>; }
interface WireEvent { type: string; content: string; status: string; metadata: Record<string, unknown>; }
const messageTypes = new Set<CodexEvent['type']>(['user', 'assistant', 'thinking', 'status', 'command', 'command_result', 'file_read', 'file_edit', 'diff', 'approval', 'error', 'completed', 'system', 'raw_log']);
const statuses = new Set<CodexEvent['status']>(['idle', 'starting', 'thinking', 'running', 'waiting_approval', 'completed', 'cancelled', 'error']);
function normalise(event: WireEvent): CodexEvent { const metadata: CodexEvent['metadata'] = {}; for (const [key, value] of Object.entries(event.metadata)) metadata[key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value); return { type: messageTypes.has(event.type as CodexEvent['type']) ? event.type as CodexEvent['type'] : 'raw_log', content: event.content, status: statuses.has(event.status as CodexEvent['status']) ? event.status as CodexEvent['status'] : 'running', metadata }; }
export const cliAdapter: CodexAdapter = {
  check: (cliPath) => invoke<CliStatus>('check_codex', { cliPath }),
  async run(cwd, prompt, cliPath, onEvent) { const unlisten = await listen<WireEvent>('codex-event', ({ payload }) => { const event = normalise(payload); onEvent(event); if (event.type === 'completed' || event.type === 'error') void unlisten(); }); onEvent({ type: 'status', content: '正在启动 Codex CLI…', status: 'starting' }); try { await invoke('start_codex_task', { cwd, prompt, sandbox: 'workspace-write', cliPath }); } catch (error) { void unlisten(); throw error; } },
  cancel: () => invoke('cancel_codex_task')
};
