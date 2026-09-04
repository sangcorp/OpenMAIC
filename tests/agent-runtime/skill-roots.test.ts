import { describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => {
  // vi.hoisted runs before the transformed imports are initialized.
  /* eslint-disable @typescript-eslint/no-require-imports -- vi.hoisted runs before imports. */
  const { mkdirSync, mkdtempSync, writeFileSync } = require('node:fs') as typeof import('node:fs');
  const { tmpdir } = require('node:os') as typeof import('node:os');
  const { join } = require('node:path') as typeof import('node:path');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const localRoot = mkdtempSync(join(tmpdir(), 'openmaic-local-skills-'));
  const sangaiRoot = mkdtempSync(join(tmpdir(), 'openmaic-sangai-skills-'));
  const writeSkill = (root: string, id: string) => {
    const dir = join(root, id);
    mkdirSync(dir);
    writeFileSync(
      join(dir, 'SKILL.md'),
      `---\nname: ${id}\ndescription: ${id} skill\n---\n\n# ${id}\n`,
      'utf8',
    );
  };
  writeSkill(localRoot, 'classroom-skill');
  writeSkill(sangaiRoot, 'sangai-skill');
  process.env.OPENMAIC_AGENT_SKILLS_DIRS = `${localRoot}:${sangaiRoot}`;
  return { localRoot, sangaiRoot };
});

import { listSkills } from '@/lib/server/agent-runtime/skills';

describe('configured skill roots', () => {
  it('loads skills from every configured root', async () => {
    const loaded = await listSkills();

    expect(loaded.map((skill) => skill.id)).toEqual(['classroom-skill', 'sangai-skill']);
    expect(loaded.every((skill) => skill.source === 'builtin')).toBe(true);
    expect(loaded[0]?.filePath.startsWith(fixture.localRoot)).toBe(true);
    expect(loaded[1]?.filePath.startsWith(fixture.sangaiRoot)).toBe(true);
  });
});
