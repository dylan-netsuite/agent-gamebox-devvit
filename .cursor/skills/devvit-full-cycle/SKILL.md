---
name: devvit-full-cycle
description: Orchestrates the complete Devvit app development lifecycle for a specific game in the monorepo. First argument is always the game path (e.g., phaser/jeopardy). Runs planning, coding, deployment, testing, analysis, and documentation autonomously.
---

# Devvit Full Cycle Orchestration

Orchestrates the complete development workflow for a game in the monorepo. **Runs autonomously** -- do NOT stop between phases or ask the user for confirmation. Execute all phases in sequence until the workflow is complete or fails.

## Critical: Game Path

The first argument is always the **game path** relative to `games/`. All operations are scoped to that game directory.

## Critical: Autonomous Execution

- Execute ALL phases in a single turn without pausing for user input
- Do NOT ask the user to confirm between phases
- Do NOT ask the user for a playtest URL -- read it from `devvit playtest` output or the game's `.env`
- Do NOT stop to summarize progress mid-workflow -- just keep going
- Only stop if a phase fails with an unrecoverable error

## Usage

```
/devvit-full-cycle phaser/jeopardy Add score tracking to the game
/devvit-full-cycle phaser/trivia Create initial quiz game
```

The first argument (`phaser/jeopardy`) is the game path. Everything after it is the feature request.

## Path Resolution

Given a game path like `phaser/jeopardy`:

| Resource | Path |
|----------|------|
| Game root | `games/phaser/jeopardy/` |
| Client code | `games/phaser/jeopardy/src/client/` |
| Server code | `games/phaser/jeopardy/src/server/` |
| Shared types | `games/phaser/jeopardy/src/shared/` |
| Game config | `games/phaser/jeopardy/devvit.json` |
| Environment | `games/phaser/jeopardy/.env` |
| Game docs | `games/phaser/jeopardy/docs/` |
| Workflow state | `.workflows/phaser/jeopardy/{wf-id}/` |

## Workflow Execution

### Phase 1: Initialize + Plan

1. Parse arguments: extract game path and feature request
2. Generate workflow ID: `wf-{timestamp}`
3. Create `.workflows/{game-path}/{id}/` directory
4. Save request to `.workflows/{game-path}/{id}/request.txt`
5. Analyze the game's codebase to understand current state:
   - Client code in `games/{game-path}/src/client/`
   - Server code in `games/{game-path}/src/server/`
   - Shared types in `games/{game-path}/src/shared/`
   - Existing `.cursor/rules/` conventions
6. Save plan to `.workflows/{game-path}/{id}/plan.md`
7. **Immediately proceed to Phase 2** -- do not pause

### Phase 2: Code

1. Read plan from `.workflows/{game-path}/{id}/plan.md`
2. Implement all code changes within `games/{game-path}/`
3. Run validation from the game directory:
   - `npm run type-check -w games/{game-path}` -- fix any errors
   - `npm run lint -w games/{game-path}` -- fix any errors
4. **Immediately proceed to Phase 3** -- do not pause

### Phase 3: Build + Deploy

1. Build: `npm run build -w games/{game-path}` -- verify success
2. Deploy: `cd games/{game-path} && npx devvit playtest` (reads subreddit from devvit.json)
3. Construct playtest URL:
   - Read `DEVVIT_SUBREDDIT` from `games/{game-path}/.env`
   - Read app name from `games/{game-path}/devvit.json` `name` field
   - URL: `https://www.reddit.com/r/{subreddit}?playtest={app-name}`
4. Save deployment info to `.workflows/{game-path}/{id}/deployment.json`
5. **Immediately proceed to Phase 4** -- do not pause

### Phase 4: Test

1. Read playtest URL from `.workflows/{game-path}/{id}/deployment.json`
2. Generate test scenarios based on the plan's testing criteria
3. Use Playwright MCP to execute tests:
   - `browser_navigate` to the playtest URL
   - Wait for page load
   - Take screenshots at key steps
   - Interact with the app (click buttons, navigate scenes)
   - Check `browser_console_messages` for errors
   - Record pass/fail for each scenario
4. Save results to `.workflows/{game-path}/{id}/test-results.json`
5. Save screenshots to `.workflows/{game-path}/{id}/screenshots/`
6. **Immediately proceed to Phase 5** -- do not pause

### Phase 5: Analyze

1. Read test results from `.workflows/{game-path}/{id}/test-results.json`
2. Review screenshots
3. Evaluate against plan criteria
4. **Decision**:
   - If ALL critical tests pass -> mark `status: success`, workflow complete
   - If tests fail AND iteration < 3 -> create fix plan, loop back to Phase 2
   - If tests fail AND iteration >= 3 -> mark `status: failed`, report issues

