/**
 * rei init — Create a new Rei structure (A4: Genesis)
 * 
 * Usage:
 *   rei init project "プロダクトリリース" --periphery "設計,実装,テスト"
 *   rei init task "バグ修正" --periphery "調査,修正,テスト" --field "engineering"
 *   rei init idea "新機能" --periphery "リサーチ,プロトタイプ,評価"
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createStructure, BuilderOptions } from '../core/builder';
import { saveStructure } from '../core/storage';
import { ReiStructureType, STRUCTURE_TYPES } from '../core/types';

export function registerInitCommand(program: Command): void {
  program
    .command('init <type> <name>')
    .description('Create a new Rei structure (A4: Genesis)')
    .option('-p, --periphery <items>', 'Comma-separated periphery items (周囲)')
    .option('-f, --field <field>', 'Domain field (場)')
    .option('--flow <flow>', 'Flow pattern: sequential|parallel|cyclical|adaptive (流)')
    .option('-w, --will <will>', 'Goal/intention (意志)')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .option('--target <number>', 'Target sigma value', parseInt)
    .option('--seed <seed>', 'Genesis seed note')
    .action((type: string, name: string, opts) => {
      // Validate type
      if (!STRUCTURE_TYPES.includes(type as ReiStructureType)) {
        console.error(
          chalk.red(`✗ Invalid type "${type}". Use: ${STRUCTURE_TYPES.join(', ')}`)
        );
        process.exit(1);
      }

      // Parse periphery
      const periphery = opts.periphery
        ? opts.periphery.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      if (periphery.length === 0) {
        console.error(
          chalk.red('✗ At least one periphery item is required. Use --periphery "item1,item2"')
        );
        process.exit(1);
      }

      // Build options
      const buildOpts: BuilderOptions = {
        type: type as ReiStructureType,
        center: name,
        periphery,
        field: opts.field,
        flow: opts.flow,
        will: opts.will,
        tags: opts.tags ? opts.tags.split(',').map((s: string) => s.trim()) : undefined,
        seed: opts.seed,
        target: opts.target,
      };

      // Create structure
      const structure = createStructure(buildOpts);
      const filePath = saveStructure(structure);

      // Output
      console.log('');
      console.log(chalk.green('✓') + chalk.bold(` Rei structure created: ${name}`));
      console.log('');
      console.log(`  ${chalk.gray('Type:')}     ${type}`);
      console.log(`  ${chalk.gray('Center:')}   ${chalk.cyan(name)}`);
      console.log(`  ${chalk.gray('Periphery:')}`);
      for (const p of periphery) {
        console.log(`    ${chalk.yellow('○')} ${p}`);
      }
      console.log(`  ${chalk.gray('Field:')}    ${structure.attributes.field}`);
      console.log(`  ${chalk.gray('Flow:')}     ${structure.attributes.flow}`);
      console.log(`  ${chalk.gray('Will:')}     ${structure.attributes.will}`);
      console.log(`  ${chalk.gray('σ:')}        ${structure.sigma.current}%`);
      console.log('');
      console.log(`  ${chalk.gray('Saved:')}    ${filePath}`);
      console.log('');
      console.log(chalk.gray('  Next: rei sigma <name> <+delta> "note"'));
      console.log(chalk.gray('        rei export <name> --format json'));
    });
}
