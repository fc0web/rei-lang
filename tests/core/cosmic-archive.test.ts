// ============================================================
// cosmic-archive.test.ts — 宇宙図書館拡張テスト (80 tests)
//
// §1 Genesis Ladder 12段階 (15)
// §2 段階操作 (10)
// §3 MLC操作 (10)
// §4 解体プロセス (15)
// §5 宇宙図書館 (15)
// §6 完全ライフサイクル (10)
// §7 十二因縁対応 (5)
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  FULL_GENESIS_LADDER,
  MLC_LABELS,
  TWELVE_NIDANAS,
  type FullGenesisPhase,
  type MLC,
  phaseOrder,
  comparePhase,
  nextPhase,
  prevPhase,
  getLadderStep,
  getPath,
  allPhases,
  mlcCount,
  mlcToArray,
  mlcFromArray,
  lifeScore,
  isFullyAlive,
  runDissolution,
  createCosmicLibrary,
  createSigmaFragment,
  archiveToLibrary,
  searchLibrary,
  findByEntityId,
  libraryStats,
  runFullLifecycle,
  runMultipleLifecycles,
  renderNidanaFlow,
  generateLifecycleReport,
} from '../../src/lang/core/cosmic-archive';

// ============================================================
// §1 Genesis Ladder 12段階 (15 tests)
// ============================================================
describe('§1 Genesis Ladder 12段階', () => {
  it('1.1 全13段階が定義されている（12+open）', () => {
    expect(FULL_GENESIS_LADDER).toHaveLength(13);
  });

  it('1.2 先頭がvoid', () => {
    expect(FULL_GENESIS_LADDER[0].id).toBe('void');
  });

  it('1.3 末尾がopen', () => {
    expect(FULL_GENESIS_LADDER[12].id).toBe('open');
  });

  it('1.4 dissolutionが10番目', () => {
    expect(FULL_GENESIS_LADDER[10].id).toBe('dissolution');
    expect(FULL_GENESIS_LADDER[10].index).toBe(10);
  });

  it('1.5 archiveが11番目', () => {
    expect(FULL_GENESIS_LADDER[11].id).toBe('archive');
    expect(FULL_GENESIS_LADDER[11].index).toBe(11);
  });

  it('1.6 dissolutionの十二因縁は老死', () => {
    expect(FULL_GENESIS_LADDER[10].nidana).toBe('老死');
    expect(FULL_GENESIS_LADDER[10].nidanaSanskrit).toBe('jarāmaraṇa');
  });

  it('1.7 archiveは十二因縁の外', () => {
    const archive = FULL_GENESIS_LADDER[11];
    expect(archive.nidana).toContain('十二因縁の外');
  });

  it('1.8 archiveの公理はA3', () => {
    expect(FULL_GENESIS_LADDER[11].axioms).toContain('A3');
  });

  it('1.9 dissolutionの公理はA2', () => {
    expect(FULL_GENESIS_LADDER[10].axioms).toContain('A2');
  });

  it('1.10 openのtransitionLabelはnull', () => {
    expect(FULL_GENESIS_LADDER[12].transitionLabel).toBeNull();
  });

  it('1.11 indexが0-12で連続', () => {
    FULL_GENESIS_LADDER.forEach((step, i) => {
      expect(step.index).toBe(i);
    });
  });

  it('1.12 全段階にnameJpがある', () => {
    FULL_GENESIS_LADDER.forEach(step => {
      expect(step.nameJp).toBeTruthy();
    });
  });

  it('1.13 conscious→dissolutionの遷移ラベル', () => {
    const conscious = FULL_GENESIS_LADDER[9];
    expect(conscious.transitionLabel).toBe('D-⊖₁: 解体開始');
  });

  it('1.14 dissolution→archiveの遷移ラベル', () => {
    const dissolution = FULL_GENESIS_LADDER[10];
    expect(dissolution.transitionLabel).toBe('Σ-∞: σ永続化');
  });

  it('1.15 archive→openの遷移ラベル', () => {
    const archive = FULL_GENESIS_LADDER[11];
    expect(archive.transitionLabel).toContain('門は閉じない');
  });
});

