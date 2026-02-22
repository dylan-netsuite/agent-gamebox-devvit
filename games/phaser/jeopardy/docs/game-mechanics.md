# Game Mechanics

## Scene Flow

```
Boot → Preloader → MainMenu → Game (J Round → DJ Round → Final Jeopardy) → GameOver
                      ▲  │                                                     │
                      │  ├→ StatsScene ─┘                                      │
                      │  └→ LeaderboardScene ─┘                                │
                      └────────────────────────────────────────────────────────┘
                                        (Play Again)
```

## Main Menu

- Displays Jeopardy-themed title "JEOPARDY!" in gold with black stroke
- Blue background (`#060CE9`)
- **Game type selection:** Two game buttons + one stats button:
  - **"Latest Game"** — Finds and loads yesterday's Jeopardy episode from J-Archive
  - **"On this Day"** — Loads a random game from this date in a previous year (2000–2025)
- **"My Stats"** — Opens the stats visualization scene
- **"Leaderboard"** — Opens the community leaderboard (top 20 by best game score)
- **Loading state:** Buttons show loading indicator while fetching game data from the server
- **Fallback handling:** If scraping fails, the game falls back to static questions
- All elements scale responsively based on viewport

## Game Rounds

The game follows the real Jeopardy structure with three rounds:

### Jeopardy Round (Round 1)
- 6 categories, 5 questions per category
- Values: $200, $400, $600, $800, $1000
- **1 Daily Double** randomly placed
- After all 30 cells are cleared → transitions to Double Jeopardy

### Double Jeopardy Round (Round 2)
- 6 new categories, 5 questions per category
- Values: $400, $800, $1200, $1600, $2000
- **2 Daily Doubles** randomly placed
- "DOUBLE JEOPARDY!" splash animation between rounds
- After all 30 cells are cleared → transitions to Final Jeopardy

### Final Jeopardy (Round 3)
- Single question with 30-second timer
- Player-chosen wager (see Wager Input below)
- After scoring → Game Over

## Game Board

### Layout

The board is a 6-column by 6-row grid (1 category header row + 5 question rows):

**Jeopardy Round:**

| Cat 1 | Cat 2 | Cat 3 | Cat 4 | Cat 5 | Cat 6 |
|-------|-------|-------|-------|-------|-------|
| $200 | $200 | $200 | $200 | $200 | $200 |
| $400 | $400 | $400 | $400 | $400 | $400 |
| $600 | $600 | $600 | $600 | $600 | $600 |
| $800 | $800 | $800 | $800 | $800 | $800 |
| $1000 | $1000 | $1000 | $1000 | $1000 | $1000 |

**Double Jeopardy Round:**

| Cat 1 | Cat 2 | Cat 3 | Cat 4 | Cat 5 | Cat 6 |
|-------|-------|-------|-------|-------|-------|
| $400 | $400 | $400 | $400 | $400 | $400 |
| $800 | $800 | $800 | $800 | $800 | $800 |
| $1200 | $1200 | $1200 | $1200 | $1200 | $1200 |
| $1600 | $1600 | $1600 | $1600 | $1600 | $1600 |
| $2000 | $2000 | $2000 | $2000 | $2000 | $2000 |

**Total cells per round:** 30 (6 categories x 5 values)

### Interactions

- **Hover:** Cell background lightens, slight scale-up
- **Click:** Opens question overlay for that cell
- **Used cells:** Dark blue background, no text, non-interactive

## Daily Double

### Placement
- **Jeopardy Round:** 1 Daily Double, randomly placed on a cell with a question
- **Double Jeopardy Round:** 2 Daily Doubles, randomly placed on different cells with questions
- Cells look identical to other cells until clicked

### When Triggered
1. **Sound:** `dailyDouble` arpeggio plays (C-E-G-C ascending)
2. **Splash:** Full-screen "DAILY DOUBLE!" text appears for 1.8 seconds
3. **Wager Input:** Player-interactive wager screen appears (see Wager Input below)
4. **Question:** Normal overlay appears with gold border, header shows "DAILY DOUBLE — Wager: $X"
5. **Scoring:** Player types answer and submits; correct adds wager; wrong deducts wager

