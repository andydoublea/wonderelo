#!/usr/bin/env node
/**
 * Toast Scanner
 *
 * Walks src/ and extracts every toast call site:
 *   toast.success('msg')
 *   toast.error('msg', { description: '...' })
 *   toast.info(`template ${x}`)
 *   toast.warning('msg')
 *   toast('msg')
 *   toast.message('msg')
 *   toast.loading('msg')
 *
 * Also resolves wrapper modules from src/utils/toastMessages.ts — for each named
 * export (e.g. AuthToasts.signInSuccess), we extract the literal string inside
 * the factory function body, so callers referencing AuthToasts.signInSuccess()
 * get an entry with the resolved message.
 *
 * Output: src/utils/toastCatalog.generated.ts (typed module, importable at runtime).
 *
 * Stable IDs:
 *   - For direct toast calls:   `<relPath>:<line>`
 *   - For wrapper methods:      `wrapper:<WrapperName>.<methodName>`
 * These IDs are the key used by the override store. They survive renames of
 * surrounding functions but break if you move a call to a different line —
 * which is acceptable tradeoff; admins re-edit on the rare rename.
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const OUT = join(SRC, 'utils', 'toastCatalog.generated.ts');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'coverage']);
const SKIP_FILES = new Set([
  // Our own infrastructure — don't scan the wrapper itself
  'toastCatalog.generated.ts',
  'toastOverrides.ts',
  'toastOverridesInit.ts',
]);

/** Walk directory recursively, yielding .ts/.tsx files. */
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    if (SKIP_FILES.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts')) {
      yield full;
    }
  }
}

/** Best-effort string literal extraction. Handles 'a', "b", `c`. Returns null for non-literal first arg. */
function extractFirstArg(argsText) {
  argsText = argsText.trimStart();
  if (!argsText) return null;
  const q = argsText[0];
  if (q !== "'" && q !== '"' && q !== '`') return null;
  // Find matching quote, respecting escapes
  let i = 1;
  while (i < argsText.length) {
    const ch = argsText[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === q) {
      return {
        raw: argsText.slice(0, i + 1),
        value: argsText.slice(1, i),
        isTemplate: q === '`',
      };
    }
    i++;
  }
  return null;
}

