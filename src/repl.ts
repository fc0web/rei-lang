/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) REPL — Interactive Read-Eval-Print Loop
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 */

import * as readline from 'readline';
import { rei, reiStr, Environment } from './index';

const env = new Environment();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'rei> '
});

console.log('═══════════════════════════════════════════');
console.log('  Rei (0₀式) Language REPL v0.2');
console.log('  BNF v0.2 — 21 Theories Integrated');
console.log('  Author: Nobuki Fujimoto');
console.log('  Type .help for commands, .exit to quit');
console.log('═══════════════════════════════════════════');

rl.prompt();

rl.on('line', (line: string) => {
  const input = line.trim();

  if (!input) { rl.prompt(); return; }

  // REPL commands
  if (input === '.exit' || input === '.quit') {
    console.log('さようなら。');
    process.exit(0);
  }

  if (input === '.help') {
    console.log(`
  .help          — このヘルプを表示
  .exit / .quit  — 終了
  .examples      — サンプルコードを表示

  基本構文:
    let x = 42                         — 変数束縛
    let mut y = 10                     — 可変束縛
    0ooo                               — 拡張数リテラル
    𝕄{5; 1, 2, 3, 4}                  — 多次元数
    𝕄{...} |> compute :weighted        — 計算モード
    compress f(x) = x * 2              — 関数定義
    ⊤ ∧ ⊥                              — 四値論理
    0oo >> :x                          — 次元拡張
    value |> seal                      — ISL封印
`);
    rl.prompt(); return;
  }

  if (input === '.examples') {
    console.log(`
  // 拡張数
  0ooo
  πooo
  0oo >> :x

  // 多次元数と計算
  let m = 𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8}
  m |> compute :weighted
  m |> compute :all

  // 関数
  compress karma(i, e, r) = i * e * r
  karma(0.8, 0.9, 0.7)

  // 四値論理
  ⊤ ∧ ⊤
  ¬⊤π

  // Genesis
  let g = genesis() |> forward
  g.state

  // ISL
  42 |> seal
`);
    rl.prompt(); return;
  }

  try {
    const result = rei(input, env);
    console.log('  → ' + reiStr(result));
  } catch (err: any) {
    console.log('  ✗ ' + err.message);
  }

  rl.prompt();
});
