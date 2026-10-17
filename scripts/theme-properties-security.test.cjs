const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = new Map();

// Compile the real theme modules without loading a native React Native runtime.
function load(relativePath) {
  const file = path.resolve(root, relativePath);
  if (cache.has(file)) return cache.get(file).exports;
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  const originalRequire = mod.require.bind(mod);
  mod.require = (name) => {
    if (name === 'react-native') return { Platform: { OS: 'ios' } };
    if (name.startsWith('.')) {
      return load(
        path.relative(root, path.resolve(path.dirname(file), name + '.ts'))
      );
    }
    return originalRequire(name);
  };
  cache.set(file, mod);
  mod._compile(compiled, file);
  return mod.exports;
}

for (const relativePath of [
  'src/theme/tools/utils.ts',
  'src/theme/v33x-theme/tools/utils.ts',
]) {
  const theme = load(relativePath);
  test(
    relativePath + ': preserves literal paths, zero, false and ordering',
    () => {
      const parent = {
        'space.1': 4,
        margin: 0,
        disabled: false,
        color: 'blue',
      };
      assert.deepEqual(
        theme.extractInObject(parent, ['disabled', 'space.1', 'margin']),
        [{ disabled: false, 'space.1': 4, margin: 0 }, { color: 'blue' }]
      );
      assert.deepEqual(
        Object.keys(
          theme.orderedExtractInObject(parent, ['margin', 'space.1'])[0]
        ),
        ['space.1', 'margin']
      );
    }
  );

  test(
    relativePath + ': retains inherited properties and removes nil values',
    () => {
      const parent = Object.assign(Object.create({ inherited: 'yes' }), {
        margin: 0,
        nil: null,
        absent: undefined,
      });
      assert.deepEqual(theme.extractInObject(parent, ['inherited', 'nil']), [
        { inherited: 'yes' },
        { margin: 0 },
      ]);
      assert.deepEqual(
        theme.orderedExtractInObject(parent, ['inherited', 'margin'])[0],
        { margin: 0 }
      );
    }
  );

  test(
    relativePath + ': never traverses a requested dotted or bracket key',
    () => {
      const parent = { nested: { secret: 42 }, 'literal[0]': 'flat' };
      assert.deepEqual(
        theme.extractInObject(parent, ['nested.secret', 'literal[0]']),
        [{ 'literal[0]': 'flat' }, { nested: { secret: 42 } }]
      );
      assert.deepEqual(parent, {
        nested: { secret: 42 },
        'literal[0]': 'flat',
      });
    }
  );

  test(
    relativePath + ': does not inherit attacker fields from __proto__',
    () => {
      const parent = JSON.parse(
        '{"__proto__":{"injectedStyle":"red"},"margin":0}'
      );
      for (const extract of [
        theme.extractInObject,
        theme.orderedExtractInObject,
      ]) {
        for (const keys of [['__proto__'], ['margin'], []]) {
          for (const result of extract(parent, keys)) {
            assert.equal(Object.getPrototypeOf(result), Object.prototype);
            assert.equal(result.injectedStyle, undefined);
          }
        }
      }
      const result = theme.omitUndefined(parent);
      assert.equal(Object.getPrototypeOf(result), Object.prototype);
      assert.equal(result.injectedStyle, undefined);
      assert.equal({}.injectedStyle, undefined);
    }
  );

  test(
    relativePath + ': preserves symbols and does not mutate frozen input',
    () => {
      const symbol = Symbol('theme');
      const parent = Object.freeze({ margin: 1, [symbol]: 'kept' });
      const [selected, remaining] = theme.extractInObject(parent, ['margin']);
      assert.deepEqual(selected, { margin: 1 });
      assert.equal(remaining[symbol], 'kept');
      assert.equal(parent.margin, 1);
    }
  );
}
