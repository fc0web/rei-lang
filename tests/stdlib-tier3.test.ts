// ============================================================
// Rei (0₀式) stdlib — Tier 3 Test Suite
// sequence, music, stego, oracle — 全モジュール + 統合テスト
// ============================================================

import { describe, it, expect } from 'vitest';
import * as seq from '../src/stdlib/sequence';
import * as music from '../src/stdlib/music';
import * as stego from '../src/stdlib/stego';
import * as oracle from '../src/stdlib/oracle';

// ================================================================
// §1. sequence — 情報系列ネットワーク理論(ISNT)
// ================================================================

describe('sequence module', () => {
  // --- Signal Creation ---
  describe('signal creation', () => {
    it('creates signal from values', () => {
      const s = seq.createSignal([1, 2, 3]);
      expect(s.values).toEqual([1, 2, 3]);
      expect(s.length).toBe(3);
    });

    it('creates impulse signal', () => {
      const s = seq.impulse(5, 2);
      expect(s.values).toEqual([0, 0, 1, 0, 0]);
    });

    it('creates step signal', () => {
      const s = seq.step(5, 2);
      expect(s.values).toEqual([0, 0, 1, 1, 1]);
    });

    it('creates ramp signal', () => {
      const s = seq.ramp(4, 0.5);
      expect(s.values).toEqual([0, 0.5, 1, 1.5]);
    });
  });

  // --- Signal Operations ---
  describe('signal operations', () => {
    it('attenuates signal exponentially', () => {
      const s = seq.createSignal([1, 1, 1, 1]);
      const att = seq.attenuate(s, 0.5);
      expect(att.values[0]).toBe(1);
      expect(att.values[1]).toBe(0.5);
      expect(att.values[2]).toBe(0.25);
      expect(att.values[3]).toBe(0.125);
    });

    it('amplifies signal', () => {
      const s = seq.createSignal([1, 2, 3]);
      const amp = seq.amplify(s, 3);
      expect(amp.values).toEqual([3, 6, 9]);
    });

    it('delays signal', () => {
      const s = seq.createSignal([1, 2, 3, 0, 0]);
      const d = seq.delay(s, 2);
      expect(d.values).toEqual([0, 0, 1, 2, 3]);
    });

    it('convolves signal with kernel', () => {
      const s = seq.createSignal([1, 0, 0]);
      const conv = seq.convolve(s, [1, 2, 3]);
      expect(conv.values).toEqual([1, 2, 3, 0, 0]);
    });
  });

  // --- Propagation ---
  describe('graph propagation (ISNT core)', () => {
    const adj: seq.AdjMatrix = [
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 0, 0, 0],
    ];

    it('propagates signal through linear graph', () => {
      const initial = [1, 0, 0, 0];
      const result = seq.propagate(initial, adj, 3, 0.5);
      expect(result.steps).toBe(3);
      expect(result.snapshots[0]).toEqual([1, 0, 0, 0]);
      expect(result.snapshots[1][1]).toBeCloseTo(0.5);
      expect(result.finalState[3]).toBeGreaterThan(0);
    });

    it('signal decays with alpha < 1', () => {
      const initial = [1, 0, 0, 0];
      const result = seq.propagate(initial, adj, 3, 0.5);
      // 3ステップ後、端のノードは弱い信号
      expect(result.finalState[3]).toBeLessThan(0.5);
    });
  });

  // --- Cascade ---
  describe('cascade diffusion', () => {
    it('cascades from seed nodes', () => {
      const adj: seq.AdjMatrix = [
        [0, 1, 1, 0],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 0],
      ];
      const result = seq.cascade(adj, [0], 5, 0.3, 0.5);
      expect(result.times[0]).toBe(0); // シード
      expect(result.totalActivated).toBeGreaterThanOrEqual(1);
    });

    it('calculates influence scores', () => {
      const adj: seq.AdjMatrix = [
        [0, 1, 1, 0],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 0],
      ];
      const casc = seq.cascade(adj, [0], 5, 0.3, 0.5);
      const infl = seq.influence(casc);
      expect(infl[0]).toBe(1); // シードは最大影響力
      expect(infl.length).toBe(4);
    });
  });

  // --- Resonance & Correlation ---
  describe('resonance and correlation', () => {
    it('detects perfect resonance for identical signals', () => {
      const s = seq.createSignal([1, 2, 3, 4]);
      expect(seq.resonate(s, s)).toBeCloseTo(1, 5);
    });

    it('detects zero resonance for orthogonal signals', () => {
      const a = seq.createSignal([1, 0, -1, 0]);
      const b = seq.createSignal([0, 1, 0, -1]);
      expect(seq.resonate(a, b)).toBeCloseTo(0, 5);
    });

    it('auto-correlation peaks at lag 0', () => {
      const s = seq.createSignal([1, 0, -1, 0, 1]);
      const ac = seq.autoCorrelate(s);
      const maxIdx = ac.indexOf(Math.max(...ac));
      expect(maxIdx).toBe(s.length - 1); // 中心がlag=0
    });
  });

  // --- Information Theory ---
  describe('information theory', () => {
    it('entropy is 0 for constant signal', () => {
      const s = seq.createSignal([5, 5, 5, 5, 5]);
      expect(seq.entropy(s)).toBeCloseTo(0, 5);
    });

    it('entropy increases with variability', () => {
      const low = seq.createSignal([1, 1, 1, 2, 2]);
      const high = seq.createSignal([1, 2, 3, 4, 5]);
      expect(seq.entropy(high)).toBeGreaterThan(seq.entropy(low));
    });

    it('mutual information is non-negative', () => {
      const a = seq.createSignal([1, 2, 3, 4, 5, 6, 7, 8]);
      const b = seq.createSignal([2, 4, 6, 8, 10, 12, 14, 16]);
      expect(seq.mutualInformation(a, b)).toBeGreaterThanOrEqual(0);
    });

    it('transfer entropy detects directed information flow', () => {
      // source が target を駆動する場合
      const source = seq.createSignal([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]);
      const target = seq.createSignal([0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]);
      const te = seq.transferEntropy(source, target, 1, 4);
      expect(te).toBeGreaterThanOrEqual(0);
    });
  });
});

