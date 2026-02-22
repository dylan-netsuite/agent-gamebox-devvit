---
name: devvit-code
description: Implements code changes for a specific game in the monorepo based on a development plan. Reads plans from workflow state and implements changes following Devvit project structure and conventions.
---

# Devvit Code Implementation Skill

Implements code changes for a game according to a development plan. Runs autonomously -- do NOT ask the user what to implement or which files to change.

## Critical: Autonomous Execution

- Read the plan and implement everything it specifies
- Do NOT ask the user to confirm changes -- just make them
- Fix all type-check and lint errors before proceeding
- After validation passes, **immediately proceed** to the next phase

## Usage

```
/devvit-code phaser/jeopardy
/devvit-code phaser/jeopardy wf-1234567890
```

## Path Resolution

Given a game path like `phaser/jeopardy`, all code lives under `games/phaser/jeopardy/`:

| Resource | Path |
|----------|------|
| Client code | `games/phaser/jeopardy/src/client/` |
| Server code | `games/phaser/jeopardy/src/server/` |
| Shared types | `games/phaser/jeopardy/src/shared/` |
| Workflow state | `.workflows/phaser/jeopardy/{wf-id}/` |

## Workflow

### Step 1: Read the Plan

1. Determine game path and workflow ID:
   - Game path is the first argument
   - If workflow ID provided, use it
   - Otherwise, find the most recent workflow in `.workflows/{game-path}/`
2. Read the plan from `.workflows/{game-path}/{wf-id}/plan.md`
3. Understand the scope: files to create/modify, features, test criteria

### Step 2: Understand Devvit Structure

- **Client code** (`games/{game-path}/src/client/`): Phaser game code, HTML/CSS/JS
  - Entry points: `splash.html`, `game.html`
  - Game logic in `game/` directory
  - Uses `fetch()` to call server endpoints
- **Server code** (`games/{game-path}/src/server/`): Express endpoints
  - All endpoints MUST start with `/api/`
  - Access Redis via `import { redis } from '@devvit/web/server'`
  - Serverless runtime - no long-running processes
- **Shared types** (`games/{game-path}/src/shared/`): Types used by both client and server
- **Rules**: Follow `.cursor/rules/client.mdc` and `.cursor/rules/server.mdc`

### Step 3: Implement Changes

1. Make changes within `games/{game-path}/`
2. Follow the plan step-by-step
3. Ensure type safety - use shared types when appropriate
4. Follow existing code patterns in the game's codebase

### Step 4: Validate Changes

1. Type checking: `npm run type-check -w games/{game-path}`
2. Linting: `npm run lint -w games/{game-path}`
3. Fix any errors before proceeding

### Step 5: Update Status

Update `.workflows/{game-path}/{wf-id}/status.json` with coding phase completion info.