### Wager Rules (Daily Double)
- **Minimum:** $5
- **Maximum:** `max(currentScore, highestBoardValue)` — in J round max(score, 1000); in DJ round max(score, 2000)
- **Negative score:** If score is negative, max wager is the highest board value (1000 or 2000)
- **Default value:** Input defaults to the maximum wager

## Wager Input

A dedicated wager screen appears for Daily Doubles and Final Jeopardy:

### Layout (top to bottom)
1. **Dark overlay** — 85% opacity black background
2. **Panel** — 70% width, 65% height, Jeopardy blue with gold border
3. **Title** — "DAILY DOUBLE" or "FINAL JEOPARDY" in gold
4. **Category** — "Category: [name]" in white
5. **Score display** — "Your Score: $X" in italic
6. **Range text** — "Wager between $X and $Y" in muted color
7. **Number input** — Large styled number field (gold text on blue), defaults to max wager
8. **Validation text** — Shows error if wager is outside range (red)
9. **WAGER button** — Gold pill button to submit

### Interactions
- Player types a wager amount in the number input
- Submit via Enter key or WAGER button
- Invalid wagers (outside min/max) show validation error
- After valid submission, the clue overlay appears

## Question Overlay

When a cell is clicked, a modal overlay appears:

### Overlay Layout (top to bottom)
1. **Semi-transparent background** — black at 75% opacity
2. **Panel** — 82% width, 78% height, Jeopardy blue with border (gold for DD/FJ, blue for regular)
3. **Header** — Category name and dollar value, or "DAILY DOUBLE — Wager: $X"
4. **Divider line** — Accent-colored line
5. **Timer text** — Countdown display (white, turns red at 5s)
6. **Timer bar** — Colored progress bar that shrinks over time
7. **Question text** — White Georgia serif text, word-wrapped
8. **Answer input** — Styled text field (pill-shaped, blue background)
9. **Submit button** — Submit via Enter key or button click
10. **Result text** — "CORRECT! +$X" (green) or "WRONG! -$X" / "TIME'S UP! -$X" (red)
11. **Community stats text** — "X% of N players got this right" (italic, light blue-gray, fades in after result)

## Timer

### Regular Questions
- **Duration:** 15 seconds

### Final Jeopardy
- **Duration:** 30 seconds

### Display
- **Text format:** `0:SS` (e.g., "0:15", "0:05")
- **Color:** White by default, red when <= 5 seconds
- **Auto-submit:** When timer reaches 0, `submitAnswer()` is called

### Timer Bar

| Time Remaining | Bar Color |
|---------------|-----------|
| > 50% | Green (`#22CC22`) |
| 25%-50% | Yellow (`#CCCC22`) |
| < 25% | Red (`#CC2222`) |

## Sound Effects

All sounds are generated programmatically via the Web Audio API.

| Sound | Trigger | Description |
|-------|---------|-------------|
| `tickNormal` | Timer tick (>5s) | 440Hz sine, 50ms |
| `tickUrgent` | Timer tick (<=5s) | 880Hz sine, 80ms |
| `correct` | Correct answer | Rising C→E |
| `wrong` | Wrong answer or time's up | 200Hz sawtooth buzz |
| `dailyDouble` | Daily Double cell clicked | C-E-G-C arpeggio |
| `timeUp` | Timer reaches 0 | Descending 440→220Hz |
| `fanfare` | Round transitions | C-E-G-C(high) |
| `finalJeopardy` | Final Jeopardy clue shown | Sustained 523Hz |

## Scoring

### Flow
1. Player clicks a cell → overlay opens with question + timer + answer input
2. Player types answer and submits via Enter or Submit button (or timer expires)
3. Answer checked using fuzzy matching (`answerMatcher.ts`)
4. Result displayed: "CORRECT! +$X" (green) or "WRONG! -$X" / "TIME'S UP! -$X" (red)
5. Correct answer revealed; overlay auto-closes after 2.2 seconds

