/* eslint-env node, es2020 */
const assert = require('node:assert/strict');
const test = require('node:test');
const {
  candidateVersion,
  validatePlan,
  validateContext,
} = require('./security-candidate.cjs');

test('candidate versions remain outside the installed app ranges', () => {
  assert.equal(candidateVersion('3.4.28-napp.3'), '3.4.29-securityrc.0');
  assert.equal(candidateVersion('3.4.29-securityrc.0'), '3.4.30-securityrc.0');
  assert.throws(() => candidateVersion('undefined'));
});

test('rejects the observed release-it zero-exit invalid plan and stable publishing', () => {
  const valid =
    '! npm version 3.4.29-securityrc.0 --no-git-tag-version\n! git tag v3.4.29-securityrc.0\n$ npm publish . --tag security-rc --dry-run';
  validatePlan(valid, '3.4.29-securityrc.0');
  assert.throws(() =>
    validatePlan(
      valid.replace('npm version 3.4.29-securityrc.0', 'npm version undefined'),
      '3.4.29-securityrc.0'
    )
  );
  assert.throws(() =>
    validatePlan(
      valid.replace('--tag security-rc', '--tag latest'),
      '3.4.29-securityrc.0'
    )
  );
  assert.throws(() => validatePlan(valid, '3.4.29-securityrc.1'));
});

test('only the exact reviewed master SHA can pass the manual gate', () => {
  const sha = 'a'.repeat(40);
  const env = {
    GITHUB_REPOSITORY: 'bilwifi/NativeBase',
    GITHUB_REF: 'refs/heads/master',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    SOURCE_SHA: sha,
  };
  validateContext(env, sha, 'master');
  assert.throws(() => validateContext(env, 'b'.repeat(40), 'master'));
  assert.throws(() =>
    validateContext({ ...env, GITHUB_EVENT_NAME: 'push' }, sha, 'master')
  );
  assert.throws(() =>
    validateContext(
      { ...env, GITHUB_REPOSITORY: 'other/NativeBase' },
      sha,
      'master'
    )
  );
  assert.throws(() =>
    validateContext({ ...env, SOURCE_SHA: 'main; echo token' }, sha, 'master')
  );
  assert.throws(() => validateContext(env, sha, 'feature'));
});
