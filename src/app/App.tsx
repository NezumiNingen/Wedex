import { useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { ChatView } from '../chat/ChatView';
import { NavRail } from '../layout/NavRail';
import { ProjectList } from '../projects/ProjectList';
import { SettingsPage } from '../settings/SettingsPage';
import { CustomizePage } from '../settings/CustomizePage';
import { useAppStore } from '../stores/appStore';
import { t } from '../lib/i18n';

type ResizeDirection = 'East' | 'North' | 'NorthEast' | 'NorthWest' | 'South' | 'SouthEast' | 'SouthWest' | 'West';
type ResizeCursor = 'ew' | 'ns' | 'nesw' | 'nwse';

const resizeHandles: Array<{ direction: ResizeDirection; cursor: ResizeCursor; className: string }> = [
  { direction: 'North', cursor: 'ns', className: 'resize-n' },
  { direction: 'East', cursor: 'ew', className: 'resize-e' },
  { direction: 'South', cursor: 'ns', className: 'resize-s' },
  { direction: 'West', cursor: 'ew', className: 'resize-w' },
  { direction: 'NorthEast', cursor: 'nesw', className: 'resize-ne' },
  { direction: 'NorthWest', cursor: 'nwse', className: 'resize-nw' },
  { direction: 'SouthEast', cursor: 'nwse', className: 'resize-se' },
  { direction: 'SouthWest', cursor: 'nesw', className: 'resize-sw' },
];

const setResizeCursor = (cursor?: ResizeCursor) => {
  if (cursor) document.documentElement.dataset.resizeCursor = cursor;
  else delete document.documentElement.dataset.resizeCursor;
};

export function App() {
  const { view, setView, newSession, addProject, cancel, settings } = useAppStore();
  const appWindow = getCurrentWindow();

  useEffect(() => { void invoke('ensure_wedex_root').catch(console.error); }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.lang = settings.language ?? 'zh-CN';
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    const handler = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); void newSession(); }
      if (event.key.toLowerCase() === 'o') { event.preventDefault(); const path = window.prompt(t(settings.language, 'promptProjectPath')); if (path) addProject(path); }
      if (event.key === ',') { event.preventDefault(); setView('settings'); }
      if (event.key === 'Escape') cancel();
    };
    const clearCursor = () => setResizeCursor();
    window.addEventListener('keydown', handler);
    window.addEventListener('mouseup', clearCursor);
    window.addEventListener('blur', clearCursor);
    document.documentElement.addEventListener('mouseleave', clearCursor);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mouseup', clearCursor);
      window.removeEventListener('blur', clearCursor);
      document.documentElement.removeEventListener('mouseleave', clearCursor);
      clearCursor();
    };
  }, [settings.theme, settings.language, settings.fontSize, addProject, cancel, newSession, setView]);

  const startWindowDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button,input,textarea,select,a,[role="button"],.project-row,.bubble,.composer,.message,.resize-handle')) return;
    void appWindow.startDragging().catch(console.error);
  };
  const startResize = (direction: ResizeDirection) => (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    void appWindow.startResizeDragging(direction).catch(console.error);
  };

  return <div className="app-shell" onMouseDown={startWindowDrag}>
    <div className="window-drag-strip" data-tauri-drag-region/>
    {resizeHandles.map((handle) => <div key={handle.direction} className={`resize-handle ${handle.className}`} onMouseEnter={() => setResizeCursor(handle.cursor)} onMouseLeave={() => setResizeCursor()} onMouseDown={startResize(handle.direction)}/>)}
    <NavRail/>
    <ProjectList/>
    {view === 'settings' ? <SettingsPage/> : view === 'customize' ? <CustomizePage/> : <ChatView/>}
  </div>;
}