/** Extract description field from options-object text like `{ description: 'x', duration: 5000 }` */
function extractDescription(optsText) {
  if (!optsText) return null;
  const m = optsText.match(/description\s*:\s*(['"`])((?:\\.|(?!\1).)*)\1/);
  return m ? m[2] : null;
}

/** Parse the file for toast.* calls. Regex-based — good enough for literal strings. */
function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = [];

  // Regex for toast method calls. Captures: type, rest-of-line-after-paren.
  // Matches: toast.success(  toast.error(  toast.info(  toast.warning(  toast.message(  toast.loading(
  // Also matches bare toast(...)  — we treat that as 'default'.
  const re = /\btoast\s*\.\s*(success|error|info|warning|message|loading)\s*\(/g;
  const bareRe = /\btoast\s*\(/g;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Typed calls
    let m;
    while ((m = re.exec(line)) !== null) {
      const type = m[1];
      const afterParen = line.slice(m.index + m[0].length);
      const arg = extractFirstArg(afterParen);
      if (!arg) continue; // dynamic variable — can't override
      // Find options object (crude): look for a top-level `,` then `{`
      const afterFirstArg = afterParen.slice(arg.raw.length);
      let description = null;
      const commaIdx = afterFirstArg.indexOf(',');
      if (commaIdx >= 0) {
        const restOfLine = afterFirstArg.slice(commaIdx + 1);
        description = extractDescription(restOfLine);
      }
      results.push({
        id: `${relPath(filePath)}:${lineNum}`,
        kind: 'direct',
        filePath: relPath(filePath),
        line: lineNum,
        component: inferComponent(filePath, content),
        type,
        message: arg.value,
        isTemplate: arg.isTemplate,
        description,
        context: inferContext(content, idx),
      });
    }

    // Bare toast()
    bareRe.lastIndex = 0;
    while ((m = bareRe.exec(line)) !== null) {
      // Skip if the preceding char is a dot (would have matched typed regex)
      const prev = line[m.index - 1];
      if (prev === '.') continue;
      // Skip if followed by a . (toast.promise etc. handled below)
      const afterParen = line.slice(m.index + m[0].length);
      const arg = extractFirstArg(afterParen);
      if (!arg) continue;
      results.push({
        id: `${relPath(filePath)}:${lineNum}`,
        kind: 'direct',
        filePath: relPath(filePath),
        line: lineNum,
        component: inferComponent(filePath, content),
        type: 'default',
        message: arg.value,
        isTemplate: arg.isTemplate,
        description: null,
        context: inferContext(content, idx),
      });
    }
  });

  return results;
}

/** Scan src/utils/toastMessages.ts to extract wrapper definitions. */
function scanWrapperModule(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const results = [];

  // Match: `methodName: (...args?) => toast.TYPE('literal'[, options])`
  // Also handles: `methodName: () => toast.TYPE(\`template with ${args}\`)`
  // Wrapper name is the const before `= {`  (e.g. `export const AuthToasts = {`)
  const wrapperRe = /export\s+const\s+(\w+Toasts)\s*(?::\s*[^=]+)?\s*=\s*\{/g;
  let wm;
  while ((wm = wrapperRe.exec(content)) !== null) {
    const wrapperName = wm[1];
    // Find matching close brace (naive — count braces)
    let i = wm.index + wm[0].length;
    let depth = 1;
    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    const bodyStart = wm.index + wm[0].length;
    const bodyEnd = i - 1;
    const body = content.slice(bodyStart, bodyEnd);

    // Extract methods — match `methodName: (...args) => toast.TYPE('msg')` or more flexibly
    const methodRe = /(\w+)\s*:\s*(?:\(([^)]*)\))?\s*=>\s*toast\s*\.\s*(success|error|info|warning|message|loading)\s*\(/g;
    let mm;
    while ((mm = methodRe.exec(body)) !== null) {
      const methodName = mm[1];
      const type = mm[3];
      const afterParen = body.slice(mm.index + mm[0].length);
      const arg = extractFirstArg(afterParen);
      if (!arg) continue;

      // Line within file
      const preBody = content.slice(0, bodyStart);
      const baseLine = preBody.split('\n').length;
      const localLine = body.slice(0, mm.index).split('\n').length - 1;
      const line = baseLine + localLine;

      results.push({
        id: `wrapper:${wrapperName}.${methodName}`,
        kind: 'wrapper',
        wrapperName,
        methodName,
        filePath: relPath(filePath),
        line,
        component: wrapperName,
        type,
        message: arg.value,
        isTemplate: arg.isTemplate,
        description: null,
        context: `${wrapperName}.${methodName}()`,
      });
    }
  }

  return results;
}

function relPath(abs) {
  return relative(ROOT, abs).split(sep).join('/');
}

/** Infer component name from file name or first `export function/const X`. */
function inferComponent(filePath, content) {
  // From file name: MyComponent.tsx → MyComponent
  const base = filePath.split(sep).pop().replace(/\.(tsx?|jsx?)$/, '');
  if (/^[A-Z]/.test(base)) return base;
  // From first exported function/const
  const m = content.match(/export\s+(?:default\s+)?(?:function|const|let)\s+(\w+)/);
  return m ? m[1] : base;
}

/**
 * Infer a short context hint from the nearest enclosing function/handler.
 * Looks backwards from the call line for the first function-like declaration.
 */
function inferContext(content, lineIdx) {
  const lines = content.split('\n');
  for (let i = lineIdx; i >= 0 && i >= lineIdx - 30; i--) {
    const line = lines[i];
    // async handleSave = async () => {
    // const handleClick = () => {
    // function handleSubmit(
    // onClick: () => {
    // onSuccess: (data) => {
    const m =
      line.match(/(?:async\s+)?(?:function\s+|const\s+|let\s+)(\w+)\s*(?:=|\()/) ||
      line.match(/(\w+)\s*:\s*(?:async\s+)?(?:\([^)]*\)|\(\))\s*=>/) ||
      line.match(/(?:on|handle)([A-Z]\w+)\s*[:(]/);
    if (m) {
      return m[1];
    }
  }
  return null;
}

/** Group entries by page/area for the admin UI. */
function inferPage(filePath) {
  const p = filePath.toLowerCase();
  if (p.includes('/admin')) return 'Admin';
  if (p.includes('participant')) return 'Participant';
  if (p.includes('session')) return 'Session';
  if (p.includes('match')) return 'Match';
  if (p.includes('userpublic') || p.includes('event')) return 'Event';
  if (p.includes('account') || p.includes('billing') || p.includes('pricing')) return 'Account & Billing';
  if (p.includes('auth') || p.includes('signin') || p.includes('bootstrap')) return 'Auth';
  if (p.includes('hook')) return 'Hooks';
  if (p.includes('util')) return 'Shared';
  if (p.includes('crm')) return 'CRM';
  if (p.includes('blog')) return 'Blog';
  if (p.includes('theme')) return 'Theme';
  if (p.includes('approuter')) return 'Routing';
  return 'Other';
}

// ---- Main ----

const all = [];
for (const file of walk(SRC)) {
  if (file.endsWith('toastMessages.ts')) {
    all.push(...scanWrapperModule(file));
  } else {
    all.push(...scanFile(file));
  }
}

// Dedupe by id (same file:line twice should be rare; keep first)
const seen = new Map();
for (const e of all) {
  if (!seen.has(e.id)) seen.set(e.id, e);
}
const entries = Array.from(seen.values()).map(e => ({
  ...e,
  page: inferPage(e.filePath),
}));

// Sort by page, then file, then line
entries.sort((a, b) => {
  if (a.page !== b.page) return a.page.localeCompare(b.page);
  if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
  return a.line - b.line;
});

const typeCounts = entries.reduce((acc, e) => {
  acc[e.type] = (acc[e.type] || 0) + 1;
  return acc;
}, {});

const out = `// AUTO-GENERATED by scripts/scan-toasts.mjs — do not edit by hand.
// Regenerate with:  npm run scan:toasts
//
// ${entries.length} toast call sites scanned from src/
// By type: ${Object.entries(typeCounts).map(([t, c]) => `${t}=${c}`).join(', ')}

export type ToastCatalogEntry = {
  /** Stable unique ID used as override key. Format: "<filePath>:<line>" or "wrapper:<Name>.<method>". */
  id: string;
  /** 'direct' = inline toast.x() call; 'wrapper' = named method on XxxToasts module. */
  kind: 'direct' | 'wrapper';
  /** Path relative to repo root. */
  filePath: string;
  /** 1-indexed line number of the call. */
  line: number;
  /** Inferred React component name (from file name). */
  component: string;
  /** Sonner method called: success/error/info/warning/default/message/loading. */
  type: 'success' | 'error' | 'info' | 'warning' | 'default' | 'message' | 'loading';
  /** Original message text (literal or template). */
  message: string;
  /** True if original was a template literal with \${...} interpolations. */
  isTemplate: boolean;
  /** Second-argument description, if any. */
  description: string | null;
  /** Short hint about the handler/callback name enclosing this call. */
  context: string | null;
  /** Grouping bucket for the admin UI (e.g. "Admin", "Participant", "Session"). */
  page: string;
  /** Only set for kind='wrapper': the wrapper module name (e.g. "AuthToasts"). */
  wrapperName?: string;
  /** Only set for kind='wrapper': the method on that wrapper (e.g. "signInSuccess"). */
  methodName?: string;
};

export const TOAST_CATALOG: ToastCatalogEntry[] = ${JSON.stringify(entries, null, 2)};

export const TOAST_CATALOG_STATS = {
  total: ${entries.length},
  byType: ${JSON.stringify(typeCounts)},
  byPage: ${JSON.stringify(
    entries.reduce((acc, e) => { acc[e.page] = (acc[e.page] || 0) + 1; return acc; }, {})
  )},
  scannedAt: ${JSON.stringify(new Date().toISOString())},
};
`;

writeFileSync(OUT, out, 'utf8');
console.log(`✓ Scanned ${entries.length} toast call sites → ${relPath(OUT)}`);
console.log(`  Types: ${Object.entries(typeCounts).map(([t, c]) => `${t}=${c}`).join(', ')}`);
