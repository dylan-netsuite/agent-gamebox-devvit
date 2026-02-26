# Meerca Chase - Phaser Scenes

## Scene Flow

```
Boot → Preloader → MainMenu → Game → GameOver → (MainMenu | Leaderboard)
                      ↑                              |
                      └──────────────────────────────┘
```

## Boot
- **Key**: `Boot`
- **Purpose**: Generate all procedural textures
- **Textures created**: meerca-head, tail-segment, negg-base, grid-bg, particle
- **Transitions to**: Preloader

## Preloader
- **Key**: `Preloader`
- **Purpose**: Animated loading screen
- **Visual**: Title text with glow, animated progress bar
- **Duration**: ~500ms
- **Transitions to**: MainMenu

## MainMenu
- **Key**: `MainMenu`
- **Purpose**: Difficulty selection and navigation
- **Elements**:
  - Title with golden glow effect
  - "A Neopets Classic" subtitle
  - CLASSIC button (green border)
  - HARD button (red border)
  - LEADERBOARD button (yellow border)
  - Instructions text at bottom
- **Responsive**: Rebuilds UI on resize
- **Transitions to**: Game (with difficulty), Leaderboard

## Game
- **Key**: `Game`
- **Purpose**: Core gameplay
- **Elements**:
  - Grid background with border and lines
  - Meerca head sprite (rotates with direction)
  - Tail segments (fade and shrink toward end)
  - Negg sprites with glow and pulse animation
  - Score text at top
  - Points popup on collection
  - Particle burst on collection
- **Input**: Arrow keys, WASD, touch swipe
- **Grace period**: 600ms before first movement
- **Transitions to**: GameOver

## GameOver
- **Key**: `GameOver`
- **Purpose**: Display results and navigation
- **Elements**:
  - "GAME OVER" title with scale-in animation
  - Final score (large golden text)
  - Neggs collected count
  - PLAY AGAIN button
  - LEADERBOARD button
  - MAIN MENU button
- **Side effect**: Submits score to server on create
- **Transitions to**: Game, Leaderboard, MainMenu

## Leaderboard
- **Key**: `Leaderboard`
- **Purpose**: Display top scores
- **Elements**:
  - Title
  - Top 15 entries with rank, username, score
  - Gold/silver/bronze colors for top 3
  - User's own rank (if available)
  - BACK button
- **Data**: Fetched from `/api/leaderboard`
- **Transitions to**: MainMenu
