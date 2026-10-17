/* eslint-env node, es2020 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
let scenario;
const cache = new Map();
const react = {
  createElement: (type, props, ...children) => ({
    type,
    props: { ...props, children },
  }),
};

function breakpoint(value) {
  if (Array.isArray(value)) return value[0];
  if (value && typeof value === 'object') return value.base;
  return value;
}

function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  const originalRequire = mod.require.bind(mod);
  mod.require = (name) => {
    if (name === 'react') {
      return {
        __esModule: true,
        default: react,
        memo: (fn) => fn,
        forwardRef: (fn) => fn,
      };
    }
    if (name === 'react-native') {
      return {
        TextInput: 'TextInput',
        View: 'View',
        StyleSheet: {
          create: (value) => value,
          flatten: (values) => Object.assign({}, ...values.filter(Boolean)),
        },
      };
    }
    const target = path.resolve(path.dirname(file), name);
    if (target === path.join(root, 'src/hooks')) {
      return {
        useTheme: () => scenario.theme,
        useBreakpointValue: breakpoint,
        usePropsResolution: (_component, props) => ({
          ...scenario.defaults,
          ...Object.fromEntries(
            Object.entries(props).filter(([, value]) => value !== undefined)
          ),
        }),
        useToken: load(path.join(root, 'src/hooks/useToken.ts')).useToken,
      };
    }
    if (target === path.join(root, 'src/hooks/useTheme'))
      return { useTheme: () => scenario.theme };
    if (target === path.join(root, 'src/core/color-mode'))
      return { useColorMode: () => ({ colorMode: 'light' }) };
    if (name.startsWith('.')) return load(target + '.ts');
    return originalRequire(name);
  };
  cache.set(file, mod);
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2019,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
      fileName: file,
    }).outputText,
    file
  );
  return mod.exports;
}

const Input = load(path.join(root, 'src/components/primitives/Input/Input.tsx'))
  .default;
function render(props, options = {}) {
  scenario = {
    theme: {
      colors: {},
      fonts: { body: 'Inter' },
      fontWeights: { normal: 400, bold: 700 },
      ...options.theme,
    },
    defaults: options.defaults || {},
  };
  const tree = Input(props, null);
  return {
    input: tree.props.children.find(
      (child) => child && child.type === 'TextInput'
    ).props,
    children: tree.props.children,
  };
}

test('Input resolves theme defaults instead of sending raw theme tokens', () => {
  const { input } = render(
    {},
    {
      defaults: {
        fontFamily: 'body',
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
    }
  );
  assert.equal(input.style.fontFamily, 'Inter');
  assert.equal(input.style.fontWeight, '400');
  assert.equal(input.style.fontStyle, 'normal');
});

test('Input resolves responsive custom font variants and clears redundant native weight/style', () => {
  const { input } = render(
    {
      fontFamily: { base: 'body' },
      fontWeight: { base: 'bold' },
      fontStyle: ['italic'],
    },
    {
      theme: { fontConfig: { Inter: { 700: { italic: 'Inter-BoldItalic' } } } },
    }
  );
  assert.equal(input.style.fontFamily, 'Inter-BoldItalic');
  assert.equal(input.style.fontWeight, undefined);
  assert.equal(input.style.fontStyle, undefined);
});

test('Input keeps an explicit font and rejects unsupported native typography values', () => {
  const { input } = render({
    fontFamily: 'CustomFace',
    fontWeight: 'unsupported',
    fontStyle: 'unsupported',
  });
  assert.equal(input.style.fontFamily, 'CustomFace');
  assert.equal(input.style.fontWeight, undefined);
  assert.equal(input.style.fontStyle, undefined);
});

test('Input keeps editing props and side elements unchanged', () => {
  const onChangeText = () => {};
  const { input, children } = render({
    fontFamily: 'CustomFace',
    fontWeight: '700',
    secureTextEntry: true,
    onChangeText,
    isDisabled: true,
    leftElement: 'left',
    rightElement: 'right',
  });
  assert.equal(input.secureTextEntry, true);
  assert.equal(input.onChangeText, onChangeText);
  assert.equal(input.editable, false);
  assert.equal(input.style.fontWeight, '700');
  assert.equal(children[0], 'left');
  assert.equal(children[2], 'right');
});

test('Input resolves responsive alignment before forwarding it to TextInput', () => {
  const { input } = render({ textAlign: { base: 'right' } });
  assert.equal(input.textAlign, 'right');
  const { input: unsupported } = render({ textAlign: { base: 'unsupported' } });
  assert.equal(unsupported.textAlign, undefined);
});