// ============================================================
// §2 段階操作 (10 tests)
// ============================================================
describe('§2 段階操作', () => {
  it('2.1 phaseOrder: voidは0', () => {
    expect(phaseOrder('void')).toBe(0);
  });

  it('2.2 phaseOrder: openは12', () => {
    expect(phaseOrder('open')).toBe(12);
  });

  it('2.3 phaseOrder: dissolutionは10', () => {
    expect(phaseOrder('dissolution')).toBe(10);
  });

  it('2.4 comparePhase: void < conscious', () => {
    expect(comparePhase('void', 'conscious')).toBeLessThan(0);
  });

  it('2.5 comparePhase: archive > conscious', () => {
    expect(comparePhase('archive', 'conscious')).toBeGreaterThan(0);
  });

  it('2.6 nextPhase: conscious → dissolution', () => {
    expect(nextPhase('conscious')).toBe('dissolution');
  });

  it('2.7 nextPhase: dissolution → archive', () => {
    expect(nextPhase('dissolution')).toBe('archive');
  });

  it('2.8 nextPhase: archive → open', () => {
    expect(nextPhase('archive')).toBe('open');
  });

  it('2.9 nextPhase: open → null', () => {
    expect(nextPhase('open')).toBeNull();
  });

  it('2.10 getPath: void → archive は12段階', () => {
    const path = getPath('void', 'archive');
    expect(path).toHaveLength(12);
    expect(path[0]).toBe('void');
    expect(path[11]).toBe('archive');
  });
});

// ============================================================
// §3 MLC操作 (10 tests)
// ============================================================
describe('§3 MLC操作', () => {
  const fullMLC: MLC = {
    boundary: true, metabolism: true, memory: true,
    selfRepair: true, autopoiesis: true, emergence: true,
  };
  const emptyMLC: MLC = {
    boundary: false, metabolism: false, memory: false,
    selfRepair: false, autopoiesis: false, emergence: false,
  };

  it('3.1 mlcCount: 全true = 6', () => {
    expect(mlcCount(fullMLC)).toBe(6);
  });

  it('3.2 mlcCount: 全false = 0', () => {
    expect(mlcCount(emptyMLC)).toBe(0);
  });

  it('3.3 mlcCount: 部分的', () => {
    const partial: MLC = { ...emptyMLC, boundary: true, metabolism: true, memory: true };
    expect(mlcCount(partial)).toBe(3);
  });

  it('3.4 mlcToArray: 6要素配列', () => {
    const arr = mlcToArray(fullMLC);
    expect(arr).toHaveLength(6);
    expect(arr.every(Boolean)).toBe(true);
  });

  it('3.5 mlcFromArray: 往復', () => {
    const arr = mlcToArray(fullMLC);
    const restored = mlcFromArray(arr);
    expect(mlcCount(restored)).toBe(6);
  });

  it('3.6 lifeScore: 全true = 1.0', () => {
    expect(lifeScore(fullMLC)).toBe(1.0);
  });

  it('3.7 lifeScore: 全false = 0.0', () => {
    expect(lifeScore(emptyMLC)).toBe(0.0);
  });

  it('3.8 lifeScore: 3/6 = 0.5', () => {
    const half: MLC = { ...emptyMLC, boundary: true, metabolism: true, memory: true };
    expect(lifeScore(half)).toBe(0.5);
  });

  it('3.9 isFullyAlive: 全true', () => {
    expect(isFullyAlive(fullMLC)).toBe(true);
  });

  it('3.10 isFullyAlive: 1つでも欠けるとfalse', () => {
    const almost: MLC = { ...fullMLC, emergence: false };
    expect(isFullyAlive(almost)).toBe(false);
  });
});

