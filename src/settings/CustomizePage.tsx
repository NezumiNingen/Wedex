import { ImagePlus, Palette, RotateCcw } from 'lucide-react';
import { useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { t } from '../lib/i18n';

type AvatarKind = 'userAvatar' | 'assistantAvatar';

export function CustomizePage() {
  const { settings, updateSettings } = useAppStore(); const tr = (key: Parameters<typeof t>[1]) => t(settings.language, key);
  const userInput = useRef<HTMLInputElement>(null);
  const assistantInput = useRef<HTMLInputElement>(null);
  const choose = (kind: AvatarKind) => (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => updateSettings({ [kind]: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const Card = ({ kind, label, fallback, input }: { kind: AvatarKind; label: string; fallback: string; input: { current: HTMLInputElement | null } }) => {
    const image = settings[kind];
    return <section className="avatar-card"><div className="avatar-preview">{image ? <img src={image} alt={label}/> : fallback}</div><div><h3>{label}</h3><p>{tr('avatarUse')}</p><div className="avatar-actions"><button onClick={() => input.current?.click()}><ImagePlus size={16}/>{tr('chooseImage')}</button>{image && <button className="secondary" onClick={() => updateSettings({ [kind]: undefined })}><RotateCcw size={16}/>{tr('reset')}</button>}</div><input ref={input} type="file" accept="image/*" hidden onChange={(event) => choose(kind)(event.target.files?.[0])}/></div></section>;
  };
  return <main className="customize-page"><header><Palette size={22}/><div><h1>{tr('customization')}</h1><p>{tr('avatarIntro')}</p></div></header><div className="avatar-grid"><Card kind="userAvatar" label={tr('mine')} fallback={tr('you')} input={userInput}/><Card kind="assistantAvatar" label={tr('assistant')} fallback="C" input={assistantInput}/></div></main>;
}