### Score Rules
- **Correct answer:** Score increases by question value (or wager for DD/FJ)
- **Wrong answer:** Score decreases by question value (or wager)
- **Score can go negative** — matches real Jeopardy rules

## Final Jeopardy

### Sequence
1. **Fanfare sound** plays
2. Board clears with staggered animation
3. "FINAL JEOPARDY!" title appears (gold, large)
4. Category name shown
5. **Wager input** — If score > 0, player chooses wager ($0 to current score); if score <= 0, wager is forced to $0
6. After wager, question overlay appears with 30-second timer
7. After scoring, transitions to GameOver scene

### Final Jeopardy Data
- **Dynamic games:** From scraped `GameData.finalJeopardy`
- **Fallback:** Static data in `data/finalJeopardy.ts`

## Double Jeopardy Transition

### Sequence
1. **Fanfare sound** plays
2. Current J board animates out (stagger scale/fade)
3. "DOUBLE JEOPARDY!" splash appears for 2.2 seconds (scale-in with Back.easeOut, pulse)
4. Splash fades out
5. New DJ board created with DJ categories, $400-$2000 values
6. Board animates in with stagger entrance

## Game Over

- "GAME OVER" title in gold
- Animated score count-up to final value
- "PLAY AGAIN" button returns to MainMenu

## Question Data

### Dynamic Loading (Primary)
- MainMenu selects game type → `fetch(/api/game?type=...)` → receives `GameData`
- Game scene loads both J round and DJ round data
- Scraper extracts J clues, DJ clues, and Final Jeopardy from J-Archive

### Static Fallback
- J Round: 6 categories (Science, History, Geography, Pop Culture, Sports, Technology), $200-$1000
- DJ Round: 6 categories (World Capitals, Literature, Music, Food & Drink, Movies, Nature), $400-$2000
- Final Jeopardy: "World Leaders" category

### Missing Clues
- Cells with no clue data are treated as used/non-interactive

## Stats Tracking

### Data Collected Per Game
Each answer during gameplay generates an `AnswerResult`:
- `value` — Board dollar value of the clue (0 for Final Jeopardy)
- `correct` — Whether the answer was correct
- `isDailyDouble` — Whether it was a Daily Double
- `isFinalJeopardy` — Whether it was the Final Jeopardy clue

### Submission
When Final Jeopardy scoring completes, the Game scene POSTs all results to `/api/stats/submit` (fire-and-forget). The server updates the user's cumulative stats in Redis.

### Stats Tracked
| Stat | Description |
|------|-------------|
| `totalAnswered` | Total regular clues answered (excludes FJ) |
| `totalCorrect` | Correct regular clues |
| `gamesPlayed` | Number of completed games |
| `bestGame` | Highest score with date and description |
| `longestStreak` | Longest consecutive correct answers (across all games) |
| `currentStreak` | Ongoing streak (resets on wrong answer) |
| `correctByValue` | Per-value correct/total breakdown |
| `finalJeopardy` | Final Jeopardy correct/total |

## My Stats Scene

### Layout
- **Title bar:** "MY STATS" in gold with "< BACK" button and games played count
- **Row 1:** Overall correct % (arc ring) + Best Game card
- **Row 2:** Longest Streak + Final Jeopardy %
- **Row 3:** Correct % by Value (horizontal bar chart)
- **Empty state:** "No stats yet! Play a game to see your stats here."

### Visualizations
- **Overall %:** Circular arc ring with percentage in center, color-coded (green ≥70%, yellow ≥40%, red <40%)
- **Best Game:** Score in green/red, game description, gold star
- **Streak:** Large gold number with glow
- **Final Jeopardy:** Percentage with correct/total count
- **By Value:** Horizontal bars for each dollar value, sorted ascending, with color-coded fills
