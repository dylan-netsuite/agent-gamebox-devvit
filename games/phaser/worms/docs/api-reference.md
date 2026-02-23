# Worms - API Reference

## Server Endpoints

### GET `/api/init`

Returns initial game state for the current post.

**Context**: `postId`, `userId` from Devvit context

**Response** (`InitResponse`):
```json
{
  "type": "init",
  "postId": "t3_abc123",
  "gameState": { ... },
  "currentPlayer": { ... } | null
}
```

### GET `/api/game/state`

Returns current game state.

**Context**: `postId` from Devvit context

**Response**: `GameState` object

### POST `/internal/on-app-install`

Handles app installation. Returns success acknowledgment.

### POST `/internal/menu/post-create`

Creates a new game post via the subreddit menu action.

**Response**:
```json
{
  "navigateTo": "/r/{subreddit}/comments/{postId}"
}
```

## Redis Keys

| Key Pattern | Type | Description |
|------------|------|-------------|
| `game:{postId}:state` | String (JSON) | Full game state |

## Shared Types

### `GameState`
```typescript
{
  postId: string;
  phase: 'lobby' | 'playing' | 'finished';
  players: PlayerInfo[];
  turn: TurnInfo;
  craters: Crater[];
  terrainSeed: number;
  winner: string | null;
}
```

### `WeaponDef`
```typescript
{
  id: WeaponType;
  name: string;
  blastRadius: number;
  damage: number;
  affectedByWind: boolean;
  fuse: number;
  bounces: boolean;
  firingMode: 'projectile' | 'hitscan' | 'placed' | 'targeted';
  projectileSpeed: number;
  projectileGravity: number;
  shotCount: number;
  bounceFriction: number;
  icon: string;
}
```
