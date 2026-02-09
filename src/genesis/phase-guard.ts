// ============================================================
// Rei (0₀式) Phase Guard System
// 相転移ガード — @ Phase 記法の Reference Implementation
// D-FUMT Extension — Built on ISL v3 + GA-v2
// Author: Nobuki Fujimoto
// ============================================================
//
// REI_SPEC_v0.1 Proposal 5: Phase Guard (@ Phase)
//
// compress normalize(p: Pipeline @ Open) = ...
// compress commit(p: Pipeline @ Open) -> Pipeline @ Sealed = ...
// compress compact(s: Pipeline @ Sealed) -> Pipeline @ Compacted = ...
//
// Design:
//   @ Phase は TypeScript の型システムと Rei の不可逆性を統合する。
//   コンパイル時: 型レベルで段階違反を検出
//   ランタイム:  firewall で防御（defense-in-depth）
//
// Phase Guard Rules:
//   1. Phase mismatch → compile error
//   2. Phase regression → always rejected
//   3. Phase monotonicity: Open → Sealed → Compacted
//   4. Genesis monotonicity: void → dot → zero_zero → zero → number
//   5. Phase inference: omitted return phase inferred from body
// ============================================================

import {
  type GenesisPhase,
  type GenesisState,
  phaseIndex,
  phaseDelta,
} from './genesis-axioms-v2';

// ============================================================
// I. Phase Types — @ Phase の型定義
// ============================================================

/** Pipeline phases (ISL) */
export type PipelinePhase = 'open' | 'sealed' | 'compacted';

/** All phases (ISL + Genesis unified) */
export type Phase = PipelinePhase | GenesisPhase;

/** Phase category */
export type PhaseCategory = 'pipeline' | 'genesis';

// Phase ordering
const PIPELINE_ORDER: PipelinePhase[] = ['open', 'sealed', 'compacted'];
const GENESIS_ORDER: GenesisPhase[] = ['void', 'dot', 'zero_zero', 'zero', 'number'];

export function pipelinePhaseIndex(p: PipelinePhase): number {
  return PIPELINE_ORDER.indexOf(p);
}

export function phaseCategory(p: Phase): PhaseCategory {
  if (PIPELINE_ORDER.includes(p as PipelinePhase)) return 'pipeline';
  return 'genesis';
}

// ============================================================
// II. Phase Guard Declaration — ガード宣言
// ============================================================

/**
 * PhaseGuard: @ Phase 記法の内部表現
 *
 * Rei言語での記法:
 *   compress normalize(p: Pipeline @ Open) = ...
 *                                    ^^^^^
 *                                    PhaseGuard
 */
export interface PhaseGuard {
  readonly phase: Phase;
  readonly category: PhaseCategory;
  readonly strict: boolean; // true = exact match, false = minimum phase
}

/**
 * PhaseGuardedParam: 相ガード付きパラメータ
 *
 * compress fn(p: Pipeline @ Open, g: Genesis @ dot) = ...
 *             ^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^
 *             PhaseGuardedParam   PhaseGuardedParam
 */
export interface PhaseGuardedParam {
  readonly name: string;
  readonly typeExpr: string;
  readonly guard: PhaseGuard;
}

/**
 * PhaseGuardedFunction: 相ガード付き関数定義
 *
 * compress commit(p: Pipeline @ Open) -> Pipeline @ Sealed = ...
 * ^^^^^^^         ^^^^^^^^^^^^^^^^^^     ^^^^^^^^^^^^^^^^^
 * keyword         input guard             return guard
 */
export interface PhaseGuardedFunction {
  readonly name: string;
  readonly params: readonly PhaseGuardedParam[];
  readonly returnGuard: PhaseGuard | null; // null = inferred
  readonly body: string; // expression body (for display/debug)
  readonly compressionLevel: number; // compress⁰=0, compress¹=1, ...
}

// ============================================================
// III. Guard Creation — ガード生成ユーティリティ
// ============================================================

