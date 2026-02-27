# Copilot Instructions — Rei (0₀式) Repository

## Context
This is the Rei programming language repository, based on D-FUMT theory.
Rei's core innovation is the center-neighbor pattern as a language primitive,
achieving 74% code reduction over conventional approaches.

## Code Style
- Use TypeScript strict mode
- All functions must be pure where possible
- Phase transitions (Open → Sealed → Compacted) are irreversible — never bypass
- Use `readonly` for all interface properties
- Prefix genesis-related code with the axiom name (G-E₁, G-S₀, G-S₁, G-N₁)

## Key Types
- `GenesisPhase`: 'void' | 'dot' | 'zero_zero' | 'zero' | 'number'
- `PipelineStage`: 'open' | 'sealed' | 'compacted'
- `CurvatureValue<T>`: `{ value: T, curvature: number, origin: string }`
- `PhaseGuard`: `{ phase: Phase, category: PhaseCategory, strict: boolean }`

## Testing
- Use Vitest (`npx vitest run`)
- Current test suites: ISL (110 tests) + Phase Guard & κ (73 tests) = 183 total
- All tests must pass before any commit
- Adversarial tests are required for any security-related code

## AI Silence Protocol
When reasoning about complex Rei code, reduce noise by:
1. Identify the primary phase (void/dot/zero_zero/zero/number or open/sealed/compacted)
2. Strip irrelevant context
3. Follow the phase transition chain — never skip steps
4. Verify monotonicity before suggesting changes
