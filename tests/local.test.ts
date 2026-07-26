import { describe, expect, it } from 'vitest';
import { shortPath } from '../src/lib/id';
describe('path display', () => { it('keeps short paths readable', () => expect(shortPath('/work/demo')).toBe('/work/demo')); it('truncates long paths', () => expect(shortPath('/a/very/long/path/that/contains/many/nested/project/directories/and/files')).toMatch(/^…/)); });
