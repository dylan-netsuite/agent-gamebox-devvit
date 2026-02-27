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

The skill maintains the **README** and the files in `games/{game-path}/docs/`:

| File | Purpose |
|------|---------|
| `README.md` | **User-facing app description** — included in Devvit uploads and shown on the app listing page. Must be kept accurate and polished. |
| `docs/architecture.md` | System architecture, tech stack, data flow |
| `docs/game-mechanics.md` | Game rules, scenes, scoring, timers, interactions |
| `docs/api-reference.md` | Server endpoints, Redis keys, request/response shapes |
| `docs/scenes.md` | Phaser scene inventory with lifecycle and layout details |
| `docs/changelog.md` | Running log of features added, bugs fixed, iterations |

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

### Step 2: Update README

Update `games/{game-path}/README.md` — this is the **most important file** because it ships with every Devvit upload and is displayed on the app listing page.

#### README Guidelines
- **Audience:** End users (Reddit community members and moderators), NOT developers
- **Tone:** Friendly, concise, informative — sell the game and explain how to play
- **Structure:** Title → one-line pitch → "How It Works" → game modes/features → "How to Play" steps
- **Accuracy is critical:** Every feature, game mode, and mechanic mentioned must reflect the current state of the code. If a feature was added or removed, the README must be updated.
- **Do NOT include:** Developer setup instructions, build commands, architecture details, or API docs (those belong in `docs/`)
- **Do NOT include:** Screenshots or images (these are not supported in Devvit app listings)

### Step 3: Update Each Doc

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

### Step 4: Validate

1. Ensure the README accurately reflects the current game features and mechanics — no stale or missing info
2. Ensure all markdown renders correctly
3. Cross-check scene list against actual files
4. Ensure changelog entry was added if invoked from a workflow

## Writing Guidelines

- Use clear, concise language
- Include code snippets for key interfaces (TypeScript fenced blocks)
- Use tables for structured data
- Keep each doc focused -- don't duplicate across files
- Always reflect the **current** state of the code
- Preserve manually-added notes or sections
