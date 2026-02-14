// ============================================================
// Rei v0.5 — AgentSpace（エージェント空間）
// Phase 4a: パズル統一理論 × ゲーム統一理論の Agent 基盤
//
// 核心的洞察:
//   パズル = 協調的マルチエージェントシステム（全セルが共通目標に向かう）
//   ゲーム = 競争的マルチエージェントシステム（プレイヤーが対立目標を持つ）
//   違いは Agent の behavior と Mediator の strategy だけ
//
// D-FUMT 6属性の統一対応:
//   場(Field)    = AgentSpace 全体（盤面 = 環境）
//   流れ(Flow)   = ラウンド進行 / ターン進行
//   記憶(Memory)  = 消去履歴 / 棋譜
//   層(Layer)    = 推論深度（制約層 / 探索深度）
//   関係(Relation) = 制約ネットワーク / プレイヤー間対立
//   意志(Will)   = 候補選択戦略 / ゲーム戦略
//
// Author: Nobuki Fujimoto / Claude (collaborative design)
// ============================================================

import { ReiEventBus, type FlowMomentum } from './event-bus';
import {
  ReiAgent, AgentRegistry,
  type AgentBehavior, type Perception, type Decision, type ActionResult,
  type AgentMemoryEntry,
} from './entity-agent';
import {
  ReiMediator,
  type ConflictStrategy, type RoundResult, type RunResult, type MediatorSigma,
} from './mediator';
import {
  type PuzzleSpace, type PuzzleCell, type ConstraintGroup,
  type PropagationStep,
} from './puzzle';
import {
  type GameSpace, type GameState, type GameRules, type GameMove,
  selectBestMove, type Player,
} from './game';

// ═══════════════════════════════════════════
// Part 1: AgentSpace 型定義
// ═══════════════════════════════════════════

/** AgentSpace の種類 */
export type AgentSpaceKind = 'puzzle' | 'game';

/** AgentSpace ラウンド結果 */
export interface AgentSpaceRound {
  round: number;
  timestamp: number;
  actions: AgentSpaceAction[];
  metrics: AgentSpaceMetrics;
}

/** 個別アクション記録 */
export interface AgentSpaceAction {
  agentId: string;
  type: 'eliminate' | 'confirm' | 'move' | 'none';
  detail: string;
  data?: Record<string, any>;
}

/** ラウンドメトリクス */
export interface AgentSpaceMetrics {
  activeAgents: number;
  totalActions: number;
  noneCount: number;
  convergenceRatio: number;  // none率 (0.0〜1.0)
}

/** AgentSpace 実行結果 */
export interface AgentSpaceResult {
  reiType: 'AgentSpaceResult';
  kind: AgentSpaceKind;
  totalRounds: number;
  converged: boolean;
  solved: boolean;
  rounds: AgentSpaceRound[];
  // パズル固有
  grid?: number[][];
  totalEliminations?: number;
  totalConfirmations?: number;
  // ゲーム固有
  winner?: number | null;
  moveHistory?: GameMove[];
  finalBoard?: any[];
}

/** AgentSpace σ */
export interface AgentSpaceSigma {
  reiType: 'AgentSpaceSigma';
  kind: AgentSpaceKind;
  totalRounds: number;
  converged: boolean;
  solved: boolean;
  agentCount: number;
  convergenceHistory: number[];
  field: Record<string, any>;
  flow: { momentum: string; roundRate: number };
  memory: { totalActions: number; roundHistory: number[] };
}

/** AgentSpace 本体 */
export interface AgentSpace {
  reiType: 'AgentSpace';
  kind: AgentSpaceKind;

  // 内部コンポーネント
  registry: AgentRegistry;
  eventBus: ReiEventBus;
  mediator: ReiMediator;

  // Agent ID マッピング
  agentIds: string[];

  // パズル固有データ
  puzzleData?: PuzzleAgentData;

  // ゲーム固有データ
  gameData?: GameAgentData;

