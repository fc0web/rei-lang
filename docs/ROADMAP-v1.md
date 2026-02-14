# Rei v1.0 Roadmap

**Status:** Active
**Updated:** 2026-02-14

---

## Current: v0.5.x — Stabilization (Phase 4d)

Focus: External proof and documentation, not new features.

- [x] 6属性システム完全実装 (field, flow, memory, layer, relation, will)
- [x] relation深化 (trace, influence, entangle)
- [x] will深化 (will_evolve, will_align, will_conflict)
- [x] 877 tests passing
- [x] README刷新
- [x] Runnable benchmark suite
- [x] Getting Started tutorial
- [ ] npm publish v0.5.3
- [ ] note.com記事公開

## v0.6.0 — API Freeze Candidate

Focus: Identify and finalize the public API surface.

- [ ] API stability classification (Stable / Provisional / Experimental)
- [ ] Breaking change audit — list all potential changes before v1.0
- [ ] TypeScript type definitions cleanup
- [ ] Export surface review (remove internal-only exports)
- [ ] Error message standardization (bilingual)

## v0.7.0 — Documentation Complete

Focus: Every public API has documentation and examples.

- [ ] API reference (auto-generated or manual)
- [ ] Advanced tutorial (agent runtime, puzzles, games)
- [ ] Architecture guide update
- [ ] BNF spec update to v0.5 features

## v0.8.0 — Community Readiness

Focus: Make it easy for others to contribute and use.

- [ ] Contributing guide
- [ ] Issue templates
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Code coverage reporting
- [ ] Example projects (2-3 real-world use cases)

## v1.0.0 — Stable Release

Criteria for v1.0:
1. All Stable APIs unchanged for 2+ minor versions
2. Documentation complete for all public features
3. 1000+ tests passing
4. At least 3 external users have tried and provided feedback
5. README conveys Rei's value in under 30 seconds of reading

---

## Non-Goals for v1.0

These are important but intentionally deferred:

- Visual IDE / editor plugin
- Package manager for Rei libraries
- Self-hosting (Rei compiler written in Rei)
- Production deployment tooling
- Performance optimization beyond correctness

---

## Principles

1. **Correctness over features** — no new feature ships without full test coverage
2. **Stability over velocity** — breaking changes must be justified and documented
3. **Honesty over marketing** — README and docs describe what actually works, not what's planned
4. **One user at a time** — focus on making Rei genuinely useful for the next person who tries it
