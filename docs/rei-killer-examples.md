# Reiでなければこう書けない — 4つの決定的な例

## はじめに：正直な前提

「絶対にこう書けない」には3段階ある：

1. **同じ結果は出せるが、構造が根本的に異なる** — Reiでは自然に書けるが、他言語では別のパラダイムを強制される
2. **書けるが、記述量と認知コストが桁違い** — Rei 10行 vs Python 80行ではなく、考え方自体が違う
3. **言語機能として不可能** — σ（自己参照）や不可逆性のような機能が他言語にプリミティブとして存在しない

以下の4例では、主に段階1と3を示す。段階2（単なる行数削減）は既にベンチマークで証明済み。


---

## 例1: 群知能シミュレーション（Boids）

### 問題
鳥の群れの動き。各個体が「分離・整列・結合」の3ルールに従い、局所情報だけで群全体のパターンが創発する。

### Python（従来型）

```python
import numpy as np

class Boid:
    def __init__(self, x, y, vx, vy):
        self.pos = np.array([x, y])
        self.vel = np.array([vx, vy])
    
    def get_neighbors(self, boids, radius):
        neighbors = []
        for b in boids:
            if b is not self:
                dist = np.linalg.norm(self.pos - b.pos)
                if dist < radius:
                    neighbors.append(b)
        return neighbors
    
    def separation(self, neighbors):
        if not neighbors:
            return np.zeros(2)
        steer = np.zeros(2)
        for n in neighbors:
            diff = self.pos - n.pos
            dist = np.linalg.norm(diff)
            if dist > 0:
                steer += diff / (dist ** 2)
        return steer
    
    def alignment(self, neighbors):
        if not neighbors:
            return np.zeros(2)
        avg_vel = np.mean([n.vel for n in neighbors], axis=0)
        return avg_vel - self.vel
    
    def cohesion(self, neighbors):
        if not neighbors:
            return np.zeros(2)
        center = np.mean([n.pos for n in neighbors], axis=0)
        return center - self.pos

    def update(self, boids, dt=0.1):
        neighbors = self.get_neighbors(boids, radius=50)
        sep = self.separation(neighbors) * 1.5
        ali = self.alignment(neighbors) * 1.0
        coh = self.cohesion(neighbors) * 1.0
        self.vel += (sep + ali + coh) * dt
        speed = np.linalg.norm(self.vel)
        if speed > 5:
            self.vel = self.vel / speed * 5
        self.pos += self.vel * dt

# シミュレーションループ
boids = [Boid(np.random.rand()*100, np.random.rand()*100,
              np.random.randn(), np.random.randn()) for _ in range(100)]
for step in range(1000):
    for b in boids:
        b.update(boids)
```

**問題点：**
- 「近傍の取得」を手動で書く（O(n²)ループ）
- 各個体が全個体リストを受け取り、自分で近傍を探す
- 空間構造（誰が誰の近くにいるか）が言語レベルで表現されない
- 個体の「自分がどの群れにいるか」の自己認識がない

### Rei（v0.3 空間拡散エンジン）

```rei
# 各Boidを中心-周囲パターンで定義
# 「近傍」は言語プリミティブ — 探索コードは不要

空 swarm {
  層 0: 𝕄{boid_i; neighbors...}    # 各個体の場

  # 3ルールを場の演算として宣言
  分離 = σ.field.neighbors |> map(n => (σ.pos - n.pos) / dist²) |> Σ
  整列 = σ.field.neighbors |> map(n => n.vel) |> mean - σ.vel
  結合 = σ.field.neighbors |> map(n => n.pos) |> mean - σ.pos

  # 更新則：場の再計算として自然に表現
  vel' = σ.vel + (分離 * 1.5 + 整列 + 結合) * dt
  pos' = σ.pos + vel' * dt
} |> diffuse("converged")
```

**Reiでしか書けない点：**

1. **近傍が言語プリミティブ** — `𝕄{center; neighbors}` が中心-周囲パターン。近傍探索コードをゼロ行で実現。Pythonでは毎回O(n²)ループを書くか、scipy.spatial.KDTreeを自分で構築する。

