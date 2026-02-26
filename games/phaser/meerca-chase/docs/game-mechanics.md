# Meerca Chase - Game Mechanics

## Overview

A Neopets-inspired snake game. Control a Meerca collecting colored Neggs on a grid. Tail grows with each collection. Game ends on wall or self-collision.

## Grid

- **Size**: 20 columns x 15 rows
- **Cell size**: Calculated dynamically based on viewport
- **Visual**: Purple checkerboard pattern with subtle grid lines

## Movement

- **Direction**: Arrow keys (WASD also supported) or touch swipe
- **Tick-based**: Meerca moves one cell per tick
- **Input queue**: Up to 3 queued direction changes for responsive controls
- **Restriction**: Cannot reverse directly into own tail
- **Grace period**: 600ms delay at game start before first movement

## Negg Types

| Type | Points | Color | Weight (probability) |
|------|--------|-------|---------------------|
| Blue | 1 | #4a9eff | 40% |
| Green | 2 | #00c853 | 25% |
| Yellow | 5 | #ffd700 | 18% |
| Red | 10 | #ff4444 | 10% |
| Rainbow | 20 | #e040fb | 4% |
| Fish | -5 | #607d8b | 3% |

## Speed Progression

- **Classic base**: 180ms per tick
- **Hard base**: 130ms per tick
- **Speed increase**: Every 50 points, tick decreases by 8ms
- **Minimum tick**: 70ms

## Scoring

- Score = sum of collected Negg points
- Score cannot go below 0 (Fish Negg penalty capped)
- Points popup animation on collection
- Particle burst effect on collection

## Difficulty Levels

- **Classic**: Normal starting speed, standard Negg distribution
- **Hard**: Faster starting speed (130ms vs 180ms), 2 Neggs on field simultaneously

## Collision

- **Wall**: Game over if head moves outside grid bounds
- **Self**: Game over if head moves into any tail segment
- **Screen shake**: 200ms shake effect on game over
