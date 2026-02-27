/**
 * rei sigma — Update sigma accumulation (A3)
 * 
 * Usage:
 *   rei sigma "プロダクトリリース" +30 "設計完了" --node "設計"
 *   rei sigma "プロダクトリリース" +20 "実装進行中" --node "実装"
 *   rei sigma list "プロダクトリリース"
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { updateSigma, addMemory } from '../core/builder';
import { findStructure, saveStructure } from '../core/storage';

export function registerSigmaCommand(program: Command): void {
  const sigma = program
    .command('sigma')
    .description('Update sigma accumulation (A3: σ蓄積)');

  // Update sigma
  sigma
    .command('update <name> <delta> <note>')
    .description('Add sigma delta to a structure or periphery node')
    .option('-n, --node <node>', 'Target periphery node name')
    .option('-m, --memory <memo>', 'Also add a memory entry')
    .action((name: string, deltaStr: string, note: string, opts) => {
      const found = findStructure(name);
      if (!found) {
        console.error(chalk.red(`✗ Structure not found: "${name}"`));
        console.error(chalk.gray('  Run "rei list" to see available structures.'));
        process.exit(1);
      }

      // Parse delta (supports +30, -10, 30)
      const delta = parseInt(deltaStr.replace(/^\+/, ''), 10);
      if (isNaN(delta)) {
        console.error(chalk.red(`✗ Invalid delta: "${deltaStr}". Use a number like +30 or -10.`));
        process.exit(1);
      }

      // Validate node exists
      if (opts.node) {
        const nodeExists = found.structure.periphery.some(
          (p) => p.name.toLowerCase() === opts.node.toLowerCase()
        );
        if (!nodeExists) {
          console.error(chalk.red(`✗ Periphery node not found: "${opts.node}"`));
          console.error(chalk.gray(`  Available: ${found.structure.periphery.map((p) => p.name).join(', ')}`));
          process.exit(1);
        }
      }

      // Update
      let updated = updateSigma(found.structure, delta, note, opts.node);

      // Optional memory
      if (opts.memory) {
        updated = addMemory(updated, opts.memory);
      }

      const filePath = saveStructure(updated);

      // Output
      const sign = delta >= 0 ? '+' : '';
      console.log('');
      console.log(
        chalk.green('✓') +
        ` σ updated: ${sign}${delta} → ${chalk.bold(`${updated.sigma.current}%`)}`
      );

      if (opts.node) {
        const node = updated.periphery.find(
          (p) => p.name.toLowerCase() === opts.node.toLowerCase()
        );
        if (node) {
          console.log(`  ${chalk.gray('Node:')}  ${node.name} → ${node.sigma}% [${node.status}]`);
        }
      }

      console.log(`  ${chalk.gray('Note:')}  ${note}`);
      console.log('');

      // Show periphery summary
      for (const p of updated.periphery) {
        const bar = progressBar(p.sigma);
        const statusColor = p.status === 'done' ? chalk.green :
                           p.status === 'active' ? chalk.cyan :
                           p.status === 'blocked' ? chalk.red :
                           chalk.gray;
        console.log(`  ${bar} ${p.sigma.toString().padStart(3)}% ${p.name} ${statusColor(`[${p.status}]`)}`);
      }
      console.log('');
    });

  // View sigma history
  sigma
    .command('history <name>')
    .description('View sigma history for a structure')
    .option('-n, --count <count>', 'Number of entries to show', '10')
    .action((name: string, opts) => {
      const found = findStructure(name);
      if (!found) {
        console.error(chalk.red(`✗ Structure not found: "${name}"`));
        process.exit(1);
      }

      const count = parseInt(opts.count, 10);
      const history = found.structure.sigma.history.slice(-count);

      console.log('');
      console.log(chalk.bold(`σ History: ${found.structure.center}`));
      console.log(chalk.gray(`Current: σ = ${found.structure.sigma.current}%`));
      console.log('');

      for (const entry of history) {
        const sign = entry.delta >= 0 ? '+' : '';
        const ts = entry.timestamp.slice(0, 16).replace('T', ' ');
        const source = entry.source ? chalk.cyan(` [${entry.source}]`) : '';
        console.log(`  ${chalk.gray(ts)} ${sign}${entry.delta}${source} — ${entry.note}`);
      }
      console.log('');
    });
}

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
