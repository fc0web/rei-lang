// ============================================================
// Rei v0.4 — Quad Logic & Genesis
// Four-valued logic and state genesis system
// Extracted from evaluator.ts for modular architecture
// ============================================================

export function quadNot(v: string): string {
  switch (v) {
    case "top": return "bottom";
    case "bottom": return "top";
    case "topPi": return "bottomPi";
    case "bottomPi": return "topPi";
    default: return v;
  }
}

export function quadAnd(a: string, b: string): string {
  if (a === "bottom" || b === "bottom") return "bottom";
  if (a === "top" && b === "top") return "top";
  return "bottomPi";
}

export function quadOr(a: string, b: string): string {
  if (a === "top" || b === "top") return "top";
  if (a === "bottom" && b === "bottom") return "bottom";
  return "topPi";
}

// --- Genesis ---

const PHASE_ORDER = ["void", "dot", "line", "surface", "solid", "omega"];

export function createGenesis() {
  return { reiType: "State" as const, state: "void", omega: 0, history: ["void"] };
}

export function genesisForward(g: any) {
  const idx = PHASE_ORDER.indexOf(g.state);
  if (idx < PHASE_ORDER.length - 1) {
    g.state = PHASE_ORDER[idx + 1];
    g.history.push(g.state);
    if (g.state === "omega") g.omega = 1;
  }
}

// ============================================================
// EVALUATOR
// ============================================================