2. **σ（自己参照）** — 各Boidが `σ.field.neighbors` で「自分の近傍」に直接アクセスできる。σは「自分が今どの場にいて、どの層にいるか」を知っている。Pythonの `self` は単なるオブジェクト参照であり、空間的な自己認識ではない。

3. **拡散が組み込み** — `diffuse("converged")` で群全体の更新が一文。Pythonでは外側のforループで全個体をイテレーションする必要がある。


---

## 例2: ニューラルネットの伝播

### 問題
3層ニューラルネットの順伝播と逆伝播。各ノードが入力を受け取り、重み付き和→活性化関数→出力。

### Python (numpy)

```python
import numpy as np

class NeuralNet:
    def __init__(self, layers):
        self.weights = []
        self.biases = []
        for i in range(len(layers)-1):
            self.weights.append(np.random.randn(layers[i], layers[i+1]) * 0.1)
            self.biases.append(np.zeros(layers[i+1]))
    
    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))
    
    def sigmoid_deriv(self, x):
        s = self.sigmoid(x)
        return s * (1 - s)
    
    def forward(self, x):
        self.activations = [x]
        self.z_values = []
        for w, b in zip(self.weights, self.biases):
            z = self.activations[-1] @ w + b
            self.z_values.append(z)
            self.activations.append(self.sigmoid(z))
        return self.activations[-1]
    
    def backward(self, y, lr=0.01):
        m = y.shape[0]
        delta = (self.activations[-1] - y) * self.sigmoid_deriv(self.z_values[-1])
        for i in range(len(self.weights)-1, -1, -1):
            dw = self.activations[i].T @ delta / m
            db = delta.mean(axis=0)
            if i > 0:
                delta = (delta @ self.weights[i].T) * self.sigmoid_deriv(self.z_values[i-1])
            self.weights[i] -= lr * dw
            self.biases[i] -= lr * db
```

**問題点：**
- 活性化値を `self.activations` リストに手動保存（逆伝播のため）
- 「どの値がどの計算から来たか」はプログラマの責任で追跡
- 順伝播と逆伝播が別メソッド、構造的に断絶
- ノード単位の自己認識がない（行列演算で一括処理）

### Rei

```rei
# ニューラルネットを「場の層」として記述
空 net {
  層 0: 𝕄{input; w_01, w_02, ...}      # 入力層
  層 1: 𝕄{hidden; w_10, w_11, ...}     # 隠れ層
  層 2: 𝕄{output; w_20, w_21, ...}     # 出力層

  # 順伝播 = 場の拡散（各層が自然に次層へ伝播）
  活性化 = σ.field |> compute :weighted |> sigmoid

  # σ.memory が来歴を自動保持 — 手動保存不要
  # 「この活性化値はどの入力から来たか」をσが知っている

  # 逆伝播 = 拡散の逆方向（Reiの不可逆性と対照的に面白い）
  勾配 = σ.memory |> reverse_trace |> chain_rule
} |> diffuse_layers(0 → 2)    # 順伝播
  |> backprop(2 → 0, lr=0.01) # 逆伝播
```

**Reiでしか書けない点：**

1. **σ.memory（来歴の自動追跡）** — これが最大の差。Pythonでは `self.activations` と `self.z_values` を手動で保存しないと逆伝播できない。Reiでは値が「自分がどこから来たか」を自動的に知っている。PyTorchの自動微分 (autograd) に似ているが、Reiではこれが**数の属性**であり、ライブラリ機能ではない。

2. **層構造が言語プリミティブ** — `空{ 層 0: ... 層 1: ... }` でネットワーク構造そのものが構文。PyTorchでも `nn.Sequential` でチェインできるが、それは「リストに層を追加する」手続きであり、「空間に層が存在する」宣言ではない。

3. **拡散方向の明示** — `diffuse_layers(0 → 2)` と `backprop(2 → 0)` で方向が対称的に記述される。Pythonでは順伝播と逆伝播が構造的に断絶している。


---

## 例3: 反応拡散方程式（チューリングパターン）

### 問題
2種類の化学物質（活性因子U、抑制因子V）が反応しながら拡散し、自発的に縞模様や斑点を生成する。生物の模様形成の数理モデル。

