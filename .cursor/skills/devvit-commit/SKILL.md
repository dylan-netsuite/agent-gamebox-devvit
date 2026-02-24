---
name: devvit-commit
description: Commits code changes for a specific game after a successful development cycle. Generates a descriptive commit message from workflow artifacts. Use after devvit-full-cycle completes or when the user asks to commit game changes.
---

# Devvit Git Commit Skill

Commits all changes made during a development workflow for a specific game. Generates a meaningful commit message by reading workflow artifacts (request, plan, test results, analysis). Runs autonomously.

## Critical: Autonomous Execution

- Do NOT ask the user what to commit -- stage all changes for the game
- Do NOT ask the user for a commit message -- generate it from workflow artifacts
- Do NOT push to remote unless explicitly asked

## Usage

```
/devvit-commit phaser/jeopardy
/devvit-commit phaser/jeopardy wf-1234567890
```

## Path Resolution

| Resource | Path |
|----------|------|
| Game root | `games/{game-path}/` |
| Game docs | `games/{game-path}/docs/` |
| Workflow state | `.workflows/{game-path}/{wf-id}/` |
| Request | `.workflows/{game-path}/{wf-id}/request.txt` |
| Plan | `.workflows/{game-path}/{wf-id}/plan.md` |
| Status | `.workflows/{game-path}/{wf-id}/status.json` |

## Workflow

### Step 1: Gather Context

1. Parse game path from first argument
2. Find the workflow ID:
   - Use provided wf-id if given
   - Otherwise, find the most recent workflow in `.workflows/{game-path}/`
3. Read workflow artifacts to understand what was accomplished:
   - `.workflows/{game-path}/{wf-id}/request.txt` -- the original feature request
   - `.workflows/{game-path}/{wf-id}/plan.md` -- what was planned
   - `.workflows/{game-path}/{wf-id}/status.json` -- final status and iteration count
   - `.workflows/{game-path}/{wf-id}/test-results.json` -- test outcomes (if exists)

### Step 2: Check for Changes

1. Run `git status` to see all modified, added, and untracked files
2. If there are no changes, report that and stop -- do NOT create an empty commit
3. Identify which changes belong to this workflow:
   - Game source: `games/{game-path}/src/**`
   - Game docs: `games/{game-path}/docs/**`
   - Game config: `games/{game-path}/devvit.json`, `games/{game-path}/package.json`
   - Workflow artifacts: `.workflows/{game-path}/{wf-id}/**`

### Step 3: Generate Commit Message

Build a commit message with this structure:

```
feat({game-name}): {concise summary of what was accomplished}

{2-4 sentence description of the changes, covering:}
- What feature/fix was implemented
- Key technical changes (new scenes, endpoints, mechanics)
- Test results if relevant

Workflow: {wf-id}
```

#### Commit Type Prefixes

| Prefix | When to use |
|--------|-------------|
| `feat` | New feature or game mechanic |
| `fix` | Bug fix or correction |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation-only changes |
| `style` | UI/visual changes without logic changes |
| `perf` | Performance improvements |

#### Message Guidelines

- **Subject line**: Max 72 characters, imperative mood ("add X" not "added X")
- **Game name**: Use the short game name from the path (e.g., `jeopardy`, `worms`)
- **Body**: Summarize what was accomplished, not every file changed
- **Workflow ID**: Always include for traceability

#### Examples

```
feat(jeopardy): add daily double mechanic with wager system

Implement daily double cells that appear randomly on the game board.
Players can wager up to their current score when landing on one.
Added wager UI scene, server-side validation, and score deduction
on incorrect answers. All 8 tests passing.

Workflow: wf-1706234567890
```

```
fix(worms): correct wind indicator direction and dynamite trajectory

Wind arrow now points in the actual wind direction instead of
opposite. Dynamite projectiles account for wind force during
flight. Fixed off-by-one in wind strength calculation.

Workflow: wf-1706234599999
```

### Step 4: Stage and Commit

1. Stage game files: `git add games/{game-path}/`
2. Stage workflow artifacts: `git add .workflows/{game-path}/{wf-id}/`
3. Stage any other related changes (e.g., doc updates, shared types)
4. **Do NOT stage** files that contain secrets (`.env`, credentials)
5. Commit using the generated message via HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
feat(game): summary here

Body here.

Workflow: wf-id
EOF
)"
```

6. Run `git status` after commit to verify success

### Step 5: Report

Summarize to the user:
- What was committed (files changed count)
- The commit hash (short)
- The commit message used
- Reminder that changes have NOT been pushed (unless they asked for a push)

## Error Handling

- **Nothing to commit**: Report cleanly, do not error
- **Merge conflicts**: Report to user, do not attempt to resolve
- **Pre-commit hook failures**: Fix lint/format issues and retry with a NEW commit (never amend)
- **Missing workflow artifacts**: Fall back to `git diff --staged` to generate the commit message