/** Create a phase guard: @ Open, @ Sealed, etc. */
export function guard(phase: Phase, strict: boolean = true): PhaseGuard {
  return {
    phase,
    category: phaseCategory(phase),
    strict,
  };
}

/** Create a guarded parameter: p: Pipeline @ Open */
export function guardedParam(
  name: string,
  typeExpr: string,
  phase: Phase,
): PhaseGuardedParam {
  return { name, typeExpr, guard: guard(phase) };
}

/** Create a guarded function definition */
export function guardedFunction(
  name: string,
  params: PhaseGuardedParam[],
  returnGuard: PhaseGuard | null,
  body: string = '',
  compressionLevel: number = 1,
): PhaseGuardedFunction {
  return { name, params, returnGuard, body, compressionLevel };
}

// ============================================================
// IV. Phase Validation — 相ガード検証
// ============================================================

export interface PhaseValidationResult {
  readonly valid: boolean;
  readonly error: string | null;
  readonly kind: 'match' | 'mismatch' | 'regression' | 'category_mismatch';
}

function ok(): PhaseValidationResult {
  return { valid: true, error: null, kind: 'match' };
}

function fail(error: string, kind: PhaseValidationResult['kind']): PhaseValidationResult {
  return { valid: false, error, kind };
}

/**
 * validatePhaseGuard: 値の実際のphaseがguardの要求と一致するか検証
 *
 * Rei言語コンパイル時にこの検証が実行される。
 * ランタイムでも defense-in-depth として再検証される。
 */
export function validatePhaseGuard(
  actualPhase: Phase,
  guard: PhaseGuard,
): PhaseValidationResult {
  // Category mismatch: Pipeline phase vs Genesis phase
  const actualCategory = phaseCategory(actualPhase);
  if (actualCategory !== guard.category) {
    return fail(
      `Phase category mismatch: expected ${guard.category} phase, got ${actualCategory} phase '${actualPhase}'`,
      'category_mismatch',
    );
  }

  if (guard.strict) {
    // Strict: exact match required
    if (actualPhase !== guard.phase) {
      return fail(
        `Phase guard violation: expected @ ${guard.phase}, got @ ${actualPhase}`,
        'mismatch',
      );
    }
  } else {
    // Non-strict: minimum phase required
    if (guard.category === 'pipeline') {
      if (pipelinePhaseIndex(actualPhase as PipelinePhase) <
          pipelinePhaseIndex(guard.phase as PipelinePhase)) {
        return fail(
          `Phase guard violation: minimum @ ${guard.phase} required, got @ ${actualPhase}`,
          'mismatch',
        );
      }
    } else {
      if (phaseIndex(actualPhase as GenesisPhase) <
          phaseIndex(guard.phase as GenesisPhase)) {
        return fail(
          `Phase guard violation: minimum @ ${guard.phase} required, got @ ${actualPhase}`,
          'mismatch',
        );
      }
    }
  }

  return ok();
}

// ============================================================
// V. Phase Transition Validation — 相遷移の合法性検証
// ============================================================

/**
 * validatePhaseTransition: 入力phase → 出力phase の遷移が合法か検証
 *
 * compress commit(p: Pipeline @ Open) -> Pipeline @ Sealed
 *                            ^^^^^                  ^^^^^^
 *                            from                   to
 *
 * Rules:
 *   1. Forward only (monotonicity)
 *   2. Single step or same phase (no skipping)
 */
