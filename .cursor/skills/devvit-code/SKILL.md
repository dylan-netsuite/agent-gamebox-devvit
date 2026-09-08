---
name: devvit-code
description: Implement a scoped change to one Devvit game or local prototype using the current plan, then run relevant automated validation and return evidence to the owning workflow.
---

# Devvit implementation

Read [the shared contract](../devvit-full-cycle/references/workflow-contract.md) and root `AGENTS.md`.

1. Resolve the explicit target and verified artifact binding. Read the current request, plan, constraints, and current fix plan. Never select a run merely because it is newest.
2. Inspect the actual structure and renderer. Preserve existing app identity and patterns; use DOM controls for DOM interfaces and Phaser for existing Phaser games. Scaffold a new target when requested rather than assuming files exist.
3. Implement the agreed behavior. Browser routes use `/api/`, account identity comes from trusted server context, and shared deterministic logic has no server SDK imports. Persist production progress server-side. Local prototype state is a mock, not secure scoring or durable account progress.
4. Run the shared validation gate. Add meaningful tests for changed rules, persistence, authorization, concurrency, or external-error behavior when warranted. Avoid tests that only mirror wording or implementation.
5. Return changed files, commands/results, gaps, and artifact references. The owner decides deployment, retries, and delivery.