  // 実行状態
  rounds: AgentSpaceRound[];
  solved: boolean;
  convergenceHistory: number[];
}

/** パズル Agent 用データ */
interface PuzzleAgentData {
  size: number;
  puzzleType: string;
  constraints: ConstraintGroup[];
  // row,col → agentId のマッピング
  cellMap: Map<string, string>;
  // agentId → {row, col} の逆マッピング
  posMap: Map<string, { row: number; col: number }>;
  totalEliminations: number;
  totalConfirmations: number;
}

/** ゲーム Agent 用データ */
interface GameAgentData {
  gameName: string;
  rules: GameRules;
  state: GameState;
  maxDepth: number;
  strategies: [string, string];  // [P1戦略, P2戦略]
  searchNodes: number;
}

// ═══════════════════════════════════════════
// Part 2: パズル → AgentSpace 変換
// ═══════════════════════════════════════════

/**
 * PuzzleSpace を AgentSpace に変換する
 * 各セルが cooperative Agent になり、制約伝播を Agent の知覚→判断→行動で実現
 */
export function createPuzzleAgentSpace(puzzle: PuzzleSpace): AgentSpace {
  const eventBus = new ReiEventBus();
  const registry = new AgentRegistry(eventBus);
  const mediator = new ReiMediator(eventBus, registry);
  mediator.defaultStrategy = 'cooperative';

  const cellMap = new Map<string, string>();
  const posMap = new Map<string, { row: number; col: number }>();
  const agentIds: string[] = [];

  // 各セルを Agent として生成
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const cell = puzzle.cells[r][c];
      const cellKey = `${r},${c}`;

      // Agent の value = { row, col, value, candidates, fixed }
      const agentValue = {
        reiType: 'PuzzleCell',
        row: r,
        col: c,
        value: cell.value,
        candidates: [...cell.candidates],
        fixed: cell.fixed,
      };

      const agent = registry.spawn(agentValue, {
        id: `cell_${r}_${c}`,
        behavior: 'cooperative',
      });

      cellMap.set(cellKey, agent.id);
      posMap.set(agent.id, { row: r, col: c });
      agentIds.push(agent.id);

      // 確定済みセルは初期記憶に追加
      if (cell.fixed) {
        agent.addMemory('perception', `初期値: ${cell.value} (固定)`);
      }
    }
  }

  return {
    reiType: 'AgentSpace',
    kind: 'puzzle',
    registry,
    eventBus,
    mediator,
    agentIds,
    puzzleData: {
      size: puzzle.size,
      puzzleType: puzzle.puzzleType,
      constraints: puzzle.constraints,
      cellMap,
      posMap,
      totalEliminations: 0,
      totalConfirmations: 0,
    },
    rounds: [],
    solved: false,
    convergenceHistory: [],
  };
}

// ═══════════════════════════════════════════
// Part 3: ゲーム → AgentSpace 変換
// ═══════════════════════════════════════════

/**
 * GameSpace を AgentSpace に変換する
 * 各プレイヤーが competitive Agent になり、ターンベースで対局
 */
export function createGameAgentSpace(
  game: GameSpace,
  p1Strategy?: string,
  p2Strategy?: string,
): AgentSpace {
  const eventBus = new ReiEventBus();
  const registry = new AgentRegistry(eventBus);
  const mediator = new ReiMediator(eventBus, registry);
  mediator.defaultStrategy = 'priority';

  const s1 = p1Strategy ?? game.strategy;
  const s2 = p2Strategy ?? game.strategy;

  const agentIds: string[] = [];

  // Player 1 Agent
  const p1Agent = registry.spawn(
    { reiType: 'Player', player: 1, strategy: s1 },
    { id: 'player_1', behavior: 'explorative' },
  );
  agentIds.push(p1Agent.id);
  mediator.setAgentPriority(p1Agent.id, 1.0);

  // Player 2 Agent
  const p2Agent = registry.spawn(
    { reiType: 'Player', player: 2, strategy: s2 },
    { id: 'player_2', behavior: 'explorative' },
  );
  agentIds.push(p2Agent.id);
  mediator.setAgentPriority(p2Agent.id, 1.0);

  return {
    reiType: 'AgentSpace',
    kind: 'game',
    registry,
    eventBus,
    mediator,
    agentIds,
    gameData: {
      gameName: game.rules.name,
      rules: game.rules,
      state: { ...game.state },
      maxDepth: game.maxDepth,
      strategies: [s1, s2],
      searchNodes: 0,
    },
    rounds: [],
    solved: false,
    convergenceHistory: [],
  };
}

