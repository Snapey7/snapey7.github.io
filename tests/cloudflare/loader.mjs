import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Compile application TypeScript for Node's integration tests without a Next server.
export async function resolve(specifier, context, next) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true };
  const root = new URL('../../', import.meta.url);
  const candidate = specifier.startsWith('@/') ? new URL(specifier.slice(2), root)
    : specifier.startsWith('.') && context.parentURL ? new URL(specifier, context.parentURL) : null;
  if (candidate?.protocol === 'file:' && !candidate.pathname.includes('/node_modules/')) {
    for (const suffix of ['', '.ts', '.tsx', '.mjs']) {
      try { const url = candidate.href + suffix; await access(fileURLToPath(url)); return { url, shortCircuit: true }; } catch {}
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    const source = ts.transpileModule(await readFile(fileURLToPath(url), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      fileName: fileURLToPath(url),
    }).outputText;
    return { format: 'module', source, shortCircuit: true };
  }
  return next(url, context);
}
