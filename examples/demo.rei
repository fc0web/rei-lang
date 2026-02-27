// ============================================================
// Rei (0₀式) — Example Program
// D-FUMT Multi-Dimensional Computation
// Author: Nobuki Fujimoto
// ============================================================

// --- 基本演算 ---
let x = 2 + 3 * 4

// --- 多次元数 (MDim) ---
let field = 𝕄{5; 1, 2, 3, 4}
let weighted = field |> compute :weighted
let multiplicative = field |> compute :multiplicative

// --- 拡張数 ---
let zero3 = 0ooo
let extended = zero3 >> :x >> :x

// --- 関数定義 (compress) ---
compress karma(intention, effort, result) = intention * effort * result
let k = karma(0.8, 0.9, 0.7)

compress energy(m) = m |> compute :weighted
let e_val = energy(𝕄{0; 10, 20, 30})

// --- 生成公理系 ---
let g = genesis()
g |> forward
g |> forward
g |> forward

// --- パイプチェーン ---
let result = -25 |> abs |> sqrt

// --- 配列 ---
let data = [3, 1, 4, 1, 5, 9]
let sorted = data |> sort
let total = data |> sum

// --- 四価論理 ---
let q1 = ⊤ ∧ ⊤
let q2 = ¬⊥

// 最終結果
result
