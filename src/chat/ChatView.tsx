import { Bot, FolderOpen, GitBranch } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Composer } from './Composer';
import { MessageCard } from '../messages/MessageCard';
import { shortPath } from '../lib/id';
import { t } from '../lib/i18n';
import { useAppStore } from '../stores/appStore';

export function ChatView() {
  const { projects, messages, selectedProjectId, selectedSessionId, settings, running, activity } = useAppStore();
  const tr = (key: Parameters<typeof t>[1]) => t(settings.language, key);
  const scrollRef = useRef<HTMLDivElement>(null);
  const project = projects.find((item) => item.id === selectedProjectId);
  const visible = messages.filter((message) => message.sessionId === selectedSessionId);
  const pinLatest = useCallback(() => { const area = scrollRef.current; if (area && settings.autoScroll) area.scrollTop = area.scrollHeight; }, [settings.autoScroll]);
  useLayoutEffect(() => { pinLatest(); const frame = requestAnimationFrame(pinLatest); return () => cancelAnimationFrame(frame); });
  useEffect(() => { const area = scrollRef.current; if (!area || !settings.autoScroll) return; const resizeObserver = new ResizeObserver(pinLatest); const mutationObserver = new MutationObserver(pinLatest); resizeObserver.observe(area); mutationObserver.observe(area, { childList: true, subtree: true, characterData: true }); return () => { resizeObserver.disconnect(); mutationObserver.disconnect(); }; }, [pinLatest, settings.autoScroll]);

  if (!project) return <main className="welcome"><div className="welcome-mark"><Bot size={42}/></div><h1>{tr('welcome')}</h1><p>{tr('welcomeDescription')}</p><p className="muted">{tr('welcomeHint')}</p><div className="tips"><kbd>⌘/Ctrl O</kbd> {tr('addProject')} <kbd>⌘/Ctrl K</kbd> {tr('search')} <kbd>⌘/Ctrl ,</kbd> {tr('settings')}</div></main>;
  return <main className="chat"><header className="chat-header"><div><h2>{running ? activity : project.name}</h2><p><FolderOpen size={13}/>{shortPath(project.path)} <GitBranch size={13}/>{project.branch ?? tr('nonGitRepository')}</p></div></header><div className="message-area" ref={scrollRef}>{visible.length === 0 && <div className="chat-empty"><Bot size={32}/><b>{tr('startNewTask')}</b><span>{tr('taskHint')}</span></div>}{visible.map((message) => <MessageCard key={message.id} message={message}/>)}</div><Composer /></main>;
}
