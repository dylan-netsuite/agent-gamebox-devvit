---
name: devvit-test
description: Verify a prepared Devvit game or local prototype with available browser automation, preserving an untouched session when the user will play. Report observed checks separately from pending human feedback.
---

# Devvit technical verification

Read [the shared contract](../devvit-full-cycle/references/workflow-contract.md) and root `AGENTS.md`.

1. Resolve the bound plan and `deployment.json`. Verify observed readiness and the target/version. Keep its process available. Do not reconstruct a URL from `.env` and call it deployed.
2. Discover available browser tools. Use an isolated context or separate test profile/state. Do not assume particular MCP names, headless mode, or persistent player profiles. Never share an active profile with another process.
3. Inspect the live accessibility tree and frames. Prefer role/label locators for DOM controls. For Phaser, locate the visible canvas and use measured bounds; avoid fixed iframe hosts and unverified coordinates. Fail the check if its frame/control is absent; never silently skip actions.
4. Test outcomes against the plan: validation, state transitions, reload recovery, responsive/keyboard behavior, and server errors as relevant. Screenshots and console inspection supplement actual assertions.
5. Record checks as `pass`, `fail`, or `untested`, with required flag, expected/observed outcome, and evidence in `test-results.json`. Include commands, counts, and errors. Authentication or tool gaps are untested.
6. For user play, leave their draft/storage/account untouched and hand off a clean URL with [devvit-test-instructions](../devvit-test-instructions/SKILL.md). Do not solve their live turn, supply answers, or infer satisfaction from technical success.

Return results to the owner. Human feedback stays pending until the user supplies it. Do not independently mark overall completion or start another phase.
