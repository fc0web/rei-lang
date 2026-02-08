// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// Rei (0₀式) Extended Number System
// D-FUMT ゼロ・π拡張理論 実装
// ============================================================

import {
  ExtendedSubscript,
  ExtendedNumber,
  NotationForm,
  SubscriptChar,
} from './types';

// --- Subscript Character Weights ---

const SUBSCRIPT_WEIGHTS: Record<SubscriptChar, number> = {
  o: 1.0,   // origin / omnidirectional
  x: 0.8,   // extension axis
  z: 0.6,   // depth axis
  w: 0.5,   // width axis
  y: 0.7,   // height axis
  v: 0.4,   // velocity component
  u: 0.3,   // potential component
  t: 0.9,   // temporal component
  s: 0.35,  // spatial component
  r: 0.45,  // radial component
};

// --- Factory Functions ---

export function subscript(
  base: 0 | typeof Math.PI | typeof Math.E,
  chars: SubscriptChar[]
): ExtendedSubscript {
  return Object.freeze({
    base,
    chars: Object.freeze([...chars]),
    degree: chars.length,
  });
}

export function extnum(
  sub: ExtendedSubscript,
  value?: number,
  phase: 'extended' | 'reduced' | 'neutral' = 'neutral'
): ExtendedNumber {
  const computed = value ?? computeExtendedValue(sub);
  return Object.freeze({ subscript: sub, value: computed, phase });
}

// --- Notation Equivalence (記法同値公理) ---

export function toNotation(sub: ExtendedSubscript): NotationForm {
  const baseStr = sub.base === 0 ? '0' : sub.base === Math.PI ? 'π' : 'e';
  const charsStr = sub.chars.join('');

  return Object.freeze({
    sensory: `${baseStr}${charsStr}`,                          // 0ooo
    dialogue: `${baseStr}_${sub.chars[0]}${sub.degree}`,       // 0_o3
    structural: `${baseStr}(${sub.chars[0]},${sub.degree})`,   // 0(o,3)
    semantic: JSON.stringify({
      base: sub.base,
      type: sub.chars[0],
      degree: sub.degree,
    }),
  });
}

// --- Parse from string (all notation forms) ---

export function parseSubscript(input: string): ExtendedSubscript | null {
  // Sensory: 0ooo, πxxx, ezzz
  const sensoryMatch = input.match(/^(0|π|e)([oxzwyvutsr]+)$/);
  if (sensoryMatch) {
    const base = sensoryMatch[1] === '0' ? 0 : sensoryMatch[1] === 'π' ? Math.PI : Math.E;
    const chars = sensoryMatch[2].split('') as SubscriptChar[];
    return subscript(base, chars);
  }

  // Dialogue: 0_o3, π_x4
  const dialogueMatch = input.match(/^(0|π|e)_([oxzwyvutsr])(\d+)$/);
  if (dialogueMatch) {
    const base = dialogueMatch[1] === '0' ? 0 : dialogueMatch[1] === 'π' ? Math.PI : Math.E;
    const char = dialogueMatch[2] as SubscriptChar;
    const degree = parseInt(dialogueMatch[3], 10);
    return subscript(base, Array(degree).fill(char));
  }

  // Structural: 0(o,3), π(x,4)
  const structuralMatch = input.match(/^(0|π|e)\(([oxzwyvutsr]),(\d+)\)$/);
  if (structuralMatch) {
    const base = structuralMatch[1] === '0' ? 0 : structuralMatch[1] === 'π' ? Math.PI : Math.E;
    const char = structuralMatch[2] as SubscriptChar;
    const degree = parseInt(structuralMatch[3], 10);
    return subscript(base, Array(degree).fill(char));
  }

  return null;
}

// --- Extended Value Computation ---

function computeExtendedValue(sub: ExtendedSubscript): number {
  const dimensionWeight = sub.chars.reduce(
    (sum, c) => sum + (SUBSCRIPT_WEIGHTS[c] ?? 0.5),
    0
  );
  return sub.base + dimensionWeight * 0.01; // subtle offset per dimension
}

// --- Extension Operator (⊕ 拡張) ---

export function extend(en: ExtendedNumber, char: SubscriptChar = 'o'): ExtendedNumber {
  const newSub = subscript(en.subscript.base, [...en.subscript.chars, char]);
  return extnum(newSub, undefined, 'extended');
}

// --- Reduction Operator (⊖ 縮約) ---

export function reduce(en: ExtendedNumber): ExtendedNumber {
  if (en.subscript.chars.length <= 1) {
    throw new RangeError('Cannot reduce below degree 1');
  }
  const newChars = en.subscript.chars.slice(0, -1);
  const newSub = subscript(en.subscript.base, [...newChars]);
  return extnum(newSub, undefined, 'reduced');
}

// --- Extension Chain (拡張チェーン) ---

export function extendChain(
  en: ExtendedNumber,
  chars: SubscriptChar[]
): ExtendedNumber[] {
  const chain: ExtendedNumber[] = [en];
  let current = en;
  for (const c of chars) {
    current = extend(current, c);
    chain.push(current);
  }
  return chain;
}

// --- Reduction Chain (縮約チェーン) ---

export function reduceChain(en: ExtendedNumber): ExtendedNumber[] {
  const chain: ExtendedNumber[] = [en];
  let current = en;
  while (current.subscript.chars.length > 1) {
    current = reduce(current);
    chain.push(current);
  }
  return chain;
}

// --- Equivalence Check ---

export function isEquivalent(a: ExtendedSubscript, b: ExtendedSubscript): boolean {
  return (
    a.base === b.base &&
    a.degree === b.degree &&
    a.chars.every((c, i) => c === b.chars[i])
  );
}

// --- Dual Extension/Reduction (ゼロπ同時拡張/縮小) ---

export function dualExtend(
  zero: ExtendedNumber,
  pi: ExtendedNumber,
  char: SubscriptChar = 'o'
): [ExtendedNumber, ExtendedNumber] {
  return [extend(zero, char), extend(pi, char)];
}

export function dualReduce(
  zero: ExtendedNumber,
  pi: ExtendedNumber
): [ExtendedNumber, ExtendedNumber] {
  return [reduce(zero), reduce(pi)];
}
