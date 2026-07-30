import type { Message, Project, Session, Settings } from '../types';
const KEY = 'wedex-state-v1';
export interface Persisted { projects: Project[]; sessions: Session[]; messages: Message[]; settings: Settings; }
export const defaults: Settings = { theme: 'system', language: 'zh-CN', adapter: 'cli', provider: 'codex', model: 'gpt-5.3-codex', kimiModel: '', permission: 'workspace-write', notifications: true, autoScroll: true, compact: false, logExpanded: false, diffMode: 'inline', fontSize: 14, cliPath: 'codex', kimiCliPath: 'kimi', userAvatar: undefined, assistantAvatar: undefined };
export function load(): Persisted {
  try {
    const value = localStorage.getItem(KEY);
    if (value) {
      const parsed = JSON.parse(value) as Persisted;
      return { ...parsed, settings: { ...defaults, ...parsed.settings } };
    }
  } catch { /* recovered with defaults */ }
  return { projects: [], sessions: [], messages: [], settings: defaults };
}
export function save(state: Persisted): void { localStorage.setItem(KEY, JSON.stringify({ ...state, messages: state.messages.slice(-800) })); }
