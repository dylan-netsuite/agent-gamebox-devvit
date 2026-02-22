---
name: devvit-analyze
description: Analyzes test results for a specific game and determines next steps. Creates fix plans if needed, or marks the workflow as complete.
---

# Devvit Analysis Skill

Analyzes test results and determines whether the workflow should complete or iterate. Runs autonomously.

## Critical: Autonomous Execution

- Do NOT ask the user what to analyze -- read from the workflow directory
- Do NOT stop to ask whether to iterate -- make the decision based on test results
- If fixes are needed AND iterations < max, create a fix plan and loop back to coding
- If all tests pass, mark complete and summarize results

## Usage

```
/devvit-analyze phaser/jeopardy
/devvit-analyze phaser/jeopardy wf-1234567890
```

## Path Resolution

| Resource | Path |
|----------|------|
| Test results | `.workflows/{game-path}/{wf-id}/test-results.json` |
| Plan | `.workflows/{game-path}/{wf-id}/plan.md` |
| Screenshots | `.workflows/{game-path}/{wf-id}/screenshots/` |
| Fix plan | `.workflows/{game-path}/{wf-id}/fix-plan-{iteration}.md` |
| Analysis | `.workflows/{game-path}/{wf-id}/analysis.json` |
| Status | `.workflows/{game-path}/{wf-id}/status.json` |

## Workflow

### Step 1: Load Results

1. Read `.workflows/{game-path}/{wf-id}/test-results.json`
2. Read `.workflows/{game-path}/{wf-id}/plan.md` for original success criteria
3. Review screenshots

### Step 2: Evaluate

For each test:
- **Pass**: Criteria met, expected behavior confirmed
- **Fail**: Determine severity (critical / cosmetic)
- **Console errors**: Categorize (app error vs platform warning)

### Step 3: Decide

- **All critical tests pass** -> `status: success`, workflow complete
- **Critical failures AND iteration < 3** -> create fix plan, loop to coding
- **Critical failures AND iteration >= 3** -> `status: failed`, report to user
- **Only cosmetic issues** -> `status: success` with notes

### Step 4: Create Fix Plan (if iterating)

Save `.workflows/{game-path}/{wf-id}/fix-plan-{iteration}.md` with:
- Which tests failed and why
- Root cause analysis
- Specific code changes needed (within `games/{game-path}/`)

### Step 5: Update Status

Save analysis and update status. Then either:
- **Complete**: Summarize the full workflow, then proceed to next steps planning
- **Iterate**: Immediately proceed to coding phase with the fix plan

### Step 6: Next Steps Planning (on completion only)

When the workflow completes successfully, generate forward-looking recommendations:

1. Save `.workflows/{game-path}/{wf-id}/next-steps.md` with prioritized recommendations
2. Each recommendation should include: title, priority (High/Medium/Low), rationale, scope estimate, and dependencies
3. Consider: unresolved bugs, missing game mechanics, UI/UX polish, testing gaps, performance, and new features
4. Present the top 3-5 recommendations to the user