### Phase 6: Documentation

After analysis succeeds (or after final iteration):

1. Read the workflow artifacts (request, plan, test results, analysis)
2. Update all documentation in `games/{game-path}/docs/`:
   - `docs/architecture.md` -- system architecture and tech stack
   - `docs/game-mechanics.md` -- game rules, scenes, scoring, timers
   - `docs/api-reference.md` -- server endpoints and Redis keys
   - `docs/scenes.md` -- Phaser scene inventory with details
   - `docs/changelog.md` -- append entry for this workflow's changes
3. Follow the conventions in `/devvit-docs` skill for writing guidelines
4. **Immediately proceed to Phase 7** -- do not pause

### Phase 7: Next Steps

After documentation is updated:

1. Review everything accomplished in this workflow (request, plan, test results)
2. Analyze the current state of the game holistically:
   - What features are implemented and working?
   - What features are partially implemented or have known gaps?
   - What's the most impactful thing to build next?
3. Generate a prioritized list of next steps, saved to `.workflows/{game-path}/{id}/next-steps.md`
4. Each next step should include:
   - **Title**: Short description
   - **Priority**: High / Medium / Low
   - **Rationale**: Why this matters now
   - **Scope estimate**: Small (1 cycle), Medium (2-3 cycles), Large (4+ cycles)
   - **Dependencies**: What must be done first, if anything
5. Categories to consider:
   - **Bugs**: Issues discovered during testing that weren't fixed
   - **Game mechanics**: Missing rules, incomplete logic, edge cases
   - **UI/UX**: Visual polish, responsiveness, accessibility
   - **Testing**: Unit tests, integration tests, coverage gaps
   - **Performance**: Optimization opportunities
   - **Features**: New capabilities that would enhance the game
6. Present the top 3-5 recommendations to the user with a brief explanation of each
7. **Immediately proceed to Phase 8** -- do not pause

### Phase 8: Git Commit

After next steps are generated, commit all changes from this workflow:

1. Read workflow artifacts to understand what was accomplished:
   - `request.txt`, `plan.md`, `status.json`, `test-results.json`
2. Run `git status` to verify there are changes to commit
3. Generate a descriptive commit message:
   - Type prefix: `feat`, `fix`, `refactor`, etc.
   - Scope: the game name (e.g., `jeopardy`, `worms`)
   - Subject: concise summary of what was accomplished (max 72 chars)
   - Body: 2-4 sentences covering the feature, key technical changes, and test results
   - Footer: `Workflow: {wf-id}`
4. Stage relevant files:
   - `git add games/{game-path}/`
   - `git add .workflows/{game-path}/{wf-id}/`
   - Do NOT stage `.env` files or credentials
5. Commit using a HEREDOC for proper formatting
6. Run `git status` to verify the commit succeeded
7. **Then mark the workflow as complete**

See the `/devvit-commit` skill for full commit message guidelines and examples.

### Iteration Loop

If analysis determines fixes are needed:
1. Create `.workflows/{game-path}/{id}/fix-plan.md` with specific fixes
2. Increment iteration counter
3. Go back to Phase 2 using the fix plan
4. Continue through Phase 3-5 again

## Playwright MCP Notes

The Playwright MCP is configured with `--headless` and `--isolated` flags:
- **Headless**: No visible browser window, no Chrome conflict
- **Isolated**: Clean session each time, no stale state

When testing inside Devvit's iframe-based app:
- The game runs inside nested iframes on Reddit
- Use `browser_run_code` to find and interact with the game canvas
- Phaser renders to a `<canvas>` element -- use coordinate-based clicks
- Use `browser_console_messages` to verify click handlers and errors
- The game iframe URL contains `webview.devvit.net`

## Playtest URL Construction

The playtest URL follows this pattern:
```
https://www.reddit.com/r/{DEVVIT_SUBREDDIT}?playtest={app-name}
```

- `DEVVIT_SUBREDDIT`: From `games/{game-path}/.env` (without `r/` prefix in the URL path)
- `app-name`: From `games/{game-path}/devvit.json` `name` field

## Error Handling

- Build failures: Fix code errors, retry build
- Deployment issues: Check devvit auth, check game's `.env`
- Test navigation failures: Verify URL, check if playtest server is running
- Playwright errors: The headless config avoids Chrome conflicts
- If playtest server is not running: Report to user that `npm run dev` must be running

## Status File

`.workflows/{game-path}/{id}/status.json`:
```json
{
  "workflowId": "wf-123",
  "gamePath": "phaser/jeopardy",
  "phase": "complete",
  "status": "success",
  "iteration": 1,
  "maxIterations": 3
}
```