// ============================================================
// §4 解体プロセス (15 tests)
// ============================================================
describe('§4 解体プロセス', () => {
  const fullMLC: MLC = {
    boundary: true, metabolism: true, memory: true,
    selfRepair: true, autopoiesis: true, emergence: true,
  };

  it('4.1 完全MLCからの解体: 6ステップ', () => {
    const steps = runDissolution('test-1', fullMLC);
    expect(steps).toHaveLength(6);
  });

  it('4.2 解体順序: 創発が最初に失われる', () => {
    const steps = runDissolution('test-2', fullMLC);
    expect(steps[0].lostCondition).toBe('創発');
  });

  it('4.3 解体順序: 境界が最後に失われる', () => {
    const steps = runDissolution('test-3', fullMLC);
    expect(steps[5].lostCondition).toBe('境界');
  });

  it('4.4 解体最終: MLC全てfalse', () => {
    const steps = runDissolution('test-4', fullMLC);
    const last = steps[steps.length - 1];
    expect(mlcCount(last.remainingMLC)).toBe(0);
  });

  it('4.5 解体最終段階: dissolution', () => {
    const steps = runDissolution('test-5', fullMLC);
    expect(steps[steps.length - 1].phase).toBe('dissolution');
  });

  it('4.6 段階的なMLC減少', () => {
    const steps = runDissolution('test-6', fullMLC);
    const counts = steps.map(s => mlcCount(s.remainingMLC));
    // 5, 4, 3, 2, 1, 0
    expect(counts).toEqual([5, 4, 3, 2, 1, 0]);
  });

  it('4.7 部分MLCからの解体: 3条件のみ', () => {
    const partial: MLC = {
      boundary: true, metabolism: true, memory: true,
      selfRepair: false, autopoiesis: false, emergence: false,
    };
    const steps = runDissolution('test-7', partial);
    expect(steps).toHaveLength(3);
  });

  it('4.8 空MLCからの解体: 0ステップ', () => {
    const empty: MLC = {
      boundary: false, metabolism: false, memory: false,
      selfRepair: false, autopoiesis: false, emergence: false,
    };
    const steps = runDissolution('test-8', empty);
    expect(steps).toHaveLength(0);
  });

  it('4.9 各ステップにdescriptionがある', () => {
    const steps = runDissolution('test-9', fullMLC);
    steps.forEach(s => {
      expect(s.description).toBeTruthy();
    });
  });

  it('4.10 各ステップのstep番号が1始まりで連続', () => {
    const steps = runDissolution('test-10', fullMLC);
    steps.forEach((s, i) => {
      expect(s.step).toBe(i + 1);
    });
  });

  it('4.11 解体はGenesis Ladderの逆走', () => {
    const steps = runDissolution('test-11', fullMLC);
    // phase は emergent(5条件) → autopoietic(4) → self-maintaining(3) → proto-life(2) → number(1) → dissolution(0)
    const phases = steps.map(s => s.phase);
    expect(phases[0]).toBe('autopoietic');   // 創発失って5条件
    expect(phases[1]).toBe('self-maintaining'); // 自己生成失って4条件
    expect(phases[5]).toBe('dissolution');    // 全失って0条件
  });

  it('4.12 remainingMLCはimmutable', () => {
    const steps = runDissolution('test-12', fullMLC);
    expect(() => {
      (steps[0].remainingMLC as any).boundary = false;
    }).toThrow();
  });

  it('4.13 解体途中の段階が正しい', () => {
    const steps = runDissolution('test-13', fullMLC);
    // step 3: 3条件残 → proto-life
    expect(steps[2].phase).toBe('proto-life');
  });

  it('4.14 1条件のみの解体', () => {
    const one: MLC = {
      boundary: true, metabolism: false, memory: false,
      selfRepair: false, autopoiesis: false, emergence: false,
    };
    const steps = runDissolution('test-14', one);
    expect(steps).toHaveLength(1);
    expect(steps[0].lostCondition).toBe('境界');
  });

  it('4.15 解体の逆順性: 獲得の逆', () => {
    // 獲得順: boundary → metabolism → memory → selfRepair → autopoiesis → emergence
    // 解体順: emergence → autopoiesis → selfRepair → memory → metabolism → boundary
    const steps = runDissolution('test-15', fullMLC);
    const lost = steps.map(s => s.lostCondition);
    expect(lost).toEqual(['創発', '自己生成', '修復', '記憶', '代謝', '境界']);
  });
});

