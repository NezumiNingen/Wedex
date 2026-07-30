import { describe, expect, it } from 'vitest';
import { attachmentsFromPaths, displayPrompt, isImageAttachment, taskPrompt } from './attachments';

describe('context attachments', () => {
  it('deduplicates paths and preserves a usable file name', () => {
    expect(attachmentsFromPaths(['/tmp/notes.md', '/tmp/notes.md', ' /tmp/site '])).toEqual([
      { path: '/tmp/notes.md', name: 'notes.md' },
      { path: '/tmp/site', name: 'site' },
    ]);
  });

  it('builds a safe visible message and a full task context', () => {
    const attachments = attachmentsFromPaths(['/tmp/notes.md']);
    expect(displayPrompt('Review this', attachments, 'en-US')).toContain('• notes.md');
    expect(taskPrompt('Review this', attachments, 'en-US')).toContain('/tmp/notes.md');
  });

  it('recognises image paths for native Codex image input', () => {
    expect(isImageAttachment('/tmp/example.HEIC')).toBe(true);
    expect(isImageAttachment('/tmp/example.md')).toBe(false);
  });
});
