/**
 * Rei Project Indexer
 *
 * プロジェクトのソースファイルをスキャンし、
 * 関数・クラス・インターフェース・型の索引を構築する。
 *
 * これにより「1TBを500kbに圧縮」する代わりに、
 * 「1TBの中から今必要な500kbだけを動的に取得」する仕組みを実現する。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
// ============================================================
// Indexer
// ============================================================
export class ReiProjectIndexer {
    rootDir;
    index;
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.index = {
            rootDir,
            files: new Map(),
            symbols: new Map(),
            buildTime: new Date(),
        };
    }
    /**
     * プロジェクト全体をスキャンしてインデックスを構築
     */
    buildIndex() {
        const tsFiles = this.findTypeScriptFiles(this.rootDir);
        for (const filePath of tsFiles) {
            const relPath = path.relative(this.rootDir, filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            const fileInfo = {
                path: relPath,
                lines: lines.length,
                symbols: [],
                imports: [],
                description: this.extractFileDescription(lines),
            };
            // Parse imports
            fileInfo.imports = this.parseImports(lines, relPath);
            // Parse symbols (functions, classes, interfaces, types, etc.)
            fileInfo.symbols = this.parseSymbols(lines, relPath);
            this.index.files.set(relPath, fileInfo);
            // Add to global symbol map
            for (const sym of fileInfo.symbols) {
                const existing = this.index.symbols.get(sym.name) ?? [];
                existing.push(sym);
                this.index.symbols.set(sym.name, existing);
            }
        }
        return this.index;
    }
    /**
     * TypeScriptファイルを再帰的に検索
     */
    findTypeScriptFiles(dir) {
        const results = [];
        if (!fs.existsSync(dir))
            return results;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            // Skip node_modules, dist, .git
            if (entry.isDirectory()) {
                if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name))
                    continue;
                results.push(...this.findTypeScriptFiles(fullPath));
            }
            else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
                results.push(fullPath);
            }
        }
        return results;
    }
    /**
     * ファイル冒頭のコメントブロックを抽出
     */
    extractFileDescription(lines) {
        const descLines = [];
        let inComment = false;
        for (const line of lines.slice(0, 30)) {
            const trimmed = line.trim();
            if (trimmed.startsWith('/**')) {
                inComment = true;
                descLines.push(trimmed);
                continue;
            }
            if (inComment) {
                descLines.push(trimmed);
                if (trimmed.includes('*/'))
                    break;
            }
            else if (trimmed.startsWith('//')) {
                descLines.push(trimmed);
            }
            else if (trimmed !== '' && !trimmed.startsWith('import')) {
                break;
            }
        }
        return descLines.length > 0 ? descLines.join('\n') : undefined;
    }
    /**
     * import文を解析
     */
    parseImports(lines, _relPath) {
        const imports = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // import { X, Y } from './module'
            const match = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
            if (match) {
                imports.push({
                    names: match[1].split(',').map(s => s.trim().split(' as ')[0].trim()),
                    from: match[2],
                    line: i + 1,
                });
                continue;
            }
            // import X from './module'
            const defaultMatch = line.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
            if (defaultMatch) {
                imports.push({
                    names: [defaultMatch[1]],
                    from: defaultMatch[2],
                    line: i + 1,
                });
                continue;
            }
            // import * as X from './module'
            const starMatch = line.match(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
            if (starMatch) {
                imports.push({
                    names: [`* as ${starMatch[1]}`],
                    from: starMatch[2],
                    line: i + 1,
                });
            }
        }
        return imports;
    }
    /**
     * シンボル（関数、クラス、インターフェース等）を解析
     */
    parseSymbols(lines, relPath) {
        const symbols = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const isExported = trimmed.startsWith('export ');
            const base = isExported ? trimmed.replace(/^export\s+(default\s+)?/, '') : trimmed;
            let sym = null;
            // function name(...)
            const funcMatch = base.match(/^(?:async\s+)?function\s+(\w+)/);
            if (funcMatch) {
                const endLine = this.findBlockEnd(lines, i);
                sym = { name: funcMatch[1], kind: 'function', startLine: i + 1, endLine, signature: trimmed.replace(/\{.*$/, '').trim() };
            }
            // class Name
            if (!sym) {
                const classMatch = base.match(/^(?:abstract\s+)?class\s+(\w+)/);
                if (classMatch) {
                    const endLine = this.findBlockEnd(lines, i);
                    sym = { name: classMatch[1], kind: 'class', startLine: i + 1, endLine, signature: trimmed.replace(/\{.*$/, '').trim() };
                }
            }
            // interface Name
            if (!sym) {
                const ifaceMatch = base.match(/^interface\s+(\w+)/);
                if (ifaceMatch) {
                    const endLine = this.findBlockEnd(lines, i);
                    sym = { name: ifaceMatch[1], kind: 'interface', startLine: i + 1, endLine, signature: trimmed.replace(/\{.*$/, '').trim() };
                }
            }
            // type Name = ...
            if (!sym) {
                const typeMatch = base.match(/^type\s+(\w+)/);
                if (typeMatch) {
                    const endLine = this.findStatementEnd(lines, i);
                    sym = { name: typeMatch[1], kind: 'type', startLine: i + 1, endLine };
                }
            }
            // enum Name
            if (!sym) {
                const enumMatch = base.match(/^(?:const\s+)?enum\s+(\w+)/);
                if (enumMatch) {
                    const endLine = this.findBlockEnd(lines, i);
                    sym = { name: enumMatch[1], kind: 'enum', startLine: i + 1, endLine };
                }
            }
            // const name = ... (top-level only, not inside functions)
            if (!sym && (trimmed.startsWith('const ') || trimmed.startsWith('export const '))) {
                const constMatch = base.match(/^const\s+(\w+)/);
                if (constMatch) {
                    const endLine = this.findStatementEnd(lines, i);
                    sym = { name: constMatch[1], kind: 'const', startLine: i + 1, endLine, signature: trimmed.split('=')[0].trim() };
                }
            }
            if (sym) {
                // Look for JSDoc above
                const jsdoc = this.extractJSDoc(lines, i);
                symbols.push({
                    name: sym.name,
                    kind: sym.kind,
                    file: relPath,
                    startLine: sym.startLine,
                    endLine: sym.endLine,
                    signature: sym.signature,
                    exported: isExported,
                    jsdoc,
                });
            }
        }
        return symbols;
    }
    /**
     * ブロック（{...}）の終了行を探す
     */
    findBlockEnd(lines, startIdx) {
        let depth = 0;
        let found = false;
        for (let i = startIdx; i < lines.length; i++) {
            for (const ch of lines[i]) {
                if (ch === '{') {
                    depth++;
                    found = true;
                }
                if (ch === '}') {
                    depth--;
                }
            }
            if (found && depth <= 0)
                return i + 1;
        }
        return Math.min(startIdx + 50, lines.length);
    }
    /**
     * 文の終了行を探す（セミコロンまたは次の宣言まで）
     */
    findStatementEnd(lines, startIdx) {
        for (let i = startIdx; i < Math.min(startIdx + 30, lines.length); i++) {
            if (lines[i].includes(';') || (i > startIdx && /^(export |const |let |var |function |class |interface |type |enum )/.test(lines[i].trim()))) {
                return i + 1;
            }
        }
        return startIdx + 1;
    }
    /**
     * JSDocコメントを抽出
     */
    extractJSDoc(lines, symbolIdx) {
        if (symbolIdx === 0)
            return undefined;
        const docLines = [];
        let i = symbolIdx - 1;
        // Look upward for */ ending
        while (i >= 0 && lines[i].trim() === '')
            i--;
        if (i < 0 || !lines[i].trim().endsWith('*/'))
            return undefined;
        // Collect until /**
        while (i >= 0) {
            docLines.unshift(lines[i]);
            if (lines[i].trim().startsWith('/**'))
                break;
            i--;
        }
        return docLines.join('\n');
    }
    // ============================================================
    // Query Methods
    // ============================================================
    /**
     * シンボル名で検索
     */
    searchSymbol(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        for (const [name, syms] of this.index.symbols) {
            if (name.toLowerCase().includes(lowerQuery)) {
                results.push(...syms);
            }
        }
        return results;
    }
    /**
     * ファイルの特定行範囲を取得
     */
    getFileLines(relPath, startLine, endLine) {
        const absPath = path.join(this.rootDir, relPath);
        if (!fs.existsSync(absPath))
            return null;
        const content = fs.readFileSync(absPath, 'utf-8');
        const lines = content.split('\n');
        const start = Math.max(0, startLine - 1);
        const end = Math.min(lines.length, endLine);
        return lines.slice(start, end)
            .map((line, i) => `${start + i + 1}: ${line}`)
            .join('\n');
    }
    /**
     * ファイル全体を取得
     */
    getFileContent(relPath) {
        const absPath = path.join(this.rootDir, relPath);
        if (!fs.existsSync(absPath))
            return null;
        const content = fs.readFileSync(absPath, 'utf-8');
        const lines = content.split('\n');
        return lines.map((line, i) => `${i + 1}: ${line}`).join('\n');
    }
    /**
     * シンボルの呼び出し元を検索
     */
    findCallers(symbolName) {
        const callers = [];
        const regex = new RegExp(`\\b${symbolName}\\b`);
        for (const [relPath, _fileInfo] of this.index.files) {
            const absPath = path.join(this.rootDir, relPath);
            if (!fs.existsSync(absPath))
                continue;
            const content = fs.readFileSync(absPath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Skip definition lines and import lines
                if (line.match(/^(export\s+)?(function|class|interface|type|enum|const)\s/))
                    continue;
                if (line.match(/^\s*import\s/))
                    continue;
                if (regex.test(line)) {
                    callers.push({
                        file: relPath,
                        line: i + 1,
                        context: line.trim(),
                    });
                }
            }
        }
        return callers;
    }
    /**
     * プロジェクト全体のサマリーを生成
     */
    getProjectSummary() {
        const files = Array.from(this.index.files.values());
        const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
        const totalSymbols = files.reduce((sum, f) => sum + f.symbols.length, 0);
        let summary = `# Rei Project Summary\n`;
        summary += `Built: ${this.index.buildTime.toISOString()}\n`;
        summary += `Files: ${files.length} | Lines: ${totalLines.toLocaleString()} | Symbols: ${totalSymbols}\n\n`;
        summary += `## Files\n`;
        for (const f of files.sort((a, b) => b.lines - a.lines)) {
            const symCount = f.symbols.filter(s => s.exported).length;
            summary += `  ${f.path} (${f.lines} lines, ${symCount} exports)\n`;
        }
        summary += `\n## Key Symbols (exported)\n`;
        for (const f of files) {
            const exports = f.symbols.filter(s => s.exported);
            if (exports.length === 0)
                continue;
            summary += `\n### ${f.path}\n`;
            for (const s of exports) {
                summary += `  ${s.kind} ${s.name}`;
                if (s.signature)
                    summary += ` — ${s.signature}`;
                summary += ` [L${s.startLine}-${s.endLine}]\n`;
            }
        }
        summary += `\n## Dependency Graph\n`;
        for (const f of files) {
            if (f.imports.length === 0)
                continue;
            const deps = f.imports.map(i => i.from).filter(d => d.startsWith('.')).join(', ');
            if (deps)
                summary += `  ${f.path} → ${deps}\n`;
        }
        return summary;
    }
    /**
     * テキスト全文検索
     */
    grepProject(pattern, maxResults = 50) {
        const results = [];
        const regex = new RegExp(pattern, 'i');
        for (const [relPath, _fileInfo] of this.index.files) {
            const absPath = path.join(this.rootDir, relPath);
            if (!fs.existsSync(absPath))
                continue;
            const content = fs.readFileSync(absPath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                    results.push({
                        file: relPath,
                        line: i + 1,
                        context: lines[i].trim(),
                    });
                    if (results.length >= maxResults)
                        return results;
                }
            }
        }
        return results;
    }
    getIndex() {
        return this.index;
    }
}
//# sourceMappingURL=indexer.js.map