### Python

```python
import numpy as np

N = 100
U = np.ones((N, N)) + 0.01 * np.random.randn(N, N)
V = np.zeros((N, N)) + 0.01 * np.random.randn(N, N)

Du, Dv = 0.16, 0.08   # 拡散係数
f, k = 0.035, 0.065    # 反応パラメータ
dt = 1.0

def laplacian(grid):
    """離散ラプラシアン — 上下左右4方向の差分"""
    return (
        np.roll(grid, 1, axis=0) + np.roll(grid, -1, axis=0) +
        np.roll(grid, 1, axis=1) + np.roll(grid, -1, axis=1) -
        4 * grid
    )

for step in range(10000):
    Lu = laplacian(U)
    Lv = laplacian(V)
    uvv = U * V * V
    U += (Du * Lu - uvv + f * (1 - U)) * dt
    V += (Dv * Lv + uvv - (f + k) * V) * dt
```

**問題点：**
- `laplacian()` を手動実装（np.roll で4方向の差分を書く）
- 「各セルが周囲4方向から影響を受ける」という空間構造がコードに暗黙的
- Uの更新式とVの更新式が独立した行 — 「2つの物質が同じ場で相互作用している」ことが構造的に見えない
- セルは自分が何者か（U/V、どの位置にいるか）を知らない

### Rei

```rei
# 反応拡散系 = 2つの場が同じ空間で相互作用
空 turing {
  層 0: 𝕄{U_ij; U_上, U_下, U_左, U_右}  # 活性因子の場
  層 1: 𝕄{V_ij; V_上, V_下, V_左, V_右}  # 抑制因子の場

  # ラプラシアンは「場の計算」そのもの — 実装不要
  ΔU = σ.field |> compute :laplacian    # 中心-周囲パターン → ラプラシアン
  ΔV = σ.field |> compute :laplacian

  # 反応項：層間の相互作用
  uvv = 層0.center * 層1.center * 層1.center
  
  U' = U + (Du * ΔU - uvv + f * (1 - U)) * dt
  V' = V + (Dv * ΔV + uvv - (f + k) * V) * dt
} |> diffuse(steps: 10000)
```

**Reiでしか書けない点：**

1. **ラプラシアンが `compute :laplacian` 一文** — これが最も決定的。ラプラシアン（周囲との差分の和）は中心-周囲パターンの最も基本的な操作。Pythonでは `np.roll` を4回呼ぶが、Reiでは「場の計算」として言語が知っている。これは記法の問題ではなく、**言語が空間構造を理解しているかどうか**の違い。

2. **2つの場の共存** — `層 0` と `層 1` が同じ `空` 内に存在し、`層0.center * 層1.center` で層間の相互作用を書ける。Pythonでは U と V は独立したnumpy配列であり、「同じ空間に共存している」ことはプログラマの頭の中にしかない。

3. **拡散の宣言** — `diffuse(steps: 10000)` で「この場を10000ステップ拡散させる」と宣言。Pythonでは `for step in range(10000):` ループを手動で書く。


---

## 例4: 噂の拡散モデル（SIR型 + 自己認識）

### 問題
社会ネットワーク上で噂が広がるモデル。SIR型（Susceptible → Infected → Recovered）。各ノードが「自分が噂を知っているか」を認識し、信頼度や伝播確率に基づいて周囲に広める。

### Python (NetworkX)

```python
import networkx as nx
import random

G = nx.barabasi_albert_graph(1000, 3)

# 状態管理を手動で行う
state = {n: 'S' for n in G.nodes()}
history = {n: [] for n in G.nodes()}  # 手動で履歴追跡
trust = {n: random.uniform(0.3, 1.0) for n in G.nodes()}

# 初期感染者
for seed in random.sample(list(G.nodes()), 5):
    state[seed] = 'I'
    history[seed].append(('I', 0, None))

for t in range(100):
    new_state = dict(state)
    for node in G.nodes():
        if state[node] == 'S':
            infected_neighbors = [
                n for n in G.neighbors(node) if state[n] == 'I'
            ]
            for inf_n in infected_neighbors:
                prob = trust[node] * trust[inf_n] * 0.1
                if random.random() < prob:
                    new_state[node] = 'I'
                    history[node].append(('I', t, inf_n))  # 手動記録
                    break
        elif state[node] == 'I':
            if random.random() < 0.05:
                new_state[node] = 'R'
                history[node].append(('R', t, None))  # 手動記録
    state = new_state
```

