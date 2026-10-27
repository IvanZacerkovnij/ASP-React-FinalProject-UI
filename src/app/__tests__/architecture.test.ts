import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const rawSources = import.meta.glob<string>(['../../**/*.{ts,tsx}', '!../../**/__tests__/**'], { query: '?raw', import: 'default', eager: true })
const sources = Object.fromEntries(Object.entries(rawSources).map(([file, content]) => [new URL(file, 'https://architecture.test/src/app/__tests__/architecture.test.ts').pathname.slice(1), content]))
const files = Object.keys(sources)
const edges = new Map<string, string[]>()
const violations: string[] = []
const unresolved: string[] = []
for (const file of files) {
  const content = sources[file]
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true)
  const imports: string[] = []
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue
    const specifier = node.moduleSpecifier.text
    if (!specifier.startsWith('.') || specifier.endsWith('.css')) continue
    const base = new URL(specifier, 'https://architecture.test/' + file).pathname.slice(1)
    const resolved = [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find(candidate => files.includes(candidate))
    if (!resolved) { unresolved.push(file + ': ' + specifier); continue }
    const sourceLayer = file.split('/')[1]
    const targetLayer = resolved.split('/')[1]
    if (sourceLayer === 'shared' && targetLayer !== 'shared') violations.push(file + ' imports ' + resolved)
    if (sourceLayer === 'features' && ['app', 'pages', 'widgets'].includes(targetLayer)) violations.push(file + ' imports ' + resolved)
    if (sourceLayer === 'features' && targetLayer === 'features' && file.split('/')[2] !== resolved.split('/')[2] && !/^src\/features\/[^/]+\/(index|mapping)\.ts$/.test(resolved)) {
      violations.push(file + ' bypasses public entry: ' + resolved)
    }
    const typeOnly = ts.isImportDeclaration(node)
      ? node.importClause?.isTypeOnly || (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) && node.importClause.namedBindings.elements.every(element => element.isTypeOnly))
      : node.isTypeOnly || (node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.every(element => element.isTypeOnly))
    if (!typeOnly && files.includes(resolved)) imports.push(resolved)
  }
  edges.set(file, imports)
}

describe('feature architecture', () => {
  it('resolves every static local module', () => expect(unresolved).toEqual([]))
  it('keeps dependency layers and public feature boundaries', () => expect(violations).toEqual([]))
  it('has no runtime import cycles', () => {
    const visited = new Set<string>()
    const stack: string[] = []
    const cycles: string[] = []
    const visit = (file: string) => {
      if (stack.includes(file)) { cycles.push([...stack.slice(stack.indexOf(file)), file].join(' -> ')); return }
      if (visited.has(file)) return
      visited.add(file)
      stack.push(file)
      for (const dependency of edges.get(file) ?? []) visit(dependency)
      stack.pop()
    }
    files.forEach(visit)
    expect(cycles).toEqual([])
  })
})
