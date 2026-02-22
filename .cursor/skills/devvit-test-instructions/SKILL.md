---
name: devvit-test-instructions
description: Generates comprehensive testing instructions for a specific game based on the development plan and implementation.
---

# Devvit Test Instructions Generator

Generates comprehensive testing instructions for a game's features based on the development plan.

## Usage

```
/devvit-test-instructions phaser/jeopardy
/devvit-test-instructions phaser/jeopardy wf-1234567890
```

## Path Resolution

| Resource | Path |
|----------|------|
| Plan | `.workflows/{game-path}/{wf-id}/plan.md` |
| Status | `.workflows/{game-path}/{wf-id}/status.json` |
| Deployment | `.workflows/{game-path}/{wf-id}/deployment.json` |
| Output | `.workflows/{game-path}/{wf-id}/test-instructions.md` |

## Workflow

### Step 1: Load Context

1. Parse game path from first argument
2. Find most recent workflow in `.workflows/{game-path}/` (or use provided wf-id)
3. Read plan, status, and deployment info

### Step 2: Analyze Plan and Implementation

1. Extract feature requirements from plan
2. Identify key functionality to test
3. Review test criteria from plan (if provided)

### Step 3: Generate Test Scenarios

Create comprehensive test scenarios covering:

1. **Visual/UI Tests**: Element visibility, styling, responsive layout
2. **Interaction Tests**: Button clicks, navigation, user interactions
3. **Functional Tests**: Core functionality, state management, error handling
4. **Integration Tests**: API calls, client-server communication

### Step 4: Create Test Instructions Document

Generate `.workflows/{game-path}/{wf-id}/test-instructions.md` with:

```markdown
# Testing Instructions for {Feature Name}

## Overview
Brief description of what to test

## Prerequisites
- Playtest URL for this game
- Game should be at expected initial state

## Test Scenarios
### Scenario 1: {Test Name}
**Objective**: {What this test verifies}
**Steps**: ...
**Expected Result**: ...

## Visual Verification Checklist
## Interaction Checklist
## Notes
```

### Step 5: Create Automated Test Scenarios

If Playwright MCP is available, also generate Playwright test steps.
