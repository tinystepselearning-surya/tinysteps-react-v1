import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { build, createLogger } from 'vite';

const expected = {
  '/blog/child-knows-letter-sounds-but-cannot-read': '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  '/blog/how-to-choose-phonics-classes': '/best-online-phonics-classes-for-kids-in-india',
  '/blog/best-online-phonics-classes-for-kids': '/best-online-phonics-classes-for-kids-in-india',
  '/blog/best-phonics-classes-for-kids': '/best-online-phonics-classes-for-kids-in-india',
  '/blog/week-1-phonics-satpin-launch': '/blog/phonics-satpin-launch',
};

test('the real production Vite transform preserves all distinct alias keys without retired href literals', async () => {
  const logger = createLogger();
  const warnings = [];
  const warn = logger.warn.bind(logger);
  logger.warn = (message, options) => { warnings.push(message); warn(message, options); };
  const outputs = await build({
    configFile: path.resolve('vite.config.js'),
    customLogger: logger,
    build: {
      write: false,
      emptyOutDir: false,
      minify: 'esbuild',
      lib: { entry: path.resolve('src/config/seoRecoveryBrick8InternalLinks.ts'), formats: ['es'], fileName: 'alias-regression' },
    },
  });
  const chunks = (Array.isArray(outputs) ? outputs : [outputs]).flatMap(output => output.output).filter(item => item.type === 'chunk');
  assert.equal(chunks.length, 1);
  const code = chunks[0].code;
  const built = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  assert.deepEqual(built.SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS, expected);
  assert.equal(Object.keys(built.SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS).length, 5);
  for (const [alias, owner] of Object.entries(expected)) {
    assert.equal(built.normalizeSeoRecoveryInternalHref(alias), owner);
    assert.equal(built.normalizeSeoRecoveryInternalHref(alias + '?source=internal#details'), owner + '?source=internal#details');
    assert.equal(built.isSeoRecoveryRetiredInternalHref(alias), true);
    assert.equal(built.normalizeSeoRecoveryInternalHref(owner), owner);
    assert.equal(built.isSeoRecoveryRetiredInternalHref(owner), false);
    assert.ok(!code.includes(alias), 'Production output must not contain the retired href literal: ' + alias);
  }
  assert.ok(!warnings.some(message => /duplicate key/i.test(message)));
});
