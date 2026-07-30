export interface ContextAttachment {
  path: string;
  name: string;
}

const imageExtensions = new Set(['avif', 'bmp', 'gif', 'heic', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

export function attachmentsFromPaths(paths: string[]): ContextAttachment[] {
  const seen = new Set<string>();
  return paths
    .map((path) => path.trim())
    .filter((path) => path.length > 0 && !seen.has(path) && (seen.add(path), true))
    .map((path) => ({ path, name: path.split(/[\\/]/).filter(Boolean).pop() || path }));
}

export function isImageAttachment(path: string): boolean {
  const extension = path.split('.').pop()?.toLowerCase();
  return extension !== undefined && imageExtensions.has(extension);
}

export function displayPrompt(text: string, attachments: ContextAttachment[], language: 'zh-CN' | 'en-US' | undefined): string {
  const message = text.trim() || (language === 'en-US' ? 'Please review the attached context.' : '请查看我附加的上下文。');
  if (attachments.length === 0) return message;
  const title = language === 'en-US' ? 'Attached context:' : '已附加上下文：';
  return `${message}\n\n${title}\n${attachments.map((item) => `• ${item.name}`).join('\n')}`;
}

export function taskPrompt(text: string, attachments: ContextAttachment[], language: 'zh-CN' | 'en-US' | undefined): string {
  const message = text.trim() || (language === 'en-US' ? 'Please review the attached context.' : '请查看我附加的上下文。');
  if (attachments.length === 0) return message;
  const instruction = language === 'en-US'
    ? 'These paths were explicitly attached by the user. Inspect the relevant files or folders as context. Do not modify them unless the user asks you to.'
    : '以下路径由用户明确附加。请将相关文件或文件夹作为上下文检查；除非用户要求，否则不要修改它们。';
  return `${message}\n\n<wedex_attached_context>\n${instruction}\n${attachments.map((item) => `- ${item.path}`).join('\n')}\n</wedex_attached_context>`;
}
