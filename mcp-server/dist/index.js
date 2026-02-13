#!/usr/bin/env node
/**
 * Rei MCP Server
 *
 * Reiプロジェクト専用のMCPサーバー。
 * LLMが巨大プロジェクトの中から「今必要な部分だけ」を
 * 動的に取得できる仕組みを提供する。
 *
 * 「1TBを500kbに圧縮」するのではなく、
 * 「1TBの索引から必要な500kbを取り出す」— 図書館の司書の役割。
 *
 * Tools:
 *   - search_symbol   : シンボル名で関数/クラス/型を検索
 *   - get_code        : ファイルの特定行範囲を取得
 *   - find_callers    : シンボルの呼び出し元を検索
 *   - grep            : プロジェクト全文検索
 *   - get_file        : ファイル全体を取得
 *   - project_summary : プロジェクト全体像サマリー
 *
 * Resources:
 *   - rei://project/summary  : プロジェクトサマリー
 *   - rei://file/{path}      : ファイル内容
 *
 * Usage:
 *   REI_PROJECT_ROOT=/path/to/rei-lang node dist/index.js
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ReiProjectIndexer } from './indexer.js';
// ============================================================
// Configuration
// ============================================================
const PROJECT_ROOT = process.env.REI_PROJECT_ROOT || process.cwd();
const SERVER_NAME = 'rei-project-server';
const SERVER_VERSION = '0.1.0';
// ============================================================
// Initialize Indexer
// ============================================================
console.error(`[${SERVER_NAME}] Indexing project at: ${PROJECT_ROOT}`);
const indexer = new ReiProjectIndexer(PROJECT_ROOT);
const projectIndex = indexer.buildIndex();
const fileCount = projectIndex.files.size;
const symbolCount = Array.from(projectIndex.symbols.values()).reduce((sum, s) => sum + s.length, 0);
console.error(`[${SERVER_NAME}] Indexed ${fileCount} files, ${symbolCount} symbols`);
// ============================================================
// Create MCP Server
// ============================================================
const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
    instructions: `Rei Project Server — Reiプログラミング言語のソースコードにアクセスするためのMCPサーバーです。
    
使い方:
1. まず project_summary で全体像を把握
2. search_symbol で目的の関数/クラスを探す
3. get_code で該当コードの行範囲を取得
4. find_callers で呼び出し元を確認
5. grep で自由テキスト検索

これにより、プロジェクトが巨大になっても、LLMは必要な部分だけを動的に取得できます。`,
});
// ============================================================
// Tools
// ============================================================
// 1. search_symbol — シンボル検索
server.tool('search_symbol', 'Search for functions, classes, interfaces, types by name. Returns file locations and line numbers.', {
    query: z.string().describe('Symbol name or partial name to search for'),
    kind: z.enum(['function', 'class', 'interface', 'type', 'enum', 'const', 'all'])
        .optional()
        .default('all')
        .describe('Filter by symbol kind'),
}, async ({ query, kind }) => {
    let results = indexer.searchSymbol(query);
    if (kind && kind !== 'all') {
        results = results.filter(s => s.kind === kind);
    }
    if (results.length === 0) {
        return {
            content: [{ type: 'text', text: `No symbols found matching "${query}"` }],
        };
    }
    const text = results.map(s => {
        let line = `${s.exported ? '✅' : '  '} ${s.kind.padEnd(10)} ${s.name}`;
        line += `  📄 ${s.file} [L${s.startLine}-${s.endLine}]`;
        if (s.signature)
            line += `\n     ${s.signature}`;
        if (s.jsdoc)
            line += `\n     ${s.jsdoc.split('\n')[0]}`;
        return line;
    }).join('\n\n');
    return {
        content: [{ type: 'text', text: `Found ${results.length} symbol(s) matching "${query}":\n\n${text}` }],
    };
});
// 2. get_code — ファイルの特定行範囲を取得
server.tool('get_code', 'Get specific line range from a source file. Use this to read only the code you need.', {
    file: z.string().describe('Relative file path (e.g. "src/lang/evaluator.ts")'),
    start_line: z.number().int().positive().describe('Start line number (1-indexed)'),
    end_line: z.number().int().positive().describe('End line number (inclusive)'),
}, async ({ file, start_line, end_line }) => {
    const content = indexer.getFileLines(file, start_line, end_line);
    if (content === null) {
        return {
            content: [{ type: 'text', text: `File not found: ${file}` }],
            isError: true,
        };
    }
    return {
        content: [{ type: 'text', text: `📄 ${file} [L${start_line}-${end_line}]:\n\n${content}` }],
    };
});
// 3. find_callers — 呼び出し元検索
server.tool('find_callers', 'Find all places where a symbol (function/class/variable) is used across the project.', {
    symbol: z.string().describe('Symbol name to find callers of'),
}, async ({ symbol }) => {
    const callers = indexer.findCallers(symbol);
    if (callers.length === 0) {
        return {
            content: [{ type: 'text', text: `No callers found for "${symbol}"` }],
        };
    }
    const text = callers.map(c => `  ${c.file}:${c.line}  ${c.context}`).join('\n');
    return {
        content: [{ type: 'text', text: `Found ${callers.length} reference(s) to "${symbol}":\n\n${text}` }],
    };
});
// 4. grep — 全文検索
server.tool('grep', 'Full-text search across all project files using regex pattern.', {
    pattern: z.string().describe('Search pattern (regex supported)'),
    max_results: z.number().int().positive().optional().default(30).describe('Maximum number of results'),
}, async ({ pattern, max_results }) => {
    const results = indexer.grepProject(pattern, max_results);
    if (results.length === 0) {
        return {
            content: [{ type: 'text', text: `No matches found for "${pattern}"` }],
        };
    }
    const text = results.map(r => `  ${r.file}:${r.line}  ${r.context}`).join('\n');
    return {
        content: [{ type: 'text', text: `Found ${results.length} match(es) for "${pattern}":\n\n${text}` }],
    };
});
// 5. get_file — ファイル全体を取得
server.tool('get_file', 'Get the entire content of a source file with line numbers.', {
    file: z.string().describe('Relative file path (e.g. "src/lang/puzzle.ts")'),
}, async ({ file }) => {
    const content = indexer.getFileContent(file);
    if (content === null) {
        // Try to find the file with a fuzzy match
        const allFiles = Array.from(projectIndex.files.keys());
        const suggestions = allFiles.filter(f => f.includes(file.split('/').pop() ?? file));
        let msg = `File not found: ${file}`;
        if (suggestions.length > 0) {
            msg += `\n\nDid you mean:\n${suggestions.map(s => `  ${s}`).join('\n')}`;
        }
        return {
            content: [{ type: 'text', text: msg }],
            isError: true,
        };
    }
    return {
        content: [{ type: 'text', text: `📄 ${file}:\n\n${content}` }],
    };
});
// 6. project_summary — プロジェクト全体像
server.tool('project_summary', 'Get a high-level overview of the entire Rei project: files, symbols, dependencies.', {}, async () => {
    const summary = indexer.getProjectSummary();
    return {
        content: [{ type: 'text', text: summary }],
    };
});
// ============================================================
// Resources
// ============================================================
// プロジェクトサマリーリソース
server.resource('project-summary', 'rei://project/summary', {
    description: 'High-level overview of the Rei project structure',
    mimeType: 'text/markdown',
}, async () => ({
    contents: [{
            uri: 'rei://project/summary',
            mimeType: 'text/markdown',
            text: indexer.getProjectSummary(),
        }],
}));
// ============================================================
// Start Server
// ============================================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[${SERVER_NAME}] Connected via stdio — ready to serve Rei project`);
}
main().catch((error) => {
    console.error(`[${SERVER_NAME}] Fatal error:`, error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map