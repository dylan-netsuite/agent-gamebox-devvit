---
name: devvit-deploy
description: Builds and deploys a specific game in the monorepo to the playtest environment. Constructs playtest URL from the game's config files.
---

# Devvit Deployment Skill

Builds a game and prepares deployment info for testing. Constructs the playtest URL automatically from the game's config files.

## Usage

```
/devvit-deploy phaser/jeopardy
```

## Workflow

### Step 1: Build the Game

1. Run `npm run build -w games/{game-path}`
2. Verify build succeeds (exit code 0)
3. If build fails, fix errors and retry

### Step 2: Deploy to Playtest

1. Run `cd games/{game-path} && npx devvit playtest`
2. The subreddit is read from `games/{game-path}/devvit.json` `dev.subreddit` field

### Step 3: Construct Playtest URL

Do NOT ask the user for the URL. Construct it automatically:

1. Read app name from `games/{game-path}/devvit.json` -> `name` field
2. Read subreddit from `games/{game-path}/.env` -> `DEVVIT_SUBREDDIT` value
   - Strip `r/` prefix if present for the URL path
3. Construct: `https://www.reddit.com/r/{subreddit}?playtest={app-name}`

### Step 4: Save Deployment Info

Create/update `.workflows/{game-path}/{wf-id}/deployment.json`:
```json
{
  "url": "https://www.reddit.com/r/{subreddit}?playtest={app-name}",
  "gamePath": "phaser/jeopardy",
  "status": "deployed",
  "appName": "{app-name}",
  "subreddit": "{subreddit}",
  "deployedAt": "{timestamp}"
}
```