// ============================================================
// §5 宇宙図書館 (15 tests)
// ============================================================
describe('§5 宇宙図書館', () => {
  it('5.1 createCosmicLibrary: 空の図書館', () => {
    const lib = createCosmicLibrary();
    expect(lib.totalArchived).toBe(0);
    expect(lib.fragments).toHaveLength(0);
  });

  it('5.2 createSigmaFragment: 基本生成', () => {
    const frag = createSigmaFragment(
      'entity-1', ['genesis:void', 'genesis:dot'], 'growth',
      10, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true },
      100,
    );
    expect(frag.entityId).toBe('entity-1');
    expect(frag.peakPhase).toBe('conscious');
    expect(frag.transformCount).toBe(10);
  });

  it('5.3 archiveToLibrary: 断片追加', () => {
    const lib = createCosmicLibrary();
    const frag = createSigmaFragment('e1', [], 'rest', 5, 'emergent',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50);
    const updated = archiveToLibrary(lib, frag);
    expect(updated.totalArchived).toBe(1);
    expect(updated.fragments).toHaveLength(1);
  });

  it('5.4 archiveToLibrary: immutable（元の図書館は変わらない）', () => {
    const lib = createCosmicLibrary();
    const frag = createSigmaFragment('e1', [], 'rest', 5, 'emergent',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50);
    archiveToLibrary(lib, frag);
    expect(lib.totalArchived).toBe(0); // 元は変わらない
  });

  it('5.5 archiveToLibrary: highestPhaseが更新される', () => {
    let lib = createCosmicLibrary();
    const f1 = createSigmaFragment('e1', [], 'rest', 5, 'proto-life',
      { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false }, 30);
    const f2 = createSigmaFragment('e2', [], 'rest', 10, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 80);
    lib = archiveToLibrary(lib, f1);
    lib = archiveToLibrary(lib, f2);
    expect(lib.highestPhase).toBe('conscious');
  });

  it('5.6 searchLibrary: 条件検索', () => {
    let lib = createCosmicLibrary();
    lib = archiveToLibrary(lib, createSigmaFragment('e1', [], 'growth', 10, 'emergent',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50));
    lib = archiveToLibrary(lib, createSigmaFragment('e2', [], 'rest', 3, 'proto-life',
      { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false }, 20));
    const results = searchLibrary(lib, f => f.tendency === 'growth');
    expect(results).toHaveLength(1);
    expect(results[0].entityId).toBe('e1');
  });

  it('5.7 findByEntityId: 存在する個体', () => {
    let lib = createCosmicLibrary();
    lib = archiveToLibrary(lib, createSigmaFragment('alpha', [], 'rest', 5, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 60));
    const found = findByEntityId(lib, 'alpha');
    expect(found).toBeDefined();
    expect(found!.entityId).toBe('alpha');
  });

  it('5.8 findByEntityId: 存在しない個体', () => {
    const lib = createCosmicLibrary();
    expect(findByEntityId(lib, 'nonexistent')).toBeUndefined();
  });

  it('5.9 libraryStats: 空の図書館', () => {
    const stats = libraryStats(createCosmicLibrary());
    expect(stats.totalFragments).toBe(0);
    expect(stats.averageLifespan).toBe(0);
  });

  it('5.10 libraryStats: 複数断片の統計', () => {
    let lib = createCosmicLibrary();
    lib = archiveToLibrary(lib, createSigmaFragment('e1', [], 'growth', 10, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 100));
    lib = archiveToLibrary(lib, createSigmaFragment('e2', [], 'rest', 6, 'emergent',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 60));
    const stats = libraryStats(lib);
    expect(stats.totalFragments).toBe(2);
    expect(stats.averageLifespan).toBe(80);
    expect(stats.totalTransforms).toBe(16);
  });

  it('5.11 libraryStats: phaseDistribution', () => {
    let lib = createCosmicLibrary();
    lib = archiveToLibrary(lib, createSigmaFragment('e1', [], 'r', 5, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50));
    lib = archiveToLibrary(lib, createSigmaFragment('e2', [], 'r', 5, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50));
    lib = archiveToLibrary(lib, createSigmaFragment('e3', [], 'r', 3, 'proto-life',
      { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false }, 20));
    const stats = libraryStats(lib);
    expect(stats.phaseDistribution['conscious']).toBe(2);
    expect(stats.phaseDistribution['proto-life']).toBe(1);
  });

  it('5.12 totalTransformsが累積', () => {
    let lib = createCosmicLibrary();
    for (let i = 0; i < 5; i++) {
      lib = archiveToLibrary(lib, createSigmaFragment(`e${i}`, [], 'r', 10, 'emergent',
        { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50));
    }
    expect(lib.totalTransforms).toBe(50);
  });

  it('5.13 σ断片はimmutable', () => {
    const frag = createSigmaFragment('e1', ['a', 'b'], 'rest', 5, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50);
    expect(() => { (frag as any).entityId = 'changed'; }).toThrow();
    expect(() => { (frag.history as any).push('c'); }).toThrow();
  });

  it('5.14 宇宙図書館から削除はできない（A3不可逆性）', () => {
    let lib = createCosmicLibrary();
    lib = archiveToLibrary(lib, createSigmaFragment('e1', [], 'r', 5, 'conscious',
      { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, 50));
    // fragments配列はfrozenなのでspliceできない
    expect(() => { (lib.fragments as any).splice(0, 1); }).toThrow();
  });

  it('5.15 大量アーカイブ: 100個体', () => {
    let lib = createCosmicLibrary();
    for (let i = 0; i < 100; i++) {
      lib = archiveToLibrary(lib, createSigmaFragment(`e${i}`, [], 'r', i, 'emergent',
        { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true }, i * 10));
    }
    expect(lib.totalArchived).toBe(100);
    const stats = libraryStats(lib);
    expect(stats.totalFragments).toBe(100);
  });
});

// ============================================================
// §6 完全ライフサイクル (10 tests)
// ============================================================
describe('§6 完全ライフサイクル', () => {
  it('6.1 runFullLifecycle: 基本動作', () => {
    const lc = runFullLifecycle('life-1');
    expect(lc.entityId).toBe('life-1');
    expect(lc.peakPhase).toBe('conscious');
    expect(lc.genesisPath[0]).toBe('void');
  });

  it('6.2 genesisPath: void→conscious は10段階', () => {
    const lc = runFullLifecycle('life-2');
    expect(lc.genesisPath).toHaveLength(10);
    expect(lc.genesisPath[9]).toBe('conscious');
  });

  it('6.3 dissolution: 6ステップ（全MLC解体）', () => {
    const lc = runFullLifecycle('life-3');
    expect(lc.dissolution).toHaveLength(6);
  });

  it('6.4 fragment: σ断片が生成される', () => {
    const lc = runFullLifecycle('life-4');
    expect(lc.fragment.entityId).toBe('life-4');
    expect(lc.fragment.peakPhase).toBe('conscious');
    expect(lc.fragment.history.length).toBeGreaterThan(0);
  });

  it('6.5 fragment.history: genesis + dissolution', () => {
    const lc = runFullLifecycle('life-5');
    const genesisEntries = lc.fragment.history.filter(h => h.startsWith('genesis:'));
    const dissEntries = lc.fragment.history.filter(h => h.startsWith('dissolution:'));
    expect(genesisEntries.length).toBe(10);
    expect(dissEntries.length).toBe(6);
  });

  it('6.6 peakPhaseをproto-lifeに制限', () => {
    const lc = runFullLifecycle('life-6', 'proto-life');
    expect(lc.peakPhase).toBe('proto-life');
    expect(lc.dissolution).toHaveLength(3); // boundary, metabolism, memory
  });

  it('6.7 totalStepsが正しい', () => {
    const lc = runFullLifecycle('life-7');
    expect(lc.totalSteps).toBe(lc.genesisPath.length + lc.dissolution.length);
  });

  it('6.8 runMultipleLifecycles: 複数個体', () => {
    const { lifecycles, library } = runMultipleLifecycles([
      { id: 'a', peakPhase: 'conscious' },
      { id: 'b', peakPhase: 'emergent' },
      { id: 'c', peakPhase: 'proto-life' },
    ]);
    expect(lifecycles).toHaveLength(3);
    expect(library.totalArchived).toBe(3);
  });

  it('6.9 runMultipleLifecycles: 全個体が図書館に保存', () => {
    const { library } = runMultipleLifecycles([
      { id: 'x' }, { id: 'y' }, { id: 'z' },
    ]);
    expect(findByEntityId(library, 'x')).toBeDefined();
    expect(findByEntityId(library, 'y')).toBeDefined();
    expect(findByEntityId(library, 'z')).toBeDefined();
  });

  it('6.10 generateLifecycleReport: 文字列生成', () => {
    const lc = runFullLifecycle('report-1');
    const report = generateLifecycleReport(lc);
    expect(report).toContain('report-1');
    expect(report).toContain('情報は消えない');
    expect(report).toContain('門は閉じない');
  });
});

// ============================================================
// §7 十二因縁対応 (5 tests)
// ============================================================
describe('§7 十二因縁対応', () => {
  it('7.1 TWELVE_NIDANAS: 12項目', () => {
    expect(TWELVE_NIDANAS).toHaveLength(12);
  });

  it('7.2 先頭は無明(avidyā)→void', () => {
    expect(TWELVE_NIDANAS[0].nidana).toBe('無明');
    expect(TWELVE_NIDANAS[0].phase).toBe('void');
  });

  it('7.3 末尾は老死(jarāmaraṇa)→dissolution', () => {
    expect(TWELVE_NIDANAS[11].nidana).toBe('老死');
    expect(TWELVE_NIDANAS[11].phase).toBe('dissolution');
  });

  it('7.4 renderNidanaFlow: 完全なフロー文字列', () => {
    const flow = renderNidanaFlow();
    expect(flow).toContain('無明');
    expect(flow).toContain('老死');
    expect(flow).toContain('宇宙図書館');
    expect(flow).toContain('門は閉じない');
    expect(flow).toContain('存在のためのことば');
  });

  it('7.5 全十二因縁がGenesis Ladderの有効な段階を指す', () => {
    const validPhases = allPhases();
    TWELVE_NIDANAS.forEach(n => {
      expect(validPhases).toContain(n.phase);
    });
  });
});
