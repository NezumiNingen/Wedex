import { Paperclip, Send, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { t } from '../lib/i18n';
import { useAppStore } from '../stores/appStore';

export function Composer() {
  const [text, setText] = useState('');
  const { send, running, cancel, selectedProjectId, settings } = useAppStore();
  const tr = (key: Parameters<typeof t>[1]) => t(settings.language, key);
  const submit = () => { void send(text); setText(''); };
  return <footer className="composer"><div className="composer-tools"><button title={tr('addContext')} aria-label={tr('addContext')} data-tooltip={tr('addContext')}><Paperclip size={17}/></button><span>{settings.permission}</span><span className="tokens">{text.length} {tr('characters')}</span></div><textarea disabled={!selectedProjectId} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); submit(); } }} placeholder={selectedProjectId ? tr('taskPlaceholder') : tr('selectProjectFirst')} rows={3}/><div className="composer-footer"><button className="clear" title={tr('clearInput')} data-tooltip={tr('clearInput')} onClick={() => setText('')}><Trash2 size={15}/>{tr('clear')}</button>{running ? <button className="stop" title={tr('stopTask')} data-tooltip={tr('stopTask')} onClick={cancel}><Square size={15}/>{tr('stop')}</button> : <button className="send" title={tr('sendMessage')} data-tooltip={tr('sendMessage')} disabled={!text.trim() || !selectedProjectId} onClick={submit}><Send size={16}/>{tr('send')}</button>}</div></footer>;
}
