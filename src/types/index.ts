export type CodexStatus = 'idle' | 'starting' | 'thinking' | 'running' | 'waiting_approval' | 'completed' | 'cancelled' | 'error';
export type MessageType = 'user' | 'assistant' | 'thinking' | 'status' | 'command' | 'command_result' | 'file_read' | 'file_edit' | 'diff' | 'approval' | 'error' | 'completed' | 'system' | 'raw_log';
export type AgentProvider = 'codex' | 'kimi';
export interface Message { id: string; sessionId: string; projectId: string; type: MessageType; content: string; createdAt: number; status: CodexStatus; metadata: Record<string, string | number | boolean | undefined>; }
export interface Project { id: string; name: string; path: string; branch?: string; updatedAt: number; pinned: boolean; unavailable?: boolean; currentSessionId: string; }
export interface Session { id: string; projectId: string; title: string; updatedAt: number; status: CodexStatus; providerSessionIds?: Partial<Record<AgentProvider, string>>; }
export interface Settings { theme: 'light' | 'dark' | 'system'; language?: 'zh-CN' | 'en-US'; adapter: 'mock' | 'cli'; provider: AgentProvider; model: string; kimiModel: string; permission: 'read-only' | 'workspace-write' | 'full-access'; notifications: boolean; autoScroll: boolean; compact: boolean; logExpanded: boolean; diffMode: 'inline' | 'side-by-side'; fontSize: number; cliPath: string; kimiCliPath: string; userAvatar?: string; assistantAvatar?: string; }
export interface CodexEvent { type: MessageType; content: string; status: CodexStatus; metadata?: Message['metadata']; }
export interface CliStatus { installed: boolean; version?: string; error?: string; }
