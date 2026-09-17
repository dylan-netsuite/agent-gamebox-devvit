---
name: devvit-full-cycle
description: Develop or iterate one Devvit game or local mechanics prototype, with automated verification and an optional human playtest handoff. Use for a requested development cycle; reviews do not start implementation.
---

# Devvit development cycle

Read [the shared contract](references/workflow-contract.md) and root `AGENTS.md`. They define scope, workflow ownership, validation, evidence, and resuming for this skill family.

## Select the scope

The first argument identifies an existing game relative to `games/`, or an explicit prototype directory. Remaining text describes the change. Examples:

```text
/devvit-full-cycle phaser/jeopardy Add score tracking; automated playtest
/devvit-full-cycle prototypes/crossword-quest Prepare one mock turn; I will play
```

Resolve these choices from the request and current context:

- **Target:** Existing app, new app, or local prototype. A mechanics mock can be local; a local preview is not a Reddit deployment. Do not provision a full app for a mock unless needed or requested.
- **Verification:** Automated, human, or both. If the user wants to play, do technical checks in separate state and hand over an untouched turn. Human feedback is required only when it is part of the requested acceptance criteria.
- **Delivery:** The active session workflow owns commits, push, PR, and CI. Without one, finish the authorized local work and commit only when requested or covered by the requested cycle. Public publication requires explicit scope.

For a new app, inspect the current official template and installed SDK rather than assuming files exist. Preserve existing app identities and renderers. Choose a new renderer from the requirements; Phaser is not mandatory for text/grid interfaces. Record a prototype's validation and serving commands in its plan.

## Execute

1. **Plan:** Record the current request, constraints, target, baseline changes, acceptance criteria, verification mode, and artifact directory. Later user corrections override old design proposals. Separate gameplay hypotheses from decided rules. Implement only the agreed slice.
2. **Code:** Use [devvit-code](../devvit-code/SKILL.md). Run the shared validation gate, fix actionable failures, and record commands, exit results, test counts, and omissions.
3. **Prepare:** Use [devvit-deploy](../devvit-deploy/SKILL.md) for Reddit apps. For a local prototype, start its documented server bound to loopback, serve only its directory, verify the actual URL, and record the process identifier. Keep it running for the user's session.
4. **Verify:** Use [devvit-test](../devvit-test/SKILL.md) for technical checks and [devvit-test-instructions](../devvit-test-instructions/SKILL.md) for a human brief. Do not play in the user's saved state or reveal proposed answers before their turn.
5. **Human handoff, when selected:** Supply the working URL, scenario/build, short instructions, honest mock limitations, and feedback method. Preserve the running process and artifacts. If the request is to prepare a playable turn, preparation is fulfilled and delivery can proceed with human acceptance pending. If the request requires evaluating their play, wait for their actual response before dependent analysis. Elapsed time is not feedback.
6. **Analyze:** Use [devvit-analyze](../devvit-analyze/SKILL.md). Distinguish technical results, user observations, and proposed changes. Iterate within the owner's retry limits. Never turn a critical failure or untested required criterion into success.
7. **Document and deliver:** Use [devvit-docs](../devvit-docs/SKILL.md) for affected documentation. Return evidence to the active workflow for delivery and CI. In standalone execution, use [devvit-commit](../devvit-commit/SKILL.md) within the authorized scope. Report pending human feedback separately from delivered code.

Continue independent work without phase-by-phase permission requests. Pause for actual missing input, required human feedback, or an owning-workflow blocker. Resume the existing target and artifacts instead of starting another cycle for each new message.
