# Shared Devvit skill contract

All eight Devvit skills use this contract. Read root `AGENTS.md` for runtime, commands, platform boundaries, and browser ownership.

## Ownership and resuming

- Detect the current repository, worktree, branch, and initial dirty/staged files. Scope the target to an existing game or an explicitly selected prototype. A new game needs a scaffold step; do not assume a package or Devvit app exists.
- An active session workflow is the sole owner of phase state, retry counts, delivery, and completion. In Snoocode, use its `wf_*` tools; never read or edit `dev-state.json` directly. Apply returned todo payloads through the native planning tool when available. If unavailable, record the limitation without inventing another state store.
- Keep local evidence in the artifact directory supplied by the owner. Without one, an explicit `.workflows/{target}/{run-id}/` directory can hold evidence. It does not create a second phase tracker. Standalone execution can use conversation progress and these artifacts without another status machine.
- Record target, absolute worktree root, branch, starting commit, scope, and artifact paths in `run.md`. On resume verify this binding against the checkout. Use an explicit run ID or verified current binding; never choose the newest directory or inherited transcript ID alone.
- Companion skills perform their named operation and return evidence. They do not launch unrelated phases or mark the overall workflow complete. The owner decides the next step.
- Current user constraints override old plans and examples. Preserve user-owned theme, art, and product decisions. Unresolved proposals remain proposals.

## Validation

For an existing Devvit game, from the repository root:

```sh
node tools/validate-all.mjs phaser/{game}
```

Use `--install` when a clean install is needed, such as changed manifests or missing dependencies. The runner executes typecheck, non-mutating lint, unit/integration tests, and build. Record the actual test count: `--passWithNoTests` does not establish coverage. Change-specific browser checks supplement this gate.

For a local prototype or documentation-only change, use relevant commands recorded in the plan; do not run every unrelated game. A JavaScript prototype may use `node --check`, `node --test`, and browser assertions without a new package/build system. Record inapplicable lint/typecheck/build steps. Exercise new scripts; skill frontmatter validation alone does not validate behavior.

Use pure tests for deterministic rules and `@devvit/test/server/vitest` for backend behavior requiring Devvit fixtures. Mock provider responses for technical tests; do not call mocked AI decisions measured judgment quality. Assert observable UI/state outcomes; screenshots or a quiet console alone do not prove correctness.

## Evidence

Artifacts are evidence, not authoritative session phase state:

| Artifact               | Contents                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `run.md` / `plan.md`   | Verified binding, current request, scope, hypotheses, acceptance criteria, commands, baseline changes                                        |
| `deployment.json`      | `targetKind` (`reddit` or `local`), observed URL, app/scenario version, `status` (`ready` or `failed`), readiness evidence, time, process ID |
| `test-results.json`    | Named checks with `pass`, `fail`, or `untested`, evidence, required flag, commands, counts, omissions                                        |
| `test-instructions.md` | Human brief with URL, starting state, limitations, feedback method                                                                           |
| `human-feedback.md`    | User observations and submitted inputs when useful; separate inference/proposals; omit until feedback exists                                 |
| `analysis.md`          | Technical verdict, human feedback status (`pending`, `received`, `not_requested`), issues and next action                                    |
| `fix-plan-N.md`        | Actual failure evidence, scoped corrections, verification for this attempt                                                                   |

Record artifact references in an existing notes field of the owner when needed; do not invent new top-level fields. Keep `.workflows/` ignored, never force-add it, and omit secrets and credentials.

## Human playtests

Prepare a playable state without solution spoilers. Use separate browser storage/account/scenario for automation. Record a seed/version or fixed fixture for reproduction. Preserve the user's draft and keep the server available. Test-only reset/advance-day controls belong in a local prototype or access-controlled test build, never a production scoring path.

Give a short goal and visible rules. Ask for observations after play without coaching toward a preferred outcome. A player's clue is input, not proof of enjoyment. When a semantic judge is mocked or manual, say so before submission and keep judgment pending. Failed or pending validation must not consume a one-use resource.

Human feedback is a dependency when the task calls for it. Preparing a test can be delivered while play feedback remains pending; this does not establish human acceptance. Do not interrupt independent work for unnecessary confirmations.

## Failure and delivery

The owner governs retries. For standalone work, stop after three unsuccessful fix attempts and report evidence and the blocker. Preserve counts in the owner's state or the numbered fix artifacts when standalone. Tool/auth gaps are untested checks. Do not overwrite failures with success while documenting or committing.

Keep commands in `AGENTS.md` and procedures in their leaf skill rather than duplicating divergent phase implementations. Stage task-owned changes after inspecting the diff, preserve unrelated work, and do not bypass hooks or force-push. Respect delivery already authorized by the session. Never independently trigger public publication.
