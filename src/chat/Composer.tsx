import { FilePlus2, FolderPlus, Paperclip, Send, Square, Trash2, X } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';
import { t } from '../lib/i18n';
import { useAppStore } from '../stores/appStore';
import { attachmentsFromPaths, type ContextAttachment } from '../context/attachments';

export function Composer() {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ContextAttachment[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const { send, running, cancel, selectedProjectId, settings } = useAppStore();
  const tr = (key: Parameters<typeof t>[1]) => t(settings.language, key);
  const addPaths = useCallback((paths: string[]) => setAttachments((current) => attachmentsFromPaths([...current.map((item) => item.path), ...paths])), []);
  const removeAttachment = (path: string) => setAttachments((current) => current.filter((item) => item.path !== path));
  const submit = () => { if (!text.trim() && attachments.length === 0) return; void send(text, attachments); setText(''); setAttachments([]); };
  const chooseContext = async (directory: boolean) => {
    setPickerOpen(false);
    const selected = await open({
      title: directory ? tr('chooseContextFolder') : tr('chooseContextFiles'),
      directory,
      multiple: true,
      fileAccessMode: 'scoped',
    });
    if (selected) addPaths(Array.isArray(selected) ? selected : [selected]);
  };
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === 'enter' || event.payload.type === 'over') setDropActive(true);
      if (event.payload.type === 'leave') setDropActive(false);
      if (event.payload.type === 'drop') { setDropActive(false); addPaths(event.payload.paths); }
    }).then((stop) => { unlisten = stop; }).catch(() => undefined);
    return () => unlisten?.();
  }, [addPaths]);
  return <footer className={`composer${dropActive ? ' is-drop-target' : ''}`}>
    {dropActive && <div className="composer-drop-overlay">{tr('dropContextHere')}</div>}
    {attachments.length > 0 && <div className="composer-attachments" aria-label={tr('attachedContext')}>
      {attachments.map((item) => <span className="attachment-chip" key={item.path} title={item.path}><Paperclip size={13}/><span>{item.name}</span><button type="button" aria-label={tr('removeAttachment')} title={tr('removeAttachment')} onClick={() => removeAttachment(item.path)}><X size={13}/></button></span>)}
    </div>}
    <div className="composer-tools"><div className="context-picker"><button type="button" disabled={!selectedProjectId} title={tr('addContext')} aria-label={tr('addContext')} data-tooltip={tr('addContext')} onClick={() => setPickerOpen((open) => !open)}><Paperclip size={17}/></button>{pickerOpen && <div className="context-picker-menu"><button type="button" onClick={() => void chooseContext(false)}><FilePlus2 size={15}/>{tr('chooseContextFiles')}</button><button type="button" onClick={() => void chooseContext(true)}><FolderPlus size={15}/>{tr('chooseContextFolder')}</button></div>}</div><span>{settings.provider === 'kimi' ? 'Kimi Code' : settings.permission}</span><span className="tokens">{text.length} {tr('characters')}</span></div><textarea disabled={!selectedProjectId} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); submit(); } }} placeholder={selectedProjectId ? tr('taskPlaceholder') : tr('selectProjectFirst')} rows={3}/><div className="composer-footer"><button className="clear" title={tr('clearInput')} data-tooltip={tr('clearInput')} onClick={() => { setText(''); setAttachments([]); }}><Trash2 size={15}/>{tr('clear')}</button>{running ? <button className="stop" title={tr('stopTask')} data-tooltip={tr('stopTask')} onClick={cancel}><Square size={15}/>{tr('stop')}</button> : <button className="send" title={tr('sendMessage')} data-tooltip={tr('sendMessage')} disabled={(!text.trim() && attachments.length === 0) || !selectedProjectId} onClick={submit}><Send size={16}/>{tr('send')}</button>}</div></footer>;
}