// ═══════════════════════════════════════════
// Part 4: パズル Agent 実行エンジン
// ═══════════════════════════════════════════

/**
 * パズル AgentSpace の1ラウンド実行
 * 全セルAgent が同時に: 知覚 → 判断(候補消去) → 行動(確定)
 */
function puzzleRunRound(space: AgentSpace): AgentSpaceRound {
  const pd = space.puzzleData!;
  const roundNum = space.rounds.length + 1;
  const actions: AgentSpaceAction[] = [];

  space.eventBus.emit('system:init', {
    type: 'puzzle_round_start',
    round: roundNum,
  }, 'agent-space');

  // ── Phase 1: 環境構築（確定値マップ） ──
  const confirmedValues = new Map<string, number>(); // "row,col" → value
  for (const agentId of space.agentIds) {
    const agent = space.registry.get(agentId);
    if (!agent || agent.state !== 'active') continue;
    const v = agent.value;
    if (v.value !== 0) {
      confirmedValues.set(`${v.row},${v.col}`, v.value);
    }
  }

  // ── Phase 2: 全Agent同時知覚 & 判断 & 行動 ──
  let eliminationCount = 0;
  let confirmationCount = 0;
  let noneCount = 0;

  for (const agentId of space.agentIds) {
    const agent = space.registry.get(agentId);
    if (!agent || agent.state !== 'active') continue;
    const v = agent.value;

    // 既に確定済みなら skip
    if (v.value !== 0) {
      noneCount++;
      actions.push({
        agentId,
        type: 'none',
        detail: `セル(${v.row},${v.col}) = ${v.value} (確定済み)`,
      });
      continue;
    }

    // ── 知覚: 同じ制約グループの確定値を収集 ──
    const neighborValues = new Set<number>();
    for (const constraint of pd.constraints) {
      const inGroup = constraint.cells.some(
        ([cr, cc]) => cr === v.row && cc === v.col
      );
      if (!inGroup) continue;

      for (const [cr, cc] of constraint.cells) {
        if (cr === v.row && cc === v.col) continue;
        const nv = confirmedValues.get(`${cr},${cc}`);
        if (nv !== undefined) {
          neighborValues.add(nv);
        }
      }
    }

    // ── 判断: 候補から確定済みの値を消去 ──
    const prevCandidates = [...v.candidates];
    const newCandidates = v.candidates.filter(
      (c: number) => !neighborValues.has(c)
    );
    const eliminated = prevCandidates.filter(
      (c: number) => !newCandidates.includes(c)
    );

    if (eliminated.length > 0) {
      // ── 行動: 候補消去 ──
      eliminationCount += eliminated.length;
      agent.addMemory('action',
        `候補消去: [${eliminated.join(',')}] (制約伝播 round ${roundNum})`
      );

      // Agent の value を更新
      const newValue = { ...v, candidates: newCandidates };

      // 候補が1つになったら確定
      if (newCandidates.length === 1) {
        newValue.value = newCandidates[0];
        newValue.candidates = [];
        confirmationCount++;
        pd.totalConfirmations++;

        agent.addMemory('action',
          `確定: ${newValue.value} (唯一候補 round ${roundNum})`
        );

        actions.push({
          agentId,
          type: 'confirm',
          detail: `セル(${v.row},${v.col}) → ${newValue.value}`,
          data: { row: v.row, col: v.col, value: newValue.value, eliminated },
        });

        space.eventBus.emit('entity:transform', {
          agentId,
          type: 'confirm',
          row: v.row, col: v.col,
          value: newValue.value,
        }, agentId);
      } else {
        actions.push({
          agentId,
          type: 'eliminate',
          detail: `セル(${v.row},${v.col}): 候補[${eliminated.join(',')}]消去 → 残[${newCandidates.join(',')}]`,
          data: { row: v.row, col: v.col, eliminated, remaining: newCandidates },
        });
      }

      // Agent value を直接更新（ReiAgent._value への書き込み）
      agent.value = newValue;

      pd.totalEliminations += eliminated.length;
    } else {
      // 変化なし
      noneCount++;

      // ── Naked Pair 検出（層2推論） ──
      const nakedPairResult = puzzleNakedPairCheck(space, v.row, v.col, v.candidates);
      if (nakedPairResult) {
        // Naked Pair で消去できる候補がある
        eliminationCount += nakedPairResult.eliminated;
        pd.totalEliminations += nakedPairResult.eliminated;
        noneCount--; // 実際にアクションがあった

        agent.addMemory('action',
          `Naked Pair検出: ${nakedPairResult.detail} (層2推論 round ${roundNum})`
        );

        actions.push({
          agentId,
          type: 'eliminate',
          detail: nakedPairResult.detail,
          data: nakedPairResult.data,
        });
      } else {
        actions.push({
          agentId,
          type: 'none',
          detail: `セル(${v.row},${v.col}): 変化なし (候補[${v.candidates.join(',')}])`,
        });
      }
    }
  }

  const activeAgents = space.agentIds.length;
  const totalActions = actions.filter(a => a.type !== 'none').length;
  const convergenceRatio = activeAgents > 0 ? noneCount / activeAgents : 1.0;

  const round: AgentSpaceRound = {
    round: roundNum,
    timestamp: Date.now(),
    actions,
    metrics: {
      activeAgents,
      totalActions,
      noneCount,
      convergenceRatio,
    },
  };

  space.rounds.push(round);
  space.convergenceHistory.push(convergenceRatio);

  // 解決判定
  const allConfirmed = space.agentIds.every(id => {
    const agent = space.registry.get(id);
    return agent && agent.value.value !== 0;
  });
  if (allConfirmed) {
    space.solved = true;
  }

  space.eventBus.emit('system:init', {
    type: 'puzzle_round_end',
    round: roundNum,
    eliminations: eliminationCount,
    confirmations: confirmationCount,
    solved: space.solved,
  }, 'agent-space');

  return round;
}

