/**
 * rei export — Export structure for AI chat attachment
 * 
 * This is the core value proposition of the CLI:
 * Generate a file that can be attached to Claude/ChatGPT
 * to give the AI full context about your project structure.
 * 
 * Usage:
 *   rei export "プロダクトリリース" --format json
 *   rei export "プロダクトリリース" --format md
 *   rei export "プロダクトリリース" --format both
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { exportForAI, exportAsMarkdown } from '../core/builder';
import { findStructure, exportToFile } from '../core/storage';

export function registerExportCommand(program: Command): void {
  program
    .command('export <n>')
    .description('Export structure for AI chat attachment')
    .option('-f, --format <format>', 'Output format: json|md|both (default: both)', 'both')
    .option('-o, --output <dir>', 'Output directory (default: current directory)')
    .option('--compact', 'Minimal JSON output for token efficiency')
    .option('--stdout', 'Print to stdout instead of file')
    .action((name: string, opts) => {
      const found = findStructure(name);
      if (!found) {
        console.error(chalk.red(`✗ Structure not found: "${name}"`));
        console.error(chalk.gray('  Run "rei list" to see available structures.'));
        process.exit(1);
      }

      const structure = found.structure;
      const baseName = found.name;
      const format = opts.format.toLowerCase();

      const exportedFiles: string[] = [];

      // JSON export
      if (format === 'json' || format === 'both') {
        const aiExport = exportForAI(structure);
        const content = opts.compact
          ? JSON.stringify(aiExport)
          : JSON.stringify(aiExport, null, 2);

        if (opts.stdout) {
          console.log(content);
        } else {
          const filePath = exportToFile(content, baseName, 'json', opts.output);
          exportedFiles.push(filePath);
        }
      }

      // Markdown export
      if (format === 'md' || format === 'both') {
        const mdContent = exportAsMarkdown(structure);

        if (opts.stdout) {
          console.log(mdContent);
        } else {
          const filePath = exportToFile(mdContent, baseName, 'md', opts.output);
          exportedFiles.push(filePath);
        }
      }

      // Summary (unless stdout mode)
      if (!opts.stdout && exportedFiles.length > 0) {
        console.log('');
        console.log(chalk.green('✓') + chalk.bold(' Exported for AI chat:'));
        console.log('');
        for (const f of exportedFiles) {
          console.log(`  ${chalk.cyan('📎')} ${f}`);
        }
        console.log('');
        console.log(chalk.gray('  Attach these files to your Claude/ChatGPT conversation.'));
        console.log(chalk.gray('  The AI will understand your project structure and context.'));
        console.log('');
      }
    });
}