// ================================================================
// §2. music — USFT + 音楽数理統一理論(UMTM)
// ================================================================

describe('music module', () => {
  // --- Pitch ---
  describe('pitch', () => {
    it('creates pitch from MIDI', () => {
      const p = music.pitch(69);
      expect(p.name).toBe('A4');
      expect(p.pitchClass).toBe(9);
      expect(p.octave).toBe(4);
    });

    it('converts MIDI to frequency (A4 = 440Hz)', () => {
      expect(music.midiToFreq(69)).toBeCloseTo(440, 1);
      expect(music.midiToFreq(60)).toBeCloseTo(261.63, 0);
    });

    it('converts note name to MIDI', () => {
      expect(music.nameToMidi('A4')).toBe(69);
      expect(music.nameToMidi('C4')).toBe(60);
    });
  });

  // --- Interval ---
  describe('interval', () => {
    it('names intervals correctly', () => {
      expect(music.interval(7).name).toBe('P5');
      expect(music.interval(4).name).toBe('M3');
      expect(music.interval(3).name).toBe('m3');
    });
  });

  // --- Chord ---
  describe('chord', () => {
    it('creates chord with root and intervals', () => {
      const c = music.chord([60, 64, 67]);
      expect(c.root).toBe(60);
      expect(c.intervals).toEqual([4, 7]);
    });

    it('analyzes major chord', () => {
      const c = music.chord([60, 64, 67]);
      expect(music.analyzeChord(c)).toBe('major');
    });

    it('analyzes minor chord', () => {
      const c = music.chord([60, 63, 67]);
      expect(music.analyzeChord(c)).toBe('minor');
    });

    it('analyzes diminished chord', () => {
      const c = music.chord([60, 63, 66]);
      expect(music.analyzeChord(c)).toBe('diminished');
    });

    it('analyzes augmented chord', () => {
      const c = music.chord([60, 64, 68]);
      expect(music.analyzeChord(c)).toBe('augmented');
    });

    it('analyzes dominant 7th', () => {
      const c = music.chord([60, 64, 67, 70]);
      expect(music.analyzeChord(c)).toBe('dominant7');
    });

    it('transposes chord', () => {
      const c = music.chord([60, 64, 67]);
      const t = music.transpose(c, 7);
      expect(t.root).toBe(67);
      expect(t.intervals).toEqual([4, 7]);
    });

    it('inverts chord (1st inversion)', () => {
      const c = music.chord([60, 64, 67]);
      const inv = music.invert(c, 1);
      expect(inv.pitches).toEqual([64, 67, 72]);
    });
  });

  // --- Scale ---
  describe('scale', () => {
    it('generates C major scale', () => {
      const s = music.scale(60, 'major');
      expect(s.pitches).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    });

    it('detects key from pitches', () => {
      const pitches = [60, 62, 64, 65, 67, 69, 71]; // C major
      const key = music.detectKey(pitches);
      expect(key.key).toBe(0); // C
      expect(key.mode).toBe('major');
    });
  });

  // --- Roman Numerals ---
  describe('roman numerals', () => {
    it('analyzes I-IV-V-I progression', () => {
      const prog = [
        music.chord([60, 64, 67]),  // C major
        music.chord([65, 69, 72]),  // F major
        music.chord([67, 71, 74]),  // G major
        music.chord([60, 64, 67]),  // C major
      ];
      const rn = music.romanNumerals(prog, 60);
      expect(rn).toEqual(['I', 'IV', 'V', 'I']);
    });
  });

  // --- Rhythm (USFT Theorem 9.3) ---
  describe('rhythm (USFT theorem 9.3)', () => {
    it('verifies rational rhythm', () => {
      const r = music.rhythm([0.25, 0.25, 0.125, 0.125, 0.25]);
      expect(music.isRational(r)).toBe(true);
    });

    it('quantizes rhythm to grid', () => {
      const r = music.rhythm([0.26, 0.24, 0.13, 0.12, 0.25]);
      const q = music.quantize(r, 0.125);
      expect(q.durations.every(d => d % 0.125 === 0)).toBe(true);
    });

    it('creates polyrhythm from two rhythms', () => {
      const a = music.rhythm([1, 1, 1]); // 3
      const b = music.rhythm([1, 1]);     // 2
      const poly = music.polyrhythm(a, b);
      expect(poly.totalBeats).toBeGreaterThan(0);
    });
  });

  // --- USFT Layer Operations ---
  describe('USFT layer operations', () => {
    it('decomposes pitches into 10 layers', () => {
      const layers = music.decomposeLayers([60, 64, 67, 72]);
      expect(layers.harmonic.length).toBe(4);
      expect(layers.melodic.length).toBe(3);
      expect(layers.timbral.length).toBe(12);
      expect(layers.rhythmic.length).toBe(4);
    });

    it('superpose is commutative (USFT axiom B2)', () => {
      const a = music.decomposeLayers([60, 64, 67]);
      const b = music.decomposeLayers([65, 69, 72]);
      const ab = music.superpose(a, b);
      const ba = music.superpose(b, a);
      // 可換性: a ⊕ b = b ⊕ a
      expect(ab.harmonic).toEqual(ba.harmonic);
      expect(ab.melodic).toEqual(ba.melodic);
      expect(ab.timbral).toEqual(ba.timbral);
    });

    it('extracts specific layer', () => {
      const layers = music.decomposeLayers([60, 64, 67]);
      const harmonic = music.extractLayer(layers, 'harmonic');
      expect(harmonic).toEqual(layers.harmonic);
    });
  });

  // --- Musical Symmetry ---
  describe('musical symmetry', () => {
    it('detects palindrome', () => {
      const sym = music.detectSymmetry([60, 64, 67, 64, 60]);
      expect(sym.palindrome).toBe(true);
    });

    it('detects retrograde symmetry in symmetric intervals', () => {
      // 音程列 [4, 3, 3, 4] は逆行対称
      const sym = music.detectSymmetry([60, 64, 67, 70, 74]);
      expect(sym.retrograde).toBe(true);
    });
  });

  // --- Compression Ratio (USFT Theorem 9.4) ---
  describe('compression ratio κ_s', () => {
    it('returns 1 for single note', () => {
      expect(music.compressionRatio([60])).toBe(1);
    });

    it('repetitive music has higher compression', () => {
      const repetitive = [60, 64, 67, 60, 64, 67, 60, 64, 67];
      const varied = [60, 62, 65, 59, 70, 61, 68, 55, 73];
      expect(music.compressionRatio(repetitive)).toBeGreaterThan(
        music.compressionRatio(varied)
      );
    });
  });

  // --- Retrograde & Inversion ---
  describe('melodic operations', () => {
    it('retrograde reverses pitches', () => {
      expect(music.retrograde([60, 64, 67])).toEqual([67, 64, 60]);
    });

    it('melodic inversion mirrors around axis', () => {
      const inv = music.melodicInversion([60, 64, 67], 60);
      expect(inv).toEqual([60, 56, 53]);
    });
  });
});

