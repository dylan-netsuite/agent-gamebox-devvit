# Scattergories - Game Mechanics

## Rules

Based on the classic Hasbro board game (2003 edition).

### Setup
- 2-6 players (multiplayer) or 1 player (single player)
- 10 predefined category lists, each with 12 categories
- Letter pool: A-P, R-T, W (20 valid letters, matching the real 20-sided die)

### Round Flow
1. A random letter is selected (no repeats within a game)
2. A random category list is selected (no repeats within a game)
3. Players have **90 seconds** to type one answer per category
4. Answers must start with the rolled letter
5. Players can submit early; auto-submit when timer expires

### Scoring
- **Multiplayer**: Duplicate answers between any players score 0 for both. Each unique valid answer scores 1 point.
- **Single Player (vs AI)**: Valid answers score 1 point. Duplicate answers between human and AI score 0 for both.

### Answer Validation
Answers go through two validation layers:

1. **Format Validation**: Must start with the required letter, minimum 2 characters, cannot be a repeated character, must contain at least one vowel.
2. **Category Relevance**: For enumerable categories (Animals, Countries, Trees, Emotions, Sports, Colors, etc.), the answer must appear in a known word list. Matching uses fuzzy logic — exact match, multi-word partial match, and substring match. Open-ended categories ("Things in a Kitchen", "Excuses for Being Late") always pass category relevance.

Supported enumerable category types: names, cities, countries, animals, food, sports, clothing, occupations, flowers, trees, colors, instruments, cars, holidays, superheroes, emotions, languages, insects, birds, fish, reptiles, dances, shows.

### Game Structure
- 3 rounds per game
- Different letter and category list each round
- Highest total score after 3 rounds wins

## Timers
- Round timer: 90 seconds
- Results display: 5 seconds before next round auto-starts (multiplayer)

## Category Lists
10 lists of 12 categories each, covering topics like:
- Names, cities, countries, foods, animals
- TV shows, movies, sports, occupations
- Things in various locations (kitchen, bedroom, office)
- Descriptive categories (things that are cold/hot/round)