/**
 * 停滞時のバックトラッキング（層3推論 — 仮定→検証）
 * 候補が最少のセルを選び、1つの候補を仮定して矛盾チェック
 */
function puzzleBacktrackStep(space: AgentSpace): boolean {
  const pd = space.puzzleData!;

  // 未確定セルの中で候補が最少のものを探す
  let bestAgent: ReiAgent | null = null;
  let bestCandidates: number[] = [];
  let bestPos = { row: 0, col: 0 };

  for (const agentId of space.agentIds) {
    const agent = space.registry.get(agentId);
    if (!agent || agent.value.value !== 0) continue;
    const cands: number[] = agent.value.candidates;
    if (cands.length === 0) continue;
    if (!bestAgent || cands.length < bestCandidates.length) {
      bestAgent = agent;
      bestCandidates = cands;
      bestPos = { row: agent.value.row, col: agent.value.col };
    }
  }

  if (!bestAgent || bestCandidates.length === 0) return false;

  // 候補を1つ仮定して矛盾チェック
  for (const guess of bestCandidates) {
    if (puzzleIsValidGuess(space, bestPos.row, bestPos.col, guess)) {
      bestAgent.value = {
        ...bestAgent.value,
        value: guess,
        candidates: [],
      };
      bestAgent.addMemory('action',
        `仮定: ${guess} at (${bestPos.row},${bestPos.col}) (層3推論 — バックトラック)`
      );
      pd.totalConfirmations++;
      return true;
    }
  }

  return false;
}

