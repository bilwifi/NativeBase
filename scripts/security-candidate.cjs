/* eslint-env node, es2020 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const semver = require('semver');

const repository = 'bilwifi/NativeBase';
const registry = 'https://npm.pkg.github.com';
const packageName = '@bilwifi/native-base';

function candidateVersion(current) {
  assert(semver.valid(current), 'Invalid current package version');
  // Match the locked conventional-changelog plugin's patch + preRelease rule.
  // Advancing the patch also excludes existing ^3.4.28-napp.3 consumers.
  const version = semver.inc(current, 'prepatch', 'securityrc');
  assert(version && !semver.satisfies(version, '^3.4.28-napp.3'));
  return version;
}

function validatePlan(output, version) {
  assert(!/npm version (undefined|null)|vnull|vundefined/.test(output));
  assert(output.includes(`npm version ${version} --no-git-tag-version`));
  assert(output.includes(`v${version}`));
  assert(output.includes('npm publish . --tag security-rc'));
  assert(!/npm publish[^\n]*--tag latest/.test(output));
}

function run(command, args) {
  return cp
    .execFileSync(command, args, {
      encoding: 'utf8',
      timeout: 180000,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 8 * 1024 * 1024,
    })
    .trim();
}

function readPackage(spec, field) {
  return JSON.parse(
    run('npm', ['view', spec, field, '--json', '--registry', registry])
  );
}

function validateContext(env, head, branch) {
  assert.equal(env.GITHUB_REPOSITORY, repository);
  assert.equal(env.GITHUB_REF, 'refs/heads/master');
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch');
  assert(/^[a-f0-9]{40}$/.test(env.SOURCE_SHA || ''), 'Expected full SHA');
  assert.equal(head, env.SOURCE_SHA, 'Reviewed source changed; dispatch again');
  assert.equal(branch, 'master');
}

function main() {
  const mode = process.argv[2];
  assert(['plan', 'verify'].includes(mode));
  const head = run('git', ['rev-parse', 'HEAD']);
  const branch = run('git', ['branch', '--show-current']);
  assert.equal(run('git', ['status', '--porcelain']), '', 'Dirty checkout');
  assert.equal(
    run('git', ['remote', 'get-url', 'origin']),
    `https://github.com/${repository}`
  );
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(pkg.name, packageName);
  assert.equal(pkg.publishConfig.registry, registry);
  assert.equal(
    pkg.gitHead,
    undefined,
    'Do not retain a historical gitHead in source'
  );
  assert.equal(pkg.repository.url, `git+https://github.com/${repository}.git`);

  if (mode === 'plan') {
    validateContext(process.env, head, branch);
    const version = candidateVersion(pkg.version);
    const latest = readPackage(packageName, 'dist-tags.latest');
    assert(semver.valid(latest), 'Stable baseline is unavailable');
    if (process.env.EXPECTED_VERSION) {
      assert.equal(version, process.env.EXPECTED_VERSION);
      assert.equal(latest, process.env.EXPECTED_LATEST);
    }
    const versions = readPackage(packageName, 'versions');
    assert(!versions.includes(version), 'Candidate already exists');
    const output = run('yarn', ['release:securityrc:check']);
    validatePlan(output, version);
    assert.equal(run('git', ['status', '--porcelain']), '');
    // Only public, validated metadata reaches the log and job outputs.
    process.stdout.write(
      JSON.stringify({ source: head, version, latest, published: false }) + '\n'
    );
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `version=${version}\nlatest=${latest}\n`
      );
    }
  } else {
    const {
      EXPECTED_VERSION: version,
      EXPECTED_LATEST: latest,
      SOURCE_SHA: source,
    } = process.env;
    assert(
      semver.valid(version) && semver.prerelease(version)[0] === 'securityrc'
    );
    assert(semver.valid(latest));
    assert(/^[a-f0-9]{40}$/.test(source || ''));
    assert.equal(pkg.version, version);
    assert.equal(branch, 'master');
    assert.equal(run('git', ['rev-parse', 'HEAD^']), source);
    assert.equal(run('git', ['rev-parse', `v${version}^{commit}`]), head);
    assert.equal(readPackage(packageName, 'dist-tags.security-rc'), version);
    assert.equal(readPackage(packageName, 'dist-tags.latest'), latest);
    assert.equal(readPackage(`${packageName}@${version}`, 'gitHead'), head);
    const release = JSON.parse(
      run('gh', ['api', `repos/${repository}/releases/tags/v${version}`])
    );
    assert.equal(release.prerelease, true);
    assert.equal(release.draft, false);
    process.stdout.write(
      JSON.stringify({
        source,
        commit: head,
        version,
        latest,
        verified: true,
      }) + '\n'
    );
  }
}

module.exports = { candidateVersion, validatePlan, validateContext };
if (require.main === module) {
  try {
    main();
  } catch (error) {
    // Subprocess errors may contain credential-bearing output. Do not forward
    // stdout/stderr; assertion messages contain only our public validation data.
    console.error(
      error.code === 'ERR_ASSERTION'
        ? error.message
        : 'Candidate command failed; publication is not verified.'
    );
    process.exitCode = 1;
  }
}