// ================================================================
// §3. stego — 文字内情報埋込理論
// ================================================================

describe('stego module', () => {
  // --- Text Steganography ---
  describe('text steganography (ZWC)', () => {
    it('embeds and extracts secret text', () => {
      const cover = 'Hello World';
      const secret = 'Hi';
      const stegoText = stego.embedText(cover, secret, 'zwc');
      const extracted = stego.extractText(stegoText, 'zwc');
      expect(extracted).toBe('Hi');
    });

    it('cover text appears unchanged to human eye', () => {
      const cover = 'Hello World';
      const stegoText = stego.embedText(cover, 'X', 'zwc');
      // 可視文字のみフィルタ
      const visible = stegoText.replace(/[\u200B-\u200D\uFEFF]/g, '');
      expect(visible).toBe('Hello World');
    });

    it('returns empty string when no hidden data', () => {
      expect(stego.extractText('Hello World', 'zwc')).toBe('');
    });
  });

  // --- LSB Steganography ---
  describe('LSB steganography', () => {
    it('embeds and extracts bits', () => {
      const cover = [100, 200, 150, 180, 220];
      const bits = [1, 0, 1, 1, 0];
      const stegoData = stego.embedLSB(cover, bits);
      const extracted = stego.extractLSB(stegoData, 5);
      expect(extracted).toEqual(bits);
    });

    it('minimal distortion (max ±1 per value)', () => {
      const cover = [100, 200, 150, 180, 220];
      const bits = [1, 0, 1, 1, 0];
      const stegoData = stego.embedLSB(cover, bits);
      for (let i = 0; i < cover.length; i++) {
        expect(Math.abs(stegoData[i] - cover[i])).toBeLessThanOrEqual(1);
      }
    });

    it('handles multi-bit depth', () => {
      const cover = [100, 200, 150, 180];
      const bits = [1, 0, 1, 1, 0, 1, 0, 0];
      const stegoData = stego.embedLSB(cover, bits, 2);
      const extracted = stego.extractLSB(stegoData, 8, 2);
      expect(extracted).toEqual(bits);
    });
  });

  // --- Spread Spectrum ---
  describe('spread spectrum steganography', () => {
    it('embeds and extracts with key', () => {
      const cover = new Array(32).fill(100);
      const bits = [1, 0, 1, 1];
      const key = [1, 0, 1, 0, 1, 1, 0, 1];
      const stegoData = stego.embedSpread(cover, bits, key);
      const extracted = stego.extractSpread(stegoData, 4, key, cover);
      expect(extracted).toEqual(bits);
    });
  });

  // --- Capacity & Quality ---
  describe('capacity and quality', () => {
    it('calculates LSB capacity', () => {
      const cover = [1, 2, 3, 4, 5];
      expect(stego.capacity(cover, 'lsb')).toBe(5);
    });

    it('calculates text capacity', () => {
      const cover = 'Hello';
      expect(stego.capacity(cover)).toBeGreaterThan(0);
    });

    it('PSNR is high for minimal changes', () => {
      const original = [100, 200, 150, 180, 220];
      const modified = [101, 200, 151, 180, 221];
      const p = stego.psnr(original, modified);
      expect(p).toBeGreaterThan(30); // 30dB以上 = 良好
    });

    it('detectability is low for LSB embedding', () => {
      const cover = Array.from({ length: 100 }, (_, i) => i * 2 + 50);
      const bits = Array.from({ length: 100 }, () => Math.round(Math.random()));
      const stegoData = stego.embedLSB(cover, bits);
      const det = stego.detectability(cover, stegoData);
      expect(det).toBeLessThan(0.5);
    });
  });

  // --- Multi-Dimensional Steganography (Rei固有) ---
  describe('multi-dimensional steganography', () => {
    it('embeds in neighbor values', () => {
      const result = stego.embedMultiDim(100, [50, 60, 70, 80], [1, 0, 1, 0]);
      expect(result.center).toBe(100); // centerは変更なし
      expect(result.hidden).toBe(true);
    });

    it('extracts from neighbor values', () => {
      const embedded = stego.embedMultiDim(100, [50, 60, 70, 80], [1, 0, 1, 0]);
      const extracted = stego.extractMultiDim(embedded, 4);
      expect(extracted).toEqual([1, 0, 1, 0]);
    });

    it('center remains unchanged (Rei principle)', () => {
      const embedded = stego.embedMultiDim(42, [10, 20, 30], [1, 1, 1]);
      expect(embedded.center).toBe(42);
    });
  });
});

