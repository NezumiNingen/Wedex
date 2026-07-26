import { useEffect } from 'react';
import { ChatView } from '../chat/ChatView';
import { NavRail } from '../layout/NavRail';
import { ProjectList } from '../projects/ProjectList';
import { SettingsPage } from '../settings/SettingsPage';
import { CustomizePage } from '../settings/CustomizePage';
import { useAppStore } from '../stores/appStore';
export function App() { const { view, setView, newSession, addProject, cancel, settings } = useAppStore(); useEffect(() => { document.documentElement.dataset.theme = settings.theme; document.documentElement.lang = settings.language ?? 'zh-CN'; document.documentElement.style.fontSize = `${settings.fontSize}px`; const handler = (e: KeyboardEvent) => { if (!e.metaKey && !e.ctrlKey) return; if (e.key.toLowerCase() === 'n') { e.preventDefault(); newSession(); } if (e.key.toLowerCase() === 'o') { e.preventDefault(); const path = window.prompt('输入本地项目绝对路径'); if (path) addProject(path); } if (e.key === ',') { e.preventDefault(); setView('settings'); } if (e.key === 'Escape') cancel(); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [settings.theme, settings.language, settings.fontSize, addProject, cancel, newSession, setView]); return <div className="app-shell"><NavRail /><ProjectList />{view === 'settings' ? <SettingsPage /> : view === 'customize' ? <CustomizePage /> : <ChatView />}</div>; }
