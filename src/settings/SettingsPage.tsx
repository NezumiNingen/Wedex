import { Database, Download, Moon, ShieldCheck, SlidersHorizontal, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../stores/appStore';
import { t } from '../lib/i18n';
import { cliAdapter } from '../services/codexAdapter';
import { kimiAdapter } from '../services/kimiAdapter';
import type { AgentProvider } from '../types';

export function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const tr = (key: Parameters<typeof t>[1]) => t(settings.language, key);
  const [cliState, setCliState] = useState({ installed: false, text: t(settings.language, 'detectingCli') });
  const isKimi = settings.provider === 'kimi';
  const selectedPath = isKimi ? settings.kimiCliPath : settings.cliPath;

  const chooseCli = async () => {
    const path = await open({ multiple: false, directory: false, title: tr(isKimi ? 'chooseKimiCli' : 'chooseCli') });
    if (typeof path === 'string') updateSettings(isKimi ? { kimiCliPath: path } : { cliPath: path });
  };

  useEffect(() => {
    setCliState({ installed: false, text: t(settings.language, 'detectingCli') });
    const adapter = settings.provider === 'kimi' ? kimiAdapter : cliAdapter;
    const fallbackName = settings.provider === 'kimi' ? 'Kimi Code CLI' : 'Codex CLI';
    void adapter.check(selectedPath)
      .then((result) => setCliState({ installed: result.installed, text: result.installed ? `${t(settings.language, 'cliFound')} ${fallbackName} ${result.version ?? ''}`.trim() : result.error ?? t(settings.language, 'cliNotFound') }))
      .catch(() => setCliState({ installed: false, text: t(settings.language, 'cliUnavailable') }));
  }, [selectedPath, settings.language, settings.provider]);

  return <main className="settings-page"><header><SlidersHorizontal size={22}/><div><h1>{tr('settings')}</h1><p>{tr('settingsIntro')}</p></div></header>
    <section><h3>{isKimi ? 'Kimi' : 'Codex'}</h3><p className={`cli-status ${cliState.installed ? 'ready' : 'missing'}`}>{cliState.text}</p>
      <label>{tr('provider')}<select value={settings.provider} onChange={(event) => updateSettings({ provider: event.target.value as AgentProvider })}><option value="codex">Codex</option><option value="kimi">Kimi</option></select></label>
      <label>{tr('runMode')}<select value={settings.adapter} onChange={(event) => updateSettings({ adapter: event.target.value as 'mock' | 'cli' })}><option value="mock">{tr('mockMode')}</option><option value="cli">{isKimi ? 'Kimi Code CLI' : 'Codex CLI'}</option></select></label>
      <label>{tr('defaultModel')}<input value={isKimi ? settings.kimiModel : settings.model} placeholder={isKimi ? tr('cliDefaultModel') : undefined} onChange={(event) => updateSettings(isKimi ? { kimiModel: event.target.value } : { model: event.target.value })}/></label>
      <label className="cli-path">{tr('cliPath')}<span><input value={selectedPath} onChange={(event) => updateSettings(isKimi ? { kimiCliPath: event.target.value } : { cliPath: event.target.value })}/><button type="button" onClick={() => void chooseCli()}>{tr('chooseProgram')}</button></span></label>
      {!isKimi && <label>{tr('defaultPermission')}<select value={settings.permission} onChange={(event) => updateSettings({ permission: event.target.value as typeof settings.permission })}><option value="read-only">{tr('readOnly')}</option><option value="workspace-write">{tr('workspaceWrite')}</option><option value="full-access">{tr('fullAccess')}</option></select></label>}
      {isKimi && <p className="muted">{tr('kimiPermissionNotice')}</p>}
    </section>
    <section><h3>{tr('appearance')}</h3>
      <label>{tr('language')}<select value={settings.language ?? 'zh-CN'} onChange={(event) => updateSettings({ language: event.target.value as 'zh-CN' | 'en-US' })}><option value="zh-CN">{tr('chinese')}</option><option value="en-US">{tr('english')}</option></select></label>
      <label>{tr('theme')}<select value={settings.theme} onChange={(event) => updateSettings({ theme: event.target.value as typeof settings.theme })}><option value="system">{tr('system')}</option><option value="light">{tr('light')} <Sun size={13}/></option><option value="dark">{tr('dark')} <Moon size={13}/></option></select></label>
      <label>{tr('fontSize')}<input type="range" min="12" max="18" value={settings.fontSize} onChange={(event) => updateSettings({ fontSize: Number(event.target.value) })}/>{settings.fontSize}px</label>
      <Toggle label={tr('sendNotification')} checked={settings.notifications} onChange={(notifications) => updateSettings({ notifications })}/><Toggle label={tr('autoScroll')} checked={settings.autoScroll} onChange={(autoScroll) => updateSettings({ autoScroll })}/><Toggle label={tr('compactLayout')} checked={settings.compact} onChange={(compact) => updateSettings({ compact })}/>
    </section>
    <section><h3>{tr('privacy')}</h3><p className="muted"><Database size={15}/>{tr('privacyIntro')}</p><div className="settings-buttons"><button><Download size={16}/>{tr('exportChats')}</button><button className="danger"><ShieldCheck size={16}/>{tr('clearCache')}</button></div></section>
  </main>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(value: boolean): void }) { return <label className="toggle-row">{label}<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/></label>; }
