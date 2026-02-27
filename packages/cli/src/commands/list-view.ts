/**
 * rei list — List all local Rei structures
 * rei view — View details of a structure
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { listStructures, findStructure } from '../core/storage';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('List all Rei structures in the current directory')
    .option('-a, --all', 'Show detailed info')
    .action((opts) => {
      const structures = listStructures();

      if (structures.length === 0) {
        console.log('');
        console.log(chalk.gray('  No Rei structures found in .rei/'));
        console.log(chalk.gray('  Create one: rei init project "名前" --periphery "item1,item2"'));
        console.log('');
        return;
      }

      console.log('');
      console.log(chalk.bold(`  Rei Structures (${structures.length})`));
      console.log('');

      for (const { name, structure: s } of structures) {
        const bar = progressBar(s.sigma.current);
        const typeTag = chalk.gray(`[${s.type}]`);
        console.log(`  ${bar} ${s.sigma.current.toString().padStart(3)}% ${chalk.bold(s.center)} ${typeTag}`);

        if (opts.all) {
          console.log(`       ${chalk.gray('Field:')} ${s.attributes.field}  ${chalk.gray('Flow:')} ${s.attributes.flow}`);
          for (const p of s.periphery) {
            const statusIcon = p.status === 'done' ? chalk.green('●') :
                              p.status === 'active' ? chalk.cyan('◐') :
                              p.status === 'blocked' ? chalk.red('✗') :
                              chalk.gray('○');
            console.log(`       ${statusIcon} ${p.name} (${p.sigma}%)`);
          }
          console.log('');
        }
      }
      console.log('');
    });
}

export function registerViewCommand(program: Command): void {
  program
    .command('view <n>')
    .description('View details of a Rei structure')
    .option('--json', 'Output raw JSON')
    .action((name: string, opts) => {
      const found = findStructure(name);
      if (!found) {
        console.error(chalk.red(`✗ Structure not found: "${name}"`));
        process.exit(1);
      }

      const s = found.structure;

      if (opts.json) {
        console.log(JSON.stringify(s, null, 2));
        return;
      }

      console.log('');
      console.log(chalk.bold(`  ╔═══ ${s.center} ═══╗`));
      console.log('');
      console.log(`  ${chalk.gray('Type:')}     ${s.type}`);
      console.log(`  ${chalk.gray('Version:')}  ${s.rei_version}`);
      console.log(`  ${chalk.gray('σ:')}        ${chalk.bold(`${s.sigma.current}%`)}${s.sigma.target ? chalk.gray(` / target: ${s.sigma.target}`) : ''}`);
      console.log('');

      // Periphery
      console.log(`  ${chalk.bold('Periphery (周囲)')}`);
      for (const p of s.periphery) {
        const bar = progressBar(p.sigma);
        const statusIcon = p.status === 'done' ? chalk.green('✓') :
                          p.status === 'active' ? chalk.cyan('▸') :
                          p.status === 'blocked' ? chalk.red('✗') :
                          chalk.gray('○');
        console.log(`  ${statusIcon} ${bar} ${p.sigma.toString().padStart(3)}% ${p.name}`);
      }
      console.log('');

      // Attributes
      console.log(`  ${chalk.bold('Attributes (六属性)')}`);
      console.log(`  ${chalk.gray('場 field:')}    ${s.attributes.field}`);
      console.log(`  ${chalk.gray('流 flow:')}     ${s.attributes.flow}`);
      console.log(`  ${chalk.gray('層 layer:')}    ${s.attributes.layer}`);
      console.log(`  ${chalk.gray('関係 relation:')} ${s.attributes.relation.length > 0 ? s.attributes.relation.map((r) => `${r.target}(${r.type})`).join(', ') : 'none'}`);
      console.log(`  ${chalk.gray('意志 will:')}   ${s.attributes.will}`);
      console.log('');

      // Memory
      if (s.attributes.memory.length > 0) {
        console.log(`  ${chalk.bold('Memory (記憶)')}`);
        for (const m of s.attributes.memory.slice(-5)) {
          console.log(`  ${chalk.gray('·')} ${m}`);
        }
        console.log('');
      }

      // Genesis
      console.log(`  ${chalk.gray('Genesis:')}  ${s.genesis.created_at.slice(0, 10)}`);
      console.log(`  ${chalk.gray('Updated:')}  ${s.meta.updated_at.slice(0, 10)}`);
      if (s.meta.tags.length > 0) {
        console.log(`  ${chalk.gray('Tags:')}     ${s.meta.tags.map((t) => chalk.yellow(`#${t}`)).join(' ')}`);
      }
      console.log('');
    });
}

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
