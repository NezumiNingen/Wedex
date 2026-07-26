import type { Settings } from '../types';

export type Language = NonNullable<Settings['language']>;

const dictionary = {
  'zh-CN': { chat: '会话', projects: '项目', history: '任务历史', customize: '自定义头像', settings: '设置', account: '我的账号', customization: '自定义', avatarIntro: '设置聊天双方的头像。图片只保存在这台电脑上。', mine: '我的头像', assistant: 'wedex 头像', avatarUse: '用于聊天气泡旁的头像。', chooseImage: '选择图片', reset: '恢复默认', appearance: '外观与行为', language: '语言', chinese: '简体中文', english: 'English' },
  'en-US': { chat: 'Chats', projects: 'Projects', history: 'Task history', customize: 'Customize avatars', settings: 'Settings', account: 'My account', customization: 'Customization', avatarIntro: 'Set avatars for both sides of the chat. Images stay on this device.', mine: 'My avatar', assistant: 'wedex avatar', avatarUse: 'Shown beside chat bubbles.', chooseImage: 'Choose image', reset: 'Reset', appearance: 'Appearance & behavior', language: 'Language', chinese: '简体中文', english: 'English' },
} as const;

export function t(language: Language | undefined, key: keyof typeof dictionary['zh-CN']): string {
  return dictionary[language ?? 'zh-CN'][key];
}
