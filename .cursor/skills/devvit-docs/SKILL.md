---
name: devvit-docs
description: Generates and maintains project documentation for a specific game in the monorepo. Updates architecture, feature, and changelog docs after code changes.
---

# Devvit Documentation Skill

Maintains living documentation in each game's `docs/` directory. Updates docs to reflect the current state of the game's codebase after any code changes.

## Critical: Autonomous Execution

- Do NOT ask the user what to document -- read the codebase and workflow artifacts
- Do NOT skip any documentation file -- update every file that needs it
- After generating/updating docs, **immediately proceed** to the next phase if part of a workflow

## Usage

```
/devvit-docs phaser/jeopardy
/devvit-docs phaser/jeopardy wf-1234567890
```

## Path Resolution

Given a game path like `phaser/jeopardy`:

| Resource | Path |
|----------|------|
| Game source | `games/phaser/jeopardy/src/` |
| Game docs | `games/phaser/jeopardy/docs/` |
| Game config | `games/phaser/jeopardy/devvit.json` |
| Workflow state | `.workflows/phaser/jeopardy/{wf-id}/` |

## Documentation Structure

The skill maintains these files in `games/{game-path}/docs/`:

| File | Purpose |
|------|---------|
| `architecture.md` | System architecture, tech stack, data flow |
| `game-mechanics.md` | Game rules, scenes, scoring, timers, interactions |
| `api-reference.md` | Server endpoints, Redis keys, request/response shapes |
| `scenes.md` | Phaser scene inventory with lifecycle and layout details |
| `changelog.md` | Running log of features added, bugs fixed, iterations |

## Workflow

### Step 1: Gather Context

1. **If invoked with a workflow ID:**
   - Read `.workflows/{game-path}/{wf-id}/request.txt`
   - Read `.workflows/{game-path}/{wf-id}/plan.md`
   - Read `.workflows/{game-path}/{wf-id}/test-results.json`
   - Read `.workflows/{game-path}/{wf-id}/analysis.json`
2. **Always read the game's source code:**
   - Scan `games/{game-path}/src/client/game/scenes/*.ts`
   - Scan `games/{game-path}/src/client/game/data/*.ts`
   - Scan `games/{game-path}/src/server/index.ts`
   - Scan `games/{game-path}/src/shared/types/*.ts`
   - Read `games/{game-path}/devvit.json`

### Step 2: Update Each Doc

Update all doc files in `games/{game-path}/docs/`. See the writing guidelines below.

#### `docs/architecture.md`
- Tech stack, project layout, build pipeline, deployment, data flow

#### `docs/game-mechanics.md`
- Scene flow, board layout, question system, timer, scoring, cell state

#### `docs/api-reference.md`
- Every `/api/*` endpoint with method, path, request body, response shape
- Redis key patterns

#### `docs/scenes.md`
- Every Phaser scene class with file path, properties, methods, transitions

#### `docs/changelog.md`
- Append-only log (newest first)
- Format: `## [YYYY-MM-DD] Feature/Fix Title` with workflow ID, summary, files modified

### Step 3: Validate

1. Ensure all markdown renders correctly
2. Cross-check scene list against actual files
3. Ensure changelog entry was added if invoked from a workflow

## Writing Guidelines

- Use clear, concise language
- Include code snippets for key interfaces (TypeScript fenced blocks)
- Use tables for structured data
- Keep each doc focused -- don't duplicate across files
- Always reflect the **current** state of the code
- Preserve manually-added notes or sections
