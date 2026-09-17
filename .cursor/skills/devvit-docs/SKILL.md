---
name: devvit-docs
description: Maintain affected game or prototype documentation using actual code, current decisions, and verification evidence. Authors project docs; it is not the official Devvit documentation lookup skill.
---

# Devvit project documentation

Read [the shared contract](../devvit-full-cycle/references/workflow-contract.md). Resolve the target and current request; inspect code and actual artifacts. Do not promote old proposals or invented theme content into requirements.

Update documents affected by the change:

| Document                 | Scope                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Game `README.md`         | Accurate player-facing description/how to play; Devvit uploads use it for the listing |
| `docs/architecture.md`   | Actual structure, runtime, build, data flow                                           |
| `docs/game-mechanics.md` | Decided rules, transitions, scoring, limitations                                      |
| `docs/api-reference.md`  | Implemented routes and persistent contracts                                           |
| `docs/scenes.md`         | Phaser scenes, only for games using Phaser                                            |
| `docs/changelog.md`      | Relevant changes and verification, preserving prior entries                           |

A local prototype may need only a short README with serving/test commands, mock limitations, and feedback instructions. Do not create a whole documentation suite without a need. Describe components/screens for DOM interfaces instead of inventing Phaser scenes.

Keep unfinished features, proposed tuning, manual/mock judgments, and pending human tests explicit. Preserve manually authored notes and the user's visual direction. Record real verification; do not describe untested behavior as complete.

Check links and consistency with implemented behavior, then return changed files to the owner. Documentation cannot turn failed/pending acceptance into success or independently trigger a commit.
