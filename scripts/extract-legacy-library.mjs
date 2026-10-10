// Extracts the legacy Cinematic Math Builder data libraries (LIB, READY, INTU, SOLVE)
// from the original JS sources into JSON, without rewriting anything by hand.
// Usage: node scripts/extract-legacy-library.mjs <path-to-cinematic-math-builder> [outDir]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const src = process.argv[2];
const out = process.argv[3] ?? path.join(process.cwd(), 'src/data/legacy');
if (!src) { console.error('usage: extract-legacy-library.mjs <legacy-root> [outDir]'); process.exit(1); }

function load(file, names, preamble = '') {
  const code = fs.readFileSync(path.join(src, 'js', file), 'utf8');
  // The legacy files touch the DOM at load time ($, document, localStorage…): give them inert stubs.
  const noop = () => new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => '' : noop()), apply: () => noop(), construct: () => noop() });
  const stubs = { localStorage: noop(), navigator: noop(), indexedDB: noop() };
  let sandbox;
  // Retry, stubbing every global the file touches at load time (E, $, document…) with an inert proxy.
  for (let i = 0; i < 40; i++) {
    sandbox = vm.createContext({ console, Math, JSON, ...stubs }); // fresh context each try: consts can't be redeclared
    try {
      vm.runInContext(`${preamble}\n${code}\n;globalThis.__out = {${names.join(',')}};`, sandbox, { filename: file });
      break;
    } catch (e) {
      const m = /^([\w$]+) is not defined/.exec(e.message);
      if (!m) throw e;
      stubs[m[1]] = noop();
    }
  }
  return JSON.parse(JSON.stringify(sandbox.__out));
}

const { LIB } = load('11-curriculum-library.js', ['LIB']);
let ready;
try { ready = load('21-ready-videos.js', ['INLINE_4AM', 'READY', 'READY_THEMES'], `const LIB = ${JSON.stringify(LIB)};`); }
catch (e) { console.error('READY load failed:', e.message); }
let intu;
try { intu = load('22-intuition-videos.js', ['INTU']); } catch (e) { console.error('INTU load failed:', e.message); }
let solve;
try { solve = load('31-solve-steps.js', ['SOLVE', 'SOLVE_TYPES']); } catch (e) { console.error('SOLVE load failed:', e.message); }

fs.mkdirSync(out, { recursive: true });
const write = (name, data) => {
  fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 1));
  console.log(name, Array.isArray(data) ? data.length : Object.keys(data).length);
};
write('mistakes.json', LIB);
if (ready) { write('inline-mistakes.json', ready.INLINE_4AM); write('ready.json', ready.READY); write('ready-themes.json', ready.READY_THEMES); }
if (intu) write('intuition.json', intu.INTU);
if (solve) { write('solve.json', solve.SOLVE); write('solve-types.json', solve.SOLVE_TYPES); }