**問題点：**
- `history` を手動で管理（誰から感染したか、いつか）
- `state` と `history` と `trust` が別々の辞書 — 一つのノードの属性がバラバラ
- 近傍探索を毎ステップ手動（`G.neighbors(node)`）
- 各ノードは自分の状態を「知らない」（外部の辞書を参照するだけ）
- 「噂の伝播経路」を追跡するには追加コードが必要

### Rei

```rei
空 rumor_network {
  # 各ノードを場として定義（信頼度つき）
  層 0: 𝕄{person_i; connected_persons...} :trust=0.7

  # 状態遷移を宣言的に記述
  拡散ルール {
    S → I : when σ.field.neighbors |> any(n => n.state == 'I')
               and random() < σ.trust * neighbor.trust * 0.1
    I → R : when random() < 0.05
  }

  # σ.memory が自動的に追跡
  # 「誰から感染したか」「いつ状態が変わったか」は
  # witnessとして不可逆に記録される
  
  伝播経路 = σ.memory |> filter(type: 'state_change')
               |> trace_origin   # 感染源まで遡る
} |> diffuse("no_infected")
```

**Reiでしか書けない点：**

1. **witness（不可逆記録）が自動** — これが他のどの言語にもない。「誰から噂を聞いたか」がReiのISL（不可逆構文層）によって自動的に暗号学的に記録される。Pythonでは `history[node].append(...)` を**プログラマが忘れずに書く**必要がある。Reiでは忘れることが構造的に不可能。

2. **σ.memory + trace_origin** — 各ノードが「自分の感染経路」を自己参照で辿れる。Pythonでは `history` 辞書を外部から検索する必要がある。Reiのσは「自分の来歴を知っている値」であり、これは言語プリミティブとしてPythonに存在しない。

3. **状態遷移の宣言的記述** — `S → I : when ...` で遷移条件を宣言。Pythonでは `if state[node] == 'S':` と `for inf_n in infected_neighbors:` のネストが必要。


---

## まとめ：Reiの不可代替性の核心

| 機能 | Reiでの位置づけ | Python等での代替 | 差の本質 |
|------|----------------|-----------------|---------|
| **中心-周囲パターン** | 言語プリミティブ | 自分で実装（KDTree等） | 空間認識が言語にあるか |
| **σ（自己参照）** | 値の属性 | 存在しない | 値が自己認識するか |
| **σ.memory（来歴）** | 自動追跡 | 手動で `history.append()` | 忘却が不可能か |
| **witness（不可逆記録）** | ISLが保証 | 存在しない | 改竄が構造的に不可能か |
| **空間拡散** | `diffuse()` 一文 | forループ手動 | 計算モデルが宣言的か |
| **層構造** | `空{ 層 N: }` | 別々の配列/辞書 | 共存が構文的か |
| **場の計算** | `compute :laplacian` | `np.roll` × 4 | 演算が空間を知っているか |

**最も重要な一文：**

> Pythonでは「空間」も「来歴」も「自己認識」もプログラマが手動で構築する。
> Reiではそれらが言語の存在論的前提として組み込まれている。
> この差は記法の差ではなく、計算モデルの差である。


## 補足：正直な限界

- 上記のReiコードはv0.3の設計に基づく**疑似コード**であり、現在のインタプリタで全て動くわけではない。特にσ.memoryの自動追跡やwitness統合は今後の実装課題。
- 「他の言語では絶対に書けない」は厳密には正しくない。チューリング完全な言語なら結果は再現できる。正確には「他の言語ではこの自然さで書けない」。
- PyTorchのautograd、Juliaの多重ディスパッチ、Haskellの型クラスなど、各言語にも独自の強みがある。Reiの優位性は「空間構造 + 自己参照 + 不可逆性」の三位一体にある。