export function validatePhaseTransition(
  fromGuard: PhaseGuard,
  toGuard: PhaseGuard,
): PhaseValidationResult {
  // Must be same category
  if (fromGuard.category !== toGuard.category) {
    return fail(
      `Cannot transition between categories: ${fromGuard.category} → ${toGuard.category}`,
      'category_mismatch',
    );
  }

  if (fromGuard.category === 'pipeline') {
    const fromIdx = pipelinePhaseIndex(fromGuard.phase as PipelinePhase);
    const toIdx = pipelinePhaseIndex(toGuard.phase as PipelinePhase);
    const delta = toIdx - fromIdx;

    if (delta < 0) {
      return fail(
        `Phase regression not allowed: @ ${fromGuard.phase} → @ ${toGuard.phase}`,
        'regression',
      );
    }

    if (delta > 1) {
      return fail(
        `Phase skip not allowed: @ ${fromGuard.phase} → @ ${toGuard.phase} (must go through intermediate phases)`,
        'regression',
      );
    }
  } else {
    const fromIdx = phaseIndex(fromGuard.phase as GenesisPhase);
    const toIdx = phaseIndex(toGuard.phase as GenesisPhase);
    const delta = toIdx - fromIdx;

    if (delta < 0) {
      return fail(
        `Genesis phase regression not allowed: @ ${fromGuard.phase} → @ ${toGuard.phase}`,
        'regression',
      );
    }

    if (delta > 1) {
      return fail(
        `Genesis phase skip not allowed: @ ${fromGuard.phase} → @ ${toGuard.phase}`,
        'regression',
      );
    }
  }

  return ok();
}

// ============================================================
// VI. Function Application with Phase Guard — 関数適用
// ============================================================

/**
 * PhaseGuardedValue: 相ガード付き値
 *
 * ランタイムで値に相情報を持たせる。
 * コンパイル時にはTypeScriptの型で保証されるが、
 * ランタイムfirewallとして実際の相も保持する。
 */
export interface PhaseGuardedValue<T = unknown> {
  readonly value: T;
  readonly phase: Phase;
  readonly category: PhaseCategory;
  readonly witnesses: readonly string[];
}

/** Create a phase-guarded value */
export function phaseValue<T>(value: T, phase: Phase, witnesses: string[] = []): PhaseGuardedValue<T> {
  return {
    value,
    phase,
    category: phaseCategory(phase),
    witnesses,
  };
}

/**
 * applyGuardedFunction: 相ガード付き関数の適用
 *
 * 1. 各引数の相ガードを検証
 * 2. 関数本体を実行（transform）
 * 3. 戻り値の相ガードを検証
 * 4. 相遷移の合法性を検証
 */
export interface ApplicationResult<T = unknown> {
  readonly success: boolean;
  readonly result: PhaseGuardedValue<T> | null;
  readonly errors: readonly string[];
  readonly phaseTransition: { from: Phase; to: Phase } | null;
}

