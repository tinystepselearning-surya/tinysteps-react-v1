import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8',
  );

const source = read(
  'functions/src/ai/refreshPublicKb.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C8 public KB Admin authorization', () => {
  it('authorizes the KB refresh callable from canonical Admin access only', () => {
    expect(source).toContain(
      'from "../helpers/canonicalAdminGuard"',
    );
    expect(source).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(source).not.toContain(
      'from "../helpers/adminGuard"',
    );
    expect(source).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });

  it('preserves the existing KB refresh mutation semantics', () => {
    expect(source).toContain(
      'const KB_JSON_URL = \`${SITE_ORIGIN}/kb.json\`;',
    );
    expect(source).toContain(
      'collection("public_kb_chunks")',
    );
    expect(source).toContain(
      '.limit(400)',
    );
    expect(source).toContain(
      'batch.set(ref, doc, { merge: true })',
    );
    expect(source).toContain(
      'retiredPathsDeactivated: RETIRED_PATHS',
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { refreshPublicKb } from "./ai/refreshPublicKb";',
    );
  });
});
