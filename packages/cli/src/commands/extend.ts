/**
 * rei extend / rei reduce — A2: Extension-Reduction operations
 * rei memory — Add context to structure memory
 * 
 * Usage:
 *   rei extend "プロダクト" --add "ドキュメント,デプロイ"
 *   rei reduce "プロダクト" --remove "デプロイ"
 *   rei memory "プロダクト" "デザインレビュー完了、修正不要"
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { extendPeriphery, reducePeriphery, addMemory } from '../core/builder';
import { findStructure, saveStructure } from '../core/storage';

export function registerExtendCommand(program: Command): void {
  program
    .command('extend <n>')
    .description('Add periphery nodes (A2: Extension)')
    .requiredOption('--add <items>', 'Comma-separated items to add')
    .action((name: string, opts) => {
      const found = findStructure(name);
      if (!found) {
        console.error(chalk.red(`✗ Structure not found: "${name}"`));
        process.exit(1);
      }

      const items = opts.add.split(',').map((s: string) => s.trim()).filter(Boolean);
      const updated = extendPeriphery(found.structure, items);
      saveStructure(updated);

      console.log('');
      console.log(chalk.green('✓') + ` Extended: added ${items.length} node(s)`);
      for (const item of items) {
        console.log(`  ${chalk.yellow('+')} ${item}`);
      }
      console.log('');
    });

  program
    .command('reduce <n>')
    .description('Remove periphery nodes (A2: Reduction)')
    .requiredOption('--remove <items>', 'Comma-separated items to remove')
    .action((name: string, opts) => {
      const found = findStructure(name);
      if (!found) {
        console.error(chalk.red(`✗ Structure not found: "${name}"`));
        process.exit(1);
      }

      const items = opts.remove.split(',').map((s: string) => s.trim()).filter(Boolean);
      const updated = reducePeriphery(found.structure, items);
      saveStructure(updated);

      console.log('');
      console.log(chalk.green('✓') + ` Reduced: removed ${items.length} node(s)`);
      for (const item of items) {
        console.log(`  ${chalk.red('-')} ${item}`);
      }
      console.log('');
    });
}

export function registerMemoryCommand(program: Command): void {
  program
    .command('memory <n> <note>')
    .description('Add a memory entry to a structure')
    .action((name: string, note: string) => {
      const found = findStructure(name);
      if (!found) {
        console.error(chalk.red(`✗ Structure not found: "${name}"`));
        process.exit(1);
      }

      const updated = addMemory(found.structure, note);
      saveStructure(updated);

      console.log('');
      console.log(chalk.green('✓') + ' Memory added');
      console.log(`  ${chalk.gray('·')} ${note}`);
      console.log(`  ${chalk.gray(`Total memories: ${updated.attributes.memory.length}`)}`);
      console.log('');
    });
}