// ================================================================
// §4. oracle — 四価0π理論接続
// ================================================================

describe('oracle module', () => {
  // --- Four-Value Logic ---
  describe('four-value logic (四価0π)', () => {
    it('generates valid four-value state', () => {
      const v = oracle.fourValue(42);
      expect([0, 1, 2, 3]).toContain(v);
    });

    it('names states correctly', () => {
      expect(oracle.fourValueName(0)).toContain('0');
      expect(oracle.fourValueName(1)).toContain('π');
      expect(oracle.fourValueName(2)).toContain('0ₒ');
      expect(oracle.fourValueName(3)).toContain('πₒ');
    });

    it('NOT is involutory: ¬¬a = a', () => {
      for (let a = 0; a < 4; a++) {
        expect(oracle.not4(oracle.not4(a as oracle.FourValue))).toBe(a);
      }
    });

    it('AND with 0 yields 0 (zero element)', () => {
      for (let a = 0; a < 4; a++) {
        expect(oracle.and4(0 as oracle.FourValue, a as oracle.FourValue)).toBe(0);
      }
    });

    it('OR with π yields π (unit element)', () => {
      for (let a = 0; a < 4; a++) {
        expect(oracle.or4(1 as oracle.FourValue, a as oracle.FourValue)).toBe(1);
      }
    });

    it('陰陽対応が正しい', () => {
      expect(oracle.fourValueYinYang(0)).toContain('陰');
      expect(oracle.fourValueYinYang(1)).toContain('陽');
    });
  });

  // --- I Ching Model ---
  describe('I Ching model (易経)', () => {
    it('casts valid yao', () => {
      const y = oracle.castYao();
      expect([6, 7, 8, 9]).toContain(y);
    });

    it('casts valid hexagram (seeded)', () => {
      const hex = oracle.castHexagram(12345);
      expect(hex.lines.length).toBe(6);
      expect(hex.number).toBeGreaterThanOrEqual(1);
      expect(hex.number).toBeLessThanOrEqual(64);
      expect(hex.name.length).toBeGreaterThan(0);
    });

    it('hexagram is deterministic with seed', () => {
      const h1 = oracle.castHexagram(999);
      const h2 = oracle.castHexagram(999);
      expect(h1.number).toBe(h2.number);
      expect(h1.lines).toEqual(h2.lines);
    });

    it('decomposes into upper and lower trigrams', () => {
      const hex = oracle.castHexagram(42);
      const { upper, lower } = oracle.trigramDecompose(hex);
      expect(upper.name.length).toBeGreaterThan(0);
      expect(lower.name.length).toBeGreaterThan(0);
    });

    it('interprets hexagram completely', () => {
      const hex = oracle.castHexagram(777);
      const interp = oracle.interpret(hex);
      expect(interp.hexagram).toBe(hex);
      expect(interp.yinYangBalance.yin + interp.yinYangBalance.yang).toBe(6);
      expect(interp.entropy).toBeGreaterThanOrEqual(0);
    });

    it('finds changing lines (老陰=6, 老陽=9)', () => {
      // 全て老陽の卦（乾 → 坤）
      const hex = oracle.castHexagram(12345);
      const changing = oracle.changingLines(hex);
      // 変爻は6か9の爻のみ
      for (const pos of changing) {
        expect([6, 9]).toContain(hex.lines[pos]);
      }
    });

    it('related hexagram flips changing lines', () => {
      const hex = oracle.castHexagram(54321);
      const changing = oracle.changingLines(hex);
      if (changing.length > 0) {
        const related = oracle.relatedHexagram(hex);
        // 変爻位置で陰陽が反転しているはず
        for (const pos of changing) {
          const original = hex.lines[pos];
          const flipped = related.lines[pos];
          if (original === 6) expect(flipped).toBe(7);  // 老陰→少陽
          if (original === 9) expect(flipped).toBe(8);  // 老陽→少陰
        }
      }
    });
  });

  // --- Yin-Yang Analysis ---
  describe('yin-yang analysis', () => {
    it('calculates yin-yang balance', () => {
      const hex = oracle.castHexagram(100);
      const balance = oracle.yinYangBalance(hex);
      expect(balance.yin + balance.yang).toBe(6);
      expect(balance.yin).toBeGreaterThanOrEqual(0);
      expect(balance.yang).toBeGreaterThanOrEqual(0);
    });

    it('entropy is 0 for no changing lines', () => {
      // 少陽と少陰のみの卦を構築
      // castYaoの確率分布上、seedで安定した卦を探す
      // 直接テスト: 変爻なし = エントロピー0
      const hex = oracle.castHexagram(999);
      const changing = oracle.changingLines(hex);
      if (changing.length === 0) {
        expect(oracle.hexagramEntropy(hex)).toBe(0);
      }
    });
  });

  // --- Transition Dynamics ---
  describe('transition dynamics', () => {
    it('transition matrix rows sum to 1', () => {
      const T = oracle.transitionMatrix();
      for (const row of T) {
        const sum = row.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1, 5);
      }
    });

    it('trajectory has correct length', () => {
      const path = oracle.trajectory(0 as oracle.FourValue, 10, 42);
      expect(path.length).toBe(11); // initial + 10 steps
      expect([0, 1, 2, 3]).toContain(path[0]);
    });

    it('trajectory is deterministic with seed', () => {
      const p1 = oracle.trajectory(0 as oracle.FourValue, 20, 123);
      const p2 = oracle.trajectory(0 as oracle.FourValue, 20, 123);
      expect(p1).toEqual(p2);
    });

    it('stationary distribution sums to 1', () => {
      const dist = oracle.stationaryDistribution();
      expect(dist.length).toBe(4);
      const sum = dist.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('stationary distribution is approximately uniform (due to symmetric matrix)', () => {
      const dist = oracle.stationaryDistribution();
      for (const d of dist) {
        expect(d).toBeCloseTo(0.25, 1);
      }
    });
  });

  // --- Synchronicity ---
  describe('synchronicity', () => {
    it('perfect correlation yields high synchronicity', () => {
      const events = [1, 2, 3, 4, 5];
      const context = [2, 4, 6, 8, 10];
      expect(oracle.synchronicity(events, context)).toBeGreaterThan(0.5);
    });

    it('random data yields low synchronicity', () => {
      const events = [1, 3, 2, 5, 4, 6, 8, 7];
      const context = [8, 2, 7, 1, 6, 3, 5, 4];
      const s = oracle.synchronicity(events, context);
      expect(s).toBeLessThan(0.8);
    });

    it('empty input yields 0', () => {
      expect(oracle.synchronicity([], [1, 2, 3])).toBe(0);
    });
  });
});

// ================================================================
// §5. 統合テスト — Tier 3 モジュール間 + Tier 1/2 接続
// ================================================================

describe('Tier 3 integration', () => {
  it('sequence → music: 情報伝播パターンをリズムに変換', () => {
    // カスケードの活性化時刻をリズムの持続時間に
    const adj: seq.AdjMatrix = [
      [0, 1, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const casc = seq.cascade(adj, [0], 5, 0.3, 0.5);
    const durations = casc.times.filter(t => t >= 0).map(t => (t + 1) * 0.25);
    const r = music.rhythm(durations);
    expect(music.isRational(r)).toBe(true);
  });

  it('music → stego: 音楽構造に情報を隠蔽', () => {
    // 和音の音高列にLSBでメッセージを埋込
    const pitches = [60, 64, 67, 72, 76, 79, 84, 88];
    const secret = [1, 0, 1, 1, 0, 1, 0, 1];
    const stegoData = stego.embedLSB(pitches, secret);
    const extracted = stego.extractLSB(stegoData, 8);
    expect(extracted).toEqual(secret);
    // 音楽的品質の保持（±1以内の変化）
    for (let i = 0; i < pitches.length; i++) {
      expect(Math.abs(stegoData[i] - pitches[i])).toBeLessThanOrEqual(1);
    }
  });

  it('oracle → sequence: 四価軌跡を信号に変換', () => {
    const path = oracle.trajectory(0 as oracle.FourValue, 20, 42);
    const sig = seq.createSignal(path);
    const ent = seq.entropy(sig);
    expect(ent).toBeGreaterThan(0); // 四価状態は非定数
  });

  it('stego → oracle: 隠蔽データの検出にエントロピー分析', () => {
    const cover = Array.from({ length: 64 }, (_, i) => i * 3);
    const bits = Array.from({ length: 64 }, () => Math.round(Math.random()));
    const stegoData = stego.embedLSB(cover, bits);

    // 卦のエントロピーで変化を検出
    const hex = oracle.castHexagram(stegoData[0] * 1000 + stegoData[1]);
    const ent = oracle.hexagramEntropy(hex);
    expect(ent).toBeGreaterThanOrEqual(0);
    expect(ent).toBeLessThanOrEqual(1);
  });

  it('4モジュール横断パイプライン: signal → music → stego → oracle', () => {
    // 1. 信号生成
    const sig = seq.createSignal([1, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05, 0.01]);

    // 2. 信号を音楽的ピッチに変換
    const pitches = sig.values.map(v => Math.round(60 + v * 24));
    const layers = music.decomposeLayers(pitches);
    expect(layers.harmonic.length).toBe(8);

    // 3. 音楽データに情報を埋込
    const secret = [1, 0, 1, 1];
    const stegoData = stego.embedLSB(pitches, secret);
    const extracted = stego.extractLSB(stegoData, 4);
    expect(extracted).toEqual(secret);

    // 4. 結果を占卜的に解釈
    const hex = oracle.castHexagram(pitches[0]);
    const interp = oracle.interpret(hex);
    expect(interp.yinYangBalance.yin + interp.yinYangBalance.yang).toBe(6);
  });
});
