# Security Hardening — START HERE

> **Date:** 2026-03-07
> **Status:** Ready
> **Goal:** Strengthen Tandem's security model so the local API, Gatekeeper,
> runtime monitoring, outbound controls, and extension trust boundaries provide
> better protection for both Robin and OpenClaw
> **Order:** Phase 1 → 2 → 3 → 4 → 5 → 6

---

## Why This Track Exists

Tandem already has meaningful browser security controls, but several important
boundaries still rely on permissive assumptions:

- loopback access is trusted too broadly
- uncertain cases default to allow
- some deeper monitoring follows the attached tab instead of the full browser
- outbound protection is partly heuristic
- extensions are powerful but not yet fully scoped as privileged actors

This track fixes those gaps in an order that preserves context and limits the
risk of breaking the browser.

---

## Architecture In 30 Seconds

```text
Caller -> Auth boundary -> Guardian policy -> Gatekeeper decision path
      -> Per-tab monitoring -> Outbound controls -> Containment action
```

Each phase improves one layer without forcing a full-stack rewrite.

---

## Project Structure — Relevant Files

> Read only the files listed by the active phase document.

### Read For All Phases

| File | Why |
|------|-----|
| `AGENTS.md` | workflow rules, anti-detection constraints, commit/report expectations |
| `PROJECT.md` | product/security positioning |
| `src/main.ts` | app lifecycle, tab wiring, manager lifecycle |
| `src/api/server.ts` | API auth model and route registration |
| `src/security/security-manager.ts` | security subsystem orchestration |
| `src/security/guardian.ts` | primary request policy and enforcement |

### Additional Files Per Phase

See the active `fase-*.md` document.

---

## Hard Rules For This Track

1. **No page-visible security UI**: all warnings, blocks, and recovery UX must
   live in the shell
2. **No implicit widening of trust**: every new exception must be documented and
   justified
3. **Fail closed only where the product can explain it**: if a request is held
   or blocked, Robin needs a clear path to understand what happened
4. **Function names over line numbers**: always reference concrete
   functions/classes
5. **Each phase must leave the browser working**: no "temporary broken state"
   phases

---

## Document Set

| File | Purpose | Status |
|------|---------|--------|
| `LEES-MIJ-EERST.md` | execution guide for the full track | Ready |
| `fase-1-api-auth.md` | API trust boundary and caller model | Ready |
| `fase-2-gatekeeper-enforcement.md` | fail-closed decision flow | Waiting for phase 1 |
| `fase-3-per-tab-monitoring.md` | broader runtime monitoring coverage | Waiting for phase 2 |
| `fase-4-outbound-containment.md` | stronger outbound and WebSocket control | Waiting for phase 3 |
| `fase-5-extension-trust.md` | extension trust model and route scopes | Waiting for phase 4 |
| `fase-6-containment-actions.md` | automatic security response actions | Waiting for phase 5 |

---

## Quick Status Check

```bash
curl http://localhost:8765/status
npx tsc
git status
npx vitest run
```

---

## Progress Tracking Rules

After each phase:

- update `CHANGELOG.md`
- update this document if the sequence or assumptions change
- note any newly discovered risks before starting the next phase
- explicitly record what still remains true, what changed, and what is now
  protected

This file exists so future sessions can restart from the documented state
instead of depending on chat context.
