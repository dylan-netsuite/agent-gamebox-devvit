---
name: devvit-test-instructions
description: Prepare a concise human playtest brief with the verified URL, starting state, limitations, and feedback method, without solution spoilers.
---

# Human playtest brief

Read [the shared contract](../devvit-full-cycle/references/workflow-contract.md). Resolve the explicit target and verified artifact directory; read its plan, readiness evidence, and technical results.

Write `test-instructions.md` with:

- Verified URL and scenario/build identity.
- Short player goal and visible rules, without example solutions or future reveals.
- Starting state and reset controls. Keep the user's state separate from automation.
- Honest limitations: local versus Reddit runtime, manual versus real AI judging, and omitted mechanics. Explain what affects player expectations.
- Feedback method: submitted inputs or a copyable turn record, confusing moments, perceived fairness, and whether they wanted to continue. Separate neutral feedback prompts from a technical checklist.

For a mechanics experiment, put the hypothesis in evaluator notes instead of a leading player question. Reproducible fixtures and test-only reset/advance-day controls can help; do not introduce production bypasses or expand one turn into a full chapter.

Return the brief and URL to the owner. Preparing instructions is not evidence of a playtest. Wait for real observations before writing `human-feedback.md`.