/**
 * 仮定値が現在の確定値と矛盾しないかチェック
 */
function puzzleIsValidGuess(
  space: AgentSpace, row: number, col: number, value: number,
): boolean {
  const pd = space.puzzleData!;

  for (const constraint of pd.constraints) {
    const inGroup = constraint.cells.some(([cr, cc]) => cr === row && cc === col);
    if (!inGroup) continue;

    for (const [cr, cc] of constraint.cells) {
      if (cr === row && cc === col) continue;
      const peerId = pd.cellMap.get(`${cr},${cc}`);
      if (!peerId) continue;
      const peer = space.registry.get(peerId);
      if (peer && peer.value.value === value) return false;
    }
  }
  return true;
}

/**
 * Naked Pair 検出（層2推論）
 * 同じ制約グループ内で、同じ2候補を持つ2セルを見つける
 * → グループ内の他セルからその2候補を消去
 */
function puzzleNakedPairCheck(
  space: AgentSpace,
  row: number, col: number,
  candidates: number[],
): { eliminated: number; detail: string; data: Record<string, any> } | null {
  if (candidates.length !== 2) return null;
  const pd = space.puzzleData!;

  for (const constraint of pd.constraints) {
    const inGroup = constraint.cells.some(
      ([cr, cc]) => cr === row && cc === col
    );
    if (!inGroup) continue;

    // 同じ2候補を持つペアを探す
    for (const [cr, cc] of constraint.cells) {
      if (cr === row && cc === col) continue;
      const peerId = pd.cellMap.get(`${cr},${cc}`);
      if (!peerId) continue;
      const peer = space.registry.get(peerId);
      if (!peer || peer.value.value !== 0) continue;

      const peerCands: number[] = peer.value.candidates;
      if (peerCands.length !== 2) continue;
      if (peerCands[0] !== candidates[0] || peerCands[1] !== candidates[1]) continue;

      // Naked Pair 発見！グループ内の他セルから候補を消去
      let totalElim = 0;
      for (const [or, oc] of constraint.cells) {
        if ((or === row && oc === col) || (or === cr && oc === cc)) continue;
        const otherId = pd.cellMap.get(`${or},${oc}`);
        if (!otherId) continue;
        const other = space.registry.get(otherId);
        if (!other || other.value.value !== 0) continue;

        const otherCands: number[] = other.value.candidates;
        const newCands = otherCands.filter(
          (c: number) => !candidates.includes(c)
        );
        if (newCands.length < otherCands.length) {
          totalElim += otherCands.length - newCands.length;
          const newVal = { ...other.value, candidates: newCands };
          if (newCands.length === 1) {
            newVal.value = newCands[0];
            newVal.candidates = [];
            pd.totalConfirmations++;
          }
          other.value = newVal;
          other.addMemory('action',
            `Naked Pair [${candidates.join(',')}] により候補消去`
          );
        }
      }

      if (totalElim > 0) {
        return {
          eliminated: totalElim,
          detail: `Naked Pair [${candidates.join(',')}] @ (${row},${col})+(${cr},${cc}) in ${constraint.label}: ${totalElim}候補消去`,
          data: { pair: candidates, cells: [[row, col], [cr, cc]], group: constraint.label },
        };
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════
// Part 5: ゲーム Agent 実行エンジン
// ═══════════════════════════════════════════

/**
 * ゲーム AgentSpace の1ラウンド（= 1ターン）実行
 * 現在の手番プレイヤーの Agent が: 知覚 → 判断(手を選択) → 行動(手を打つ)
 */
function gameRunRound(space: AgentSpace): AgentSpaceRound {
  const gd = space.gameData!;
  const roundNum = space.rounds.length + 1;
  const actions: AgentSpaceAction[] = [];

  space.eventBus.emit('system:init', {
    type: 'game_round_start',
    round: roundNum,
    currentPlayer: gd.state.currentPlayer,
  }, 'agent-space');

  // ゲーム終了チェック
  if (gd.state.status !== 'playing') {
    space.solved = true;
    const round: AgentSpaceRound = {
      round: roundNum,
      timestamp: Date.now(),
      actions: [{
        agentId: 'system',
        type: 'none',
        detail: `ゲーム終了: ${gd.state.status}${gd.state.winner ? ` (勝者: Player ${gd.state.winner})` : ''}`,
      }],
      metrics: {
        activeAgents: 2,
        totalActions: 0,
        noneCount: 2,
        convergenceRatio: 1.0,
      },
    };
    space.rounds.push(round);
    space.convergenceHistory.push(1.0);
    return round;
  }

  // 現在のプレイヤー Agent を取得
  const currentPlayer = gd.state.currentPlayer;
  const currentAgentId = `player_${currentPlayer}`;
  const currentAgent = space.registry.get(currentAgentId);

  if (!currentAgent) {
    throw new Error(`Agent '${currentAgentId}' が見つかりません`);
  }

  const strategy = gd.strategies[currentPlayer - 1];

  // ── 知覚: 盤面を観察 ──
  const legalMoves = gd.rules.getLegalMoves(gd.state);
  const lastMove = gd.state.moveHistory.length > 0
    ? gd.state.moveHistory[gd.state.moveHistory.length - 1]
    : null;

  currentAgent.addMemory('perception',
    `Round ${roundNum}: 盤面観察 — 合法手${legalMoves.length}個` +
    (lastMove ? `, 相手の直前手: ${lastMove.label ?? lastMove.position}` : '')
  );

  space.eventBus.emit('agent:perceive', {
    agentId: currentAgentId,
    player: currentPlayer,
    legalMoves: legalMoves.length,
  }, currentAgentId);

  // ── 判断: 戦略に基づいて手を選択 ──
  const tempGame: GameSpace = {
    reiType: 'GameSpace',
    state: gd.state,
    rules: gd.rules,
    strategy,
    maxDepth: gd.maxDepth,
    searchNodes: 0,
  };

  const bestResult = selectBestMove(tempGame);
  const selectedMove = bestResult.move;
  gd.searchNodes += bestResult.searchNodes;

  currentAgent.addMemory('decision',
    `手選択: position=${selectedMove}, score=${bestResult.score}, ` +
    `strategy=${strategy}, 探索ノード=${bestResult.searchNodes}`
  );

  space.eventBus.emit('agent:decide', {
    agentId: currentAgentId,
    player: currentPlayer,
    move: selectedMove,
    score: bestResult.score,
    strategy,
  }, currentAgentId);

  // ── 行動: 手を打つ ──
  const newState = gd.rules.applyMove(gd.state, selectedMove);
  gd.state = newState;

  const moveLabel = newState.moveHistory.length > 0
    ? newState.moveHistory[newState.moveHistory.length - 1].label ?? `pos ${selectedMove}`
    : `pos ${selectedMove}`;

  currentAgent.addMemory('action',
    `着手: ${moveLabel} (turn ${newState.turnCount})`
  );

  actions.push({
    agentId: currentAgentId,
    type: 'move',
    detail: `Player ${currentPlayer}: ${moveLabel}`,
    data: {
      player: currentPlayer,
      position: selectedMove,
      score: bestResult.score,
      strategy,
      searchNodes: bestResult.searchNodes,
    },
  });

  // 相手 Agent に「待機」アクションを記録
  const otherAgentId = `player_${currentPlayer === 1 ? 2 : 1}`;
  actions.push({
    agentId: otherAgentId,
    type: 'none',
    detail: `Player ${currentPlayer === 1 ? 2 : 1}: 待機中（相手の手番）`,
  });

  space.eventBus.emit('agent:act', {
    agentId: currentAgentId,
    player: currentPlayer,
    move: selectedMove,
    label: moveLabel,
    status: newState.status,
    winner: newState.winner,
  }, currentAgentId);

  // ゲーム終了判定
  if (newState.status !== 'playing') {
    space.solved = true;
  }

  const convergenceRatio = space.solved ? 1.0 : 0.0;

  const round: AgentSpaceRound = {
    round: roundNum,
    timestamp: Date.now(),
    actions,
    metrics: {
      activeAgents: 2,
      totalActions: 1,
      noneCount: 1,  // 待機中の相手
      convergenceRatio,
    },
  };

  space.rounds.push(round);
  space.convergenceHistory.push(convergenceRatio);

  return round;
}

// ═══════════════════════════════════════════
// Part 6: 統一実行インターフェース
// ═══════════════════════════════════════════

/**
 * AgentSpace の1ラウンド実行（パズル/ゲーム共通）
 */
export function agentSpaceRunRound(space: AgentSpace): AgentSpaceRound {
  if (space.kind === 'puzzle') {
    return puzzleRunRound(space);
  } else {
    return gameRunRound(space);
  }
}

/**
 * AgentSpace を収束/決着まで実行
 */
export function agentSpaceRun(
  space: AgentSpace,
  maxRounds: number = 100,
  convergenceThreshold: number = 1.0,
): AgentSpaceResult {
  let stuckCount = 0;

  for (let i = 0; i < maxRounds; i++) {
    const round = agentSpaceRunRound(space);

    // 解決済み
    if (space.solved) break;

    // パズルの停滞検出: 変化がない場合、層3推論（バックトラック）を試行
    if (space.kind === 'puzzle' && round.metrics.totalActions === 0) {
      stuckCount++;
      if (stuckCount >= 2) {
        const progressed = puzzleBacktrackStep(space);
        if (progressed) {
          stuckCount = 0;
          continue;
        }
      }
    } else {
      stuckCount = 0;
    }

    // 収束判定（変化がなくなった）
    if (round.metrics.convergenceRatio >= convergenceThreshold) {
      // ゲームの場合は即終了、パズルの場合はバックトラック失敗後に終了
      if (space.kind === 'game' || stuckCount > 3) break;
    }
  }

  return buildResult(space);
}

/**
 * 結果オブジェクトの構築
 */
function buildResult(space: AgentSpace): AgentSpaceResult {
  const base: AgentSpaceResult = {
    reiType: 'AgentSpaceResult',
    kind: space.kind,
    totalRounds: space.rounds.length,
    converged: space.convergenceHistory.length > 0 &&
      space.convergenceHistory[space.convergenceHistory.length - 1] >= 0.95,
    solved: space.solved,
    rounds: space.rounds,
  };

  if (space.kind === 'puzzle') {
    const pd = space.puzzleData!;
    // グリッド再構成
    const grid: number[][] = [];
    for (let r = 0; r < pd.size; r++) {
      const row: number[] = [];
      for (let c = 0; c < pd.size; c++) {
        const agentId = pd.cellMap.get(`${r},${c}`);
        const agent = agentId ? space.registry.get(agentId) : undefined;
        row.push(agent?.value?.value ?? 0);
      }
      grid.push(row);
    }
    base.grid = grid;
    base.totalEliminations = pd.totalEliminations;
    base.totalConfirmations = pd.totalConfirmations;
  }

  if (space.kind === 'game') {
    const gd = space.gameData!;
    base.winner = gd.state.winner;
    base.moveHistory = gd.state.moveHistory;
    base.finalBoard = gd.state.board;
  }

  return base;
}

// ═══════════════════════════════════════════
// Part 7: σ（メタデータ）
// ═══════════════════════════════════════════

/**
 * AgentSpace のσ情報
 */
export function getAgentSpaceSigma(space: AgentSpace): AgentSpaceSigma {
  const totalActions = space.rounds.reduce(
    (sum, r) => sum + r.metrics.totalActions, 0
  );
  const roundHistory = space.rounds.map(r => r.metrics.totalActions);

  let field: Record<string, any> = {};

  if (space.kind === 'puzzle') {
    const pd = space.puzzleData!;
    const confirmed = space.agentIds.filter(id => {
      const a = space.registry.get(id);
      return a && a.value.value !== 0;
    }).length;
    field = {
      type: pd.puzzleType,
      size: pd.size,
      totalCells: pd.size * pd.size,
      confirmedCells: confirmed,
      remainingCells: pd.size * pd.size - confirmed,
      totalEliminations: pd.totalEliminations,
      totalConfirmations: pd.totalConfirmations,
      constraints: pd.constraints.length,
    };
  }

  if (space.kind === 'game') {
    const gd = space.gameData!;
    field = {
      game: gd.gameName,
      turnCount: gd.state.turnCount,
      status: gd.state.status,
      winner: gd.state.winner,
      strategies: gd.strategies,
      searchNodes: gd.searchNodes,
      moveCount: gd.state.moveHistory.length,
    };
  }

  return {
    reiType: 'AgentSpaceSigma',
    kind: space.kind,
    totalRounds: space.rounds.length,
    converged: space.solved,
    solved: space.solved,
    agentCount: space.agentIds.length,
    convergenceHistory: [...space.convergenceHistory],
    field,
    flow: {
      momentum: space.solved ? 'converged' : (space.rounds.length > 0 ? 'expanding' : 'rest'),
      roundRate: space.rounds.length > 0
        ? totalActions / space.rounds.length
        : 0,
    },
    memory: {
      totalActions,
      roundHistory,
    },
  };
}

// ═══════════════════════════════════════════
// Part 8: ユーティリティ
// ═══════════════════════════════════════════

/**
 * AgentSpace からグリッドを取得（パズル用）
 */
export function getAgentSpaceGrid(space: AgentSpace): number[][] {
  if (space.kind !== 'puzzle' || !space.puzzleData) {
    throw new Error('パズル AgentSpace のみ grid を取得できます');
  }
  const pd = space.puzzleData;
  const grid: number[][] = [];
  for (let r = 0; r < pd.size; r++) {
    const row: number[] = [];
    for (let c = 0; c < pd.size; c++) {
      const agentId = pd.cellMap.get(`${r},${c}`);
      const agent = agentId ? space.registry.get(agentId) : undefined;
      row.push(agent?.value?.value ?? 0);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * AgentSpace からゲーム状態を取得
 */
export function getAgentSpaceGameState(space: AgentSpace): GameState | null {
  if (space.kind !== 'game' || !space.gameData) return null;
  return { ...space.gameData.state };
}

/**
 * AgentSpace の盤面フォーマット（パズル用）
 */
export function formatAgentSpacePuzzle(space: AgentSpace): string {
  if (space.kind !== 'puzzle' || !space.puzzleData) return '';
  const pd = space.puzzleData;
  const grid = getAgentSpaceGrid(space);
  const lines: string[] = [];

  const boxSize = Math.round(Math.sqrt(pd.size));

  for (let r = 0; r < pd.size; r++) {
    if (r > 0 && r % boxSize === 0) {
      lines.push('─'.repeat(pd.size * 2 + boxSize - 1));
    }
    const cells: string[] = [];
    for (let c = 0; c < pd.size; c++) {
      if (c > 0 && c % boxSize === 0) cells.push('│');
      cells.push(grid[r][c] === 0 ? '·' : String(grid[r][c]));
    }
    lines.push(cells.join(' '));
  }

  return lines.join('\n');
}

/**
 * AgentSpace の盤面フォーマット（ゲーム用）
 */
export function formatAgentSpaceGame(space: AgentSpace): string {
  if (space.kind !== 'game' || !space.gameData) return '';
  return space.gameData.rules.formatBoard(space.gameData.state);
}
