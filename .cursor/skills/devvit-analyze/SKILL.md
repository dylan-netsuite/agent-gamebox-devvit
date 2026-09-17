---
name: devvit-analyze
description: Evaluate technical evidence and actual human playtest feedback for a scoped Devvit change, returning a verdict or fix plan without marking the parent workflow complete.
---

# Devvit evidence analysis

Read [the shared contract](../devvit-full-cycle/references/workflow-contract.md). Load the bound plan, test results, relevant screenshots, and human feedback only if it exists.

Write `analysis.md` with separate conclusions:

| Evidence                                       | Conclusion                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| All required technical checks observed passing | Technical verification passed                                            |
| Required technical failure                     | Fix needed; preserve the actual error and impact                         |
| Required check not performed                   | Verification incomplete; identify missing evidence                       |
| Human play requested but no feedback received  | Human feedback pending                                                   |
| User feedback received                         | Record observations separately from inferred causes and proposed changes |

A valid clue, clean console, or working UI does not establish enjoyable gameplay. Do not invent semantic AI verdicts when judging is manual or mocked. Preparation-only work can be delivered with human review pending; evaluation cannot claim acceptance before feedback.

For actionable failures, use the owner's retry count and constraints. Create `fix-plan-N.md` with actual failure evidence, scoped corrections, and verification. Return it to the owner for the next attempt. Honor the shared standalone retry limit without an active workflow.

Recommendations remain proposals. Preserve failures while documenting. The owner decides iteration and delivery; this skill does not mark overall completion, commit, or start another cycle.
