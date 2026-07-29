import type { CodexEvent } from '../types';
import type { Language } from '../lib/i18n';
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export async function runMockTask(prompt: string, language: Language | undefined, onEvent: (event: CodexEvent) => void, aborted: () => boolean): Promise<void> {
  const events: CodexEvent[] = [
    { type: 'thinking', content: language === 'en-US' ? 'Analyzing the task and checking project context…' : '正在分析任务并检查项目上下文…', status: 'thinking' },
    { type: 'file_read', content: language === 'en-US' ? 'Read file' : '读取文件', status: 'running', metadata: { path: 'src/App.tsx', operation: 'read' } },
    { type: 'command', content: 'pnpm test', status: 'running', metadata: { cwd: '.', command: 'pnpm test' } },
    { type: 'command_result', content: '✓ 3 tests passed\nDuration 423ms', status: 'running', metadata: { exitCode: 0 } },
    { type: 'file_edit', content: language === 'en-US' ? 'Update file' : '更新文件', status: 'running', metadata: { path: 'src/components/TaskPanel.tsx', operation: 'edit' } },
    { type: 'diff', content: '@@ -10,3 +10,7 @@\n+export function TaskPanel() {\n+  return <section>任务已更新</section>;\n+}', status: 'running', metadata: { path: 'src/components/TaskPanel.tsx', additions: 3, deletions: 0 } },
    { type: 'assistant', content: language === 'en-US' ? `I completed a simulated run for “${prompt.slice(0, 80)}”.\n\n- Checked the project structure\n- Ran validation commands\n- Generated an example file change\n\nSwitch to **Codex CLI** mode to run real tasks inside the selected project.` : `我已完成对「${prompt.slice(0, 80)}」的模拟处理。\n\n- 已检查项目结构\n- 已运行验证命令\n- 已生成一个示例文件变更\n\n切换到 **Codex CLI** 模式后，应用会在所选项目目录中执行真实任务。`, status: 'running' },
    { type: 'completed', content: language === 'en-US' ? 'Task complete · 1 file changed · 1 command' : '任务完成 · 1 个文件修改 · 1 条命令', status: 'completed', metadata: { duration: '3.2s', files: 1, commands: 1 } }
  ];
  for (const event of events) { if (aborted()) return; await pause(event.type === 'assistant' ? 550 : 350); onEvent(event); }
}
