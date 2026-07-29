import { ChevronDown, Copy, FileCode2, Terminal } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types';
import { t } from '../lib/i18n';
import { useAppStore } from '../stores/appStore';

export function MessageCard({ message }: { message: Message }) {
  const [open, setOpen] = useState(message.type !== 'command_result');
  const { settings } = useAppStore();
  const tr = (key: Parameters<typeof t>[1]) => t(settings.language, key);
  const copy = () => void navigator.clipboard.writeText(message.content);
  const avatar = (kind: 'user' | 'assistant') => { const source = kind === 'user' ? settings.userAvatar : settings.assistantAvatar; return <div className={`mini-avatar ${kind}`}>{source ? <img src={source} alt={kind === 'user' ? tr('myAvatar') : tr('assistantAvatar')}/> : kind === 'user' ? tr('you') : 'C'}</div>; };
  if (message.type === 'user') return <div className="message user-message"><div className="bubble">{message.content}</div>{avatar('user')}</div>;
  if (message.type === 'assistant') return <div className="message">{avatar('assistant')}<article className="bubble markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown><button className="copy-small" onClick={copy} title={tr('copyReply')} aria-label={tr('copyReply')} data-tooltip={tr('copyReply')}><Copy size={14}/></button></article></div>;
  if (message.type === 'error') return <div className="message">{avatar('assistant')}<article className="bubble assistant-error">{message.content}</article></div>;
  if (message.type === 'thinking' || message.type === 'completed' || message.type === 'system' || message.type === 'status' || message.type === 'raw_log' || message.type === 'command' || message.type === 'command_result' || message.type === 'file_read' || message.type === 'file_edit' || message.type === 'diff' || message.type === 'approval') return null;
  const command = message.type === 'command' || message.type === 'command_result'; const diff = message.type === 'diff'; const file = message.type === 'file_read' || message.type === 'file_edit';
  return <section className={`tool-card ${diff ? 'diff-card' : ''}`}><header><span>{command ? <Terminal size={15}/> : <FileCode2 size={15}/>} {diff ? tr('fileDiff') : command ? tr('commandRun') : file ? tr('fileOperation') : message.type === 'error' ? tr('error') : tr('log')}</span><div><button onClick={copy} title={tr('copyContent')} aria-label={tr('copyContent')} data-tooltip={tr('copyContent')}><Copy size={14}/></button><button title={open ? tr('collapse') : tr('expand')} aria-label={open ? tr('collapse') : tr('expand')} data-tooltip={open ? tr('collapse') : tr('expand')} onClick={() => setOpen(!open)}><ChevronDown size={15} className={open ? '' : 'rotate'}/></button></div></header>{open && <div className="tool-content">{message.metadata.path && <p className="path">{String(message.metadata.path)}</p>}{message.metadata.command && <code>{String(message.metadata.command)}</code>}<pre>{message.content}</pre>{message.metadata.exitCode !== undefined && <p className="exit">Exit code {String(message.metadata.exitCode)}</p>}</div>}</section>;
}
