import ts from 'typescript'
import { readFileSync } from 'node:fs'
export function loadModule(path, mocks) {
  const source = readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  new Function('require', 'exports', js)(name => {
    if (!(name in mocks)) throw new Error('Unexpected dependency: ' + name)
    return mocks[name]
  }, exports)
  return exports
}
