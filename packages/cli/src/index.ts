#!/usr/bin/env node
/**
 * Rei CLI (0₀式/rei-shiki)
 * 
 * A command-line tool for creating and managing Rei structures —
 * multi-dimensional project representations based on the four axioms:
 * 
 *   A1: Center-Periphery (中心-周囲)
 *   A2: Extension-Reduction (拡張-縮約)
 *   A3: Sigma-Accumulation (σ蓄積)
 *   A4: Genesis (生成)
 * 
 * All data is stored locally. No server communication.
 * 
 * Author: Nobuki Fujimoto (藤本 伸樹)
 * License: MIT
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { REI_VERSION } from './core/types';
import { registerInitCommand } from './commands/init';
import { registerSigmaCommand } from './commands/sigma';
import { registerExportCommand } from './commands/export';
import { registerListCommand, registerViewCommand } from './commands/list-view';
import { registerExtendCommand, registerMemoryCommand } from './commands/extend';

const program = new Command();

// ─── Program Info ──────────────────────────────────────────

program
  .name('rei')
  .version(REI_VERSION)
  .description(
    chalk.bold('Rei CLI (0₀式)') + '\n' +
    chalk.gray('Multi-dimensional structure management for AI-assisted workflows.\n') +
    chalk.gray('All data is stored locally — no server communication.\n') +
    '\n' +
    chalk.yellow('Axioms:\n') +
    chalk.gray('  A1  Center-Periphery   中心-周囲    Structure\n') +
    chalk.gray('  A2  Extension-Reduction 拡張-縮約    Growth\n') +
    chalk.gray('  A3  Sigma-Accumulation  σ蓄積        Progress\n') +
    chalk.gray('  A4  Genesis             生成         Creation')
  );

// ─── Register Commands ─────────────────────────────────────

registerInitCommand(program);     // rei init
registerSigmaCommand(program);    // rei sigma update / rei sigma history
registerExportCommand(program);   // rei export
registerListCommand(program);     // rei list
registerViewCommand(program);     // rei view
registerExtendCommand(program);   // rei extend / rei reduce
registerMemoryCommand(program);   // rei memory

// ─── Help Footer ───────────────────────────────────────────

program.addHelpText('after', `
${chalk.bold('Quick Start:')}
  $ rei init project "My Project" --periphery "Design,Implement,Test"
  $ rei sigma update "My Project" +50 "Design complete" --node "Design"
  $ rei export "My Project" --format both
  $ ${chalk.gray('# Attach the exported file to your AI chat')}

${chalk.bold('Examples:')}
  ${chalk.gray('# Create a task structure')}
  $ rei init task "Bug Fix" --periphery "Investigate,Fix,Verify" --field engineering

  ${chalk.gray('# Update progress')}
  $ rei sigma update "Bug Fix" +100 "Investigation done" --node "Investigate"

  ${chalk.gray('# Add context/decision')}
  $ rei memory "Bug Fix" "Root cause: race condition in auth module"

  ${chalk.gray('# Expand scope')}
  $ rei extend "Bug Fix" --add "Documentation,Review"

  ${chalk.gray('# Export for AI chat')}
  $ rei export "Bug Fix" --format json --compact

${chalk.gray('All data stays on your local machine. No server communication.')}
${chalk.gray('GitHub: https://github.com/fc0web/rei-lang')}
`);

// ─── Parse ─────────────────────────────────────────────────

program.parse(process.argv);

// Show help if no command given
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