export function applyGuardedFunction<T>(
  fn: PhaseGuardedFunction,
  args: readonly PhaseGuardedValue<T>[],
  transform: (inputs: readonly T[]) => T,
  resultPhase?: Phase,
): ApplicationResult<T> {
  const errors: string[] = [];

  // 1. Validate parameter count
  if (args.length !== fn.params.length) {
    errors.push(`Expected ${fn.params.length} arguments, got ${args.length}`);
    return { success: false, result: null, errors, phaseTransition: null };
  }

  // 2. Validate each argument's phase guard
  for (let i = 0; i < args.length; i++) {
    const param = fn.params[i];
    const arg = args[i];
    const validation = validatePhaseGuard(arg.phase, param.guard);
    if (!validation.valid) {
      errors.push(
        `Argument '${param.name}': ${validation.error}`
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, result: null, errors, phaseTransition: null };
  }

  // 3. Execute transform
  const inputValues = args.map(a => a.value);
  const resultValue = transform(inputValues);

  // 4. Determine result phase
  const outputPhase = resultPhase
    ?? fn.returnGuard?.phase
    ?? args[0]?.phase
    ?? 'open';

  // 5. Validate phase transition if return guard exists
  let phaseTransition: { from: Phase; to: Phase } | null = null;
  if (fn.returnGuard && args.length > 0) {
    const inputGuard = fn.params[0].guard;
    const validation = validatePhaseTransition(inputGuard, fn.returnGuard);
    if (!validation.valid) {
      errors.push(`Return phase: ${validation.error}`);
      return { success: false, result: null, errors, phaseTransition: null };
    }
    if (inputGuard.phase !== fn.returnGuard.phase) {
      phaseTransition = { from: inputGuard.phase, to: fn.returnGuard.phase };
    }
  }

  // 6. Create result with witnesses
  const newWitnesses = [
    ...args.flatMap(a => a.witnesses),
    `${fn.name}@${outputPhase}`,
  ];

  const result = phaseValue(resultValue, outputPhase, newWitnesses);
  return { success: true, result, errors: [], phaseTransition };
}

// ============================================================
// VII. Pre-defined Guarded Functions — 組み込み相ガード関数
// ============================================================

/** compress normalize(p: Pipeline @ Open) = ... */
export const GUARD_NORMALIZE: PhaseGuardedFunction = guardedFunction(
  'normalize',
  [guardedParam('p', 'Pipeline', 'open')],
  guard('open'),
  'phi(p)',
  1,
);

/** compress commit(p: Pipeline @ Open) -> Pipeline @ Sealed = ... */
export const GUARD_COMMIT: PhaseGuardedFunction = guardedFunction(
  'commit',
  [guardedParam('p', 'Pipeline', 'open')],
  guard('sealed'),
  'psi(p)',
  2,
);

/** compress compact(s: Pipeline @ Sealed) -> Pipeline @ Compacted = ... */
export const GUARD_COMPACT: PhaseGuardedFunction = guardedFunction(
  'compact',
  [guardedParam('s', 'Pipeline', 'sealed')],
  guard('compacted'),
  'omega(s)',
  3,
);

/** compress emerge(g: Genesis @ void) -> Genesis @ dot = ... */
export const GUARD_EMERGE: PhaseGuardedFunction = guardedFunction(
  'emerge',
  [guardedParam('g', 'Genesis', 'void')],
  guard('dot'),
  'existence(g)',
  1,
);

/** compress separate(g: Genesis @ dot) -> Genesis @ zero_zero = ... */
export const GUARD_SEPARATE: PhaseGuardedFunction = guardedFunction(
  'separate',
  [guardedParam('g', 'Genesis', 'dot')],
  guard('zero_zero'),
  'structure_separation(g)',
  2,
);

/** compress fix_value(g: Genesis @ zero_zero) -> Genesis @ zero = ... */
export const GUARD_FIX_VALUE: PhaseGuardedFunction = guardedFunction(
  'fix_value',
  [guardedParam('g', 'Genesis', 'zero_zero')],
  guard('zero'),
  'value_fixation(g)',
  2,
);

/** compress to_number(g: Genesis @ zero) -> Genesis @ number = ... */
export const GUARD_TO_NUMBER: PhaseGuardedFunction = guardedFunction(
  'to_number',
  [guardedParam('g', 'Genesis', 'zero')],
  guard('number'),
  'number_genesis(g)',
  3,
);

// ============================================================
// VIII. Phase Guard Display — 相ガードの文字列表現
// ============================================================

/** Display a phase guard in Rei notation */
export function displayGuard(g: PhaseGuard): string {
  return `@ ${g.phase.charAt(0).toUpperCase() + g.phase.slice(1)}`;
}

/** Display a guarded parameter in Rei notation */
export function displayParam(p: PhaseGuardedParam): string {
  return `${p.name}: ${p.typeExpr} ${displayGuard(p.guard)}`;
}

/** Display a guarded function in Rei notation */
export function displayFunction(fn: PhaseGuardedFunction): string {
  const level = fn.compressionLevel === Infinity ? '∞' : String(fn.compressionLevel);
  const sup = ['⁰', '¹', '²', '³'][fn.compressionLevel] ?? `[${level}]`;
  const params = fn.params.map(displayParam).join(', ');
  const ret = fn.returnGuard ? ` -> ${fn.params[0]?.typeExpr ?? 'Result'} ${displayGuard(fn.returnGuard)}` : '';
  return `compress${sup} ${fn.name}(${params})${ret} = ${fn.body}`;
}
