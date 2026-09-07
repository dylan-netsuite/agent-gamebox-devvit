---
name: devvit-commit
description: Commit task-owned Devvit game or prototype changes within authorized delivery scope, preserving unrelated work and reporting validation honestly.
---

# Scoped Devvit commit

Read [the shared contract](../devvit-full-cycle/references/workflow-contract.md). If a session workflow owns delivery, return the intended diff and evidence for its commit phase rather than creating a competing commit phase.

For an authorized standalone commit:

1. Resolve the current target and bound run. Read the request, validation, and analysis. Inspect `git status`, unstaged diff, and staged diff against the recorded starting state.
2. Identify task-owned changes, including authorized shared tools/docs. Do not stage the entire game directory or use `git add -A`. Use explicit paths for wholly owned files and selected hunks for mixed files. Preserve pre-existing staged content; use a scoped commit mechanism when necessary or explain a genuine inseparable conflict.
3. Keep `.workflows/`, `.env`, credentials, generated browser artifacts, and unrelated work out. Do not force-add ignored files.
4. Inspect the intended staged diff. Generate a conventional message describing the final behavior and relevant verification. Use a body file or safely quoted heredoc. Attribute agent work only to Snoocode, never the underlying model or editor.
5. Commit with normal hooks. Fix applicable hook failures without bypassing hooks. Verify the resulting commit content and remaining status, not just the existence of a hash.
6. Report actual delivery state. Honor push/PR authorization already supplied by the session without asking again. Follow the owner's push verification, draft PR, and CI procedure when applicable. Never force-push or publish a Devvit app as a side effect.

No task-owned diff means no empty commit. A commit does not establish gameplay acceptance; missing human feedback stays pending.
