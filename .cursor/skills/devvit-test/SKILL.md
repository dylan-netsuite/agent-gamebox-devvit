---
name: devvit-test
description: Tests a deployed game using Playwright MCP in headless mode. Navigates to playtest URLs, interacts with the app, captures screenshots, and generates test results.
---

# Devvit Testing Skill

Tests deployed games using Playwright MCP. Runs fully autonomously -- do NOT ask the user for input.

## Critical: Autonomous Execution

- Do NOT ask the user for a playtest URL -- read it from `deployment.json` or construct it from the game's `.env` + `devvit.json`
- Do NOT stop to ask what to test -- read the plan and generate test scenarios
- Playwright is configured headless -- no browser window will open

## Usage

```
/devvit-test phaser/jeopardy
/devvit-test phaser/jeopardy wf-1234567890
```

## Path Resolution

| Resource | Path |
|----------|------|
| Deployment info | `.workflows/{game-path}/{wf-id}/deployment.json` |
| Game config | `games/{game-path}/devvit.json` |
| Environment | `games/{game-path}/.env` |
| Test results | `.workflows/{game-path}/{wf-id}/test-results.json` |
| Screenshots | `.workflows/{game-path}/{wf-id}/screenshots/` |

## Workflow

### Step 1: Get Playtest URL

Read from `.workflows/{game-path}/{wf-id}/deployment.json` -> `url` field. Never ask the user.

### Step 2: Navigate and Load App

1. `browser_navigate` to the playtest URL
2. Wait for page to load
3. Take screenshot: `screenshots/01-initial-load.png`
4. Find and click the app post or start button
5. Take screenshot: `screenshots/02-app-launched.png`

### Step 3: Interact with Devvit App in Iframe

The Devvit app renders inside nested iframes. To interact:

1. Use `browser_snapshot` to see the accessibility tree
2. Look for iframe content containing the game elements
3. For Phaser canvas games, use `browser_run_code` with coordinate-based clicks:

```javascript
async (page) => {
  const frames = page.frames();
  const gameFrame = frames.find(f => f.url().includes('webview.devvit.net'));
  if (gameFrame) {
    const canvas = await gameFrame.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    }
  }
}
```

4. Use `browser_console_messages` to verify actions registered

### Step 4: Execute Test Scenarios

Generate tests from the plan. For each test:
1. Describe what we're testing
2. Take before screenshot
3. Perform actions
4. Take after screenshot
5. Check console for errors
6. Record pass/fail

### Step 5: Generate Results

Save to `.workflows/{game-path}/{wf-id}/test-results.json`:
```json
{
  "testRunId": "test-{timestamp}",
  "gamePath": "phaser/jeopardy",
  "playtestUrl": "{url}",
  "status": "complete",
  "tests": [...],
  "summary": { "totalTests": 8, "passedTests": 7, "failedTests": 1 },
  "consoleErrors": []
}
```

### Step 6: Proceed to Analysis

After saving results, **immediately continue** to the next phase.
