import type { PuzzleConfig, Vehicle } from '../../../shared/types/api';

function v(
  id: string,
  type: 'car' | 'truck',
  orientation: 'h' | 'v',
  row: number,
  col: number,
  color: string,
  isTarget = false
): Vehicle {
  return { id, type, orientation, row, col, color, isTarget };
}

export const VEHICLE_COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#6a4c93', '#48bfe3', '#06d6a0', '#ef476f', '#ffd166',
  '#118ab2', '#073b4c', '#8338ec', '#ff006e', '#fb5607', '#3a86ff',
];

export const CATALOG_PUZZLES: PuzzleConfig[] = [
  // ---- BEGINNER (1-5 vehicles) ----
  {
    id: 'b01', name: 'First Steps', difficulty: 'beginner', minMoves: 1,
    vehicles: [
      v('X', 'car', 'h', 2, 3, VEHICLE_COLORS[0]!, true),
    ],
  },
  {
    id: 'b02', name: 'One Blocker', difficulty: 'beginner', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 1, 4, VEHICLE_COLORS[1]!),
    ],
  },
  {
    id: 'b03', name: 'Side Step', difficulty: 'beginner', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 1, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 2, 4, VEHICLE_COLORS[1]!),
      v('B', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
    ],
  },
  {
    id: 'b04', name: 'Tight Squeeze', difficulty: 'beginner', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 1, 4, VEHICLE_COLORS[2]!),
    ],
  },
  {
    id: 'b05', name: 'Two Way', difficulty: 'beginner', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('B', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
    ],
  },
  {
    id: 'b06', name: 'Clear Path', difficulty: 'beginner', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 1, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'h', 1, 3, VEHICLE_COLORS[2]!),
      v('C', 'car', 'v', 3, 2, VEHICLE_COLORS[4]!),
    ],
  },
  {
    id: 'b07', name: 'Detour', difficulty: 'beginner', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 2, 4, VEHICLE_COLORS[2]!),
      v('C', 'car', 'h', 4, 4, VEHICLE_COLORS[4]!),
    ],
  },
  {
    id: 'b08', name: 'Shuffle', difficulty: 'beginner', minMoves: 3,
    vehicles: [
      v('X', 'car', 'h', 2, 1, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('B', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
      v('C', 'car', 'v', 1, 5, VEHICLE_COLORS[5]!),
    ],
  },
  {
    id: 'b09', name: 'Warm Up', difficulty: 'beginner', minMoves: 3,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 2, 3, VEHICLE_COLORS[2]!),
      v('C', 'car', 'h', 4, 2, VEHICLE_COLORS[4]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[5]!),
    ],
  },
  {
    id: 'b10', name: 'Getting Started', difficulty: 'beginner', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 1, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('C', 'car', 'h', 0, 2, VEHICLE_COLORS[4]!),
      v('D', 'car', 'v', 3, 3, VEHICLE_COLORS[5]!),
    ],
  },

  // ---- INTERMEDIATE (6-9 vehicles) ----
  {
    id: 'i01', name: 'Crossroads', difficulty: 'intermediate', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 2, VEHICLE_COLORS[3]!),
      v('B', 'car', 'h', 0, 3, VEHICLE_COLORS[1]!),
      v('C', 'car', 'v', 0, 5, VEHICLE_COLORS[2]!),
      v('D', 'car', 'h', 3, 0, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 3, 3, VEHICLE_COLORS[5]!),
    ],
  },
  {
    id: 'i02', name: 'Traffic Jam', difficulty: 'intermediate', minMoves: 5,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 2, VEHICLE_COLORS[3]!),
      v('B', 'car', 'h', 3, 2, VEHICLE_COLORS[1]!),
      v('C', 'car', 'v', 1, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'h', 0, 3, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 5, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 0, VEHICLE_COLORS[6]!),
    ],
  },
  {
    id: 'i03', name: 'Gridlock', difficulty: 'intermediate', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 1, 3, VEHICLE_COLORS[2]!),
      v('C', 'car', 'h', 0, 3, VEHICLE_COLORS[4]!),
      v('D', 'car', 'v', 0, 5, VEHICLE_COLORS[5]!),
      v('E', 'car', 'h', 3, 1, VEHICLE_COLORS[6]!),
      v('F', 'car', 'v', 3, 4, VEHICLE_COLORS[7]!),
    ],
  },
  {
    id: 'i04', name: 'Bottleneck', difficulty: 'intermediate', minMoves: 5,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 2, VEHICLE_COLORS[3]!),
      v('B', 'car', 'v', 0, 3, VEHICLE_COLORS[1]!),
      v('C', 'car', 'h', 3, 0, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 4, 2, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 1, 5, VEHICLE_COLORS[6]!),
    ],
  },
  {
    id: 'i05', name: 'Maze Runner', difficulty: 'intermediate', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'h', 3, 0, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 5, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 3, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 3, 2, VEHICLE_COLORS[7]!),
    ],
  },
  {
    id: 'i06', name: 'Rush Hour', difficulty: 'intermediate', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 2, VEHICLE_COLORS[3]!),
      v('B', 'car', 'v', 0, 3, VEHICLE_COLORS[1]!),
      v('C', 'car', 'h', 3, 2, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 0, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 5, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 0, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'i07', name: 'Congestion', difficulty: 'intermediate', minMoves: 5,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 1, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 2, 3, VEHICLE_COLORS[2]!),
      v('C', 'car', 'h', 0, 2, VEHICLE_COLORS[4]!),
      v('D', 'car', 'v', 1, 4, VEHICLE_COLORS[5]!),
      v('E', 'car', 'h', 4, 2, VEHICLE_COLORS[6]!),
      v('F', 'truck', 'h', 5, 0, VEHICLE_COLORS[3]!),
    ],
  },
  {
    id: 'i08', name: 'Intersection', difficulty: 'intermediate', minMoves: 3,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 2, VEHICLE_COLORS[3]!),
      v('B', 'car', 'v', 0, 3, VEHICLE_COLORS[1]!),
      v('C', 'car', 'h', 3, 0, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 4, 3, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 0, 5, VEHICLE_COLORS[6]!),
    ],
  },
  {
    id: 'i09', name: 'Bumper to Bumper', difficulty: 'intermediate', minMoves: 3,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
    ],
  },
  {
    id: 'i10', name: 'Pile Up', difficulty: 'intermediate', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 1, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 0, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'h', 3, 0, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 5, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 3, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 3, 2, VEHICLE_COLORS[7]!),
    ],
  },

  // ---- ADVANCED (8-11 vehicles) ----
  {
    id: 'a01', name: 'Lockdown', difficulty: 'advanced', minMoves: 5,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 2, VEHICLE_COLORS[3]!),
      v('B', 'car', 'v', 0, 3, VEHICLE_COLORS[1]!),
      v('C', 'car', 'h', 3, 2, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 0, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 5, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 0, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 2, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'a02', name: 'Deadlock', difficulty: 'advanced', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 5, VEHICLE_COLORS[2]!),
      v('D', 'car', 'h', 3, 0, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 4, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'a03', name: 'Snarl', difficulty: 'advanced', minMoves: 6,
    vehicles: [
      v('X', 'car', 'h', 2, 1, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 0, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'h', 4, 3, VEHICLE_COLORS[7]!),
      v('H', 'car', 'v', 4, 5, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'a04', name: 'Standstill', difficulty: 'advanced', minMoves: 7,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'truck', 'v', 0, 2, VEHICLE_COLORS[3]!),
      v('B', 'car', 'v', 0, 3, VEHICLE_COLORS[1]!),
      v('C', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 3, VEHICLE_COLORS[6]!),
      v('G', 'car', 'h', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'v', 4, 1, VEHICLE_COLORS[8]!),
      v('I', 'truck', 'h', 5, 2, VEHICLE_COLORS[9]!),
    ],
  },
  {
    id: 'a05', name: 'Impasse', difficulty: 'advanced', minMoves: 3,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('C', 'truck', 'v', 0, 5, VEHICLE_COLORS[3]!),
      v('D', 'car', 'v', 2, 3, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'a06', name: 'Quagmire', difficulty: 'advanced', minMoves: 6,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 5, VEHICLE_COLORS[2]!),
      v('D', 'car', 'h', 3, 0, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 4, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
      v('I', 'car', 'h', 5, 2, VEHICLE_COLORS[9]!),
    ],
  },
  {
    id: 'a07', name: 'Entangled', difficulty: 'advanced', minMoves: 2,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 0, 3, VEHICLE_COLORS[2]!),
      v('C', 'car', 'h', 0, 4, VEHICLE_COLORS[4]!),
      v('D', 'car', 'v', 2, 3, VEHICLE_COLORS[5]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[6]!),
      v('F', 'car', 'v', 4, 2, VEHICLE_COLORS[7]!),
      v('G', 'car', 'h', 5, 3, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'a08', name: 'Stalemate', difficulty: 'advanced', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 5, VEHICLE_COLORS[2]!),
      v('D', 'car', 'h', 3, 0, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 4, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'a09', name: 'Labyrinth', difficulty: 'advanced', minMoves: 3,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('C', 'truck', 'v', 0, 5, VEHICLE_COLORS[3]!),
      v('D', 'car', 'v', 2, 3, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 4, 3, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 2, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
    ],
  },
  {
    id: 'a10', name: 'Conundrum', difficulty: 'advanced', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 5, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 4, 0, VEHICLE_COLORS[8]!),
      v('I', 'car', 'h', 5, 2, VEHICLE_COLORS[9]!),
    ],
  },

  // ---- EXPERT (10-13 vehicles) ----
  {
    id: 'e01', name: 'Nightmare', difficulty: 'expert', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 3, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
      v('I', 'car', 'h', 5, 3, VEHICLE_COLORS[9]!),
    ],
  },
  {
    id: 'e02', name: 'Impossible', difficulty: 'expert', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 1, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 0, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 1, VEHICLE_COLORS[6]!),
      v('F', 'car', 'v', 3, 4, VEHICLE_COLORS[7]!),
      v('G', 'car', 'h', 4, 0, VEHICLE_COLORS[8]!),
      v('H', 'car', 'h', 5, 3, VEHICLE_COLORS[9]!),
    ],
  },
  {
    id: 'e03', name: 'Chaos', difficulty: 'expert', minMoves: 7,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 4, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 3, 2, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 3, VEHICLE_COLORS[8]!),
      v('I', 'truck', 'h', 5, 0, VEHICLE_COLORS[9]!),
      v('J', 'car', 'v', 4, 5, VEHICLE_COLORS[10]!),
    ],
  },
  {
    id: 'e04', name: 'Inferno', difficulty: 'expert', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 3, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 0, VEHICLE_COLORS[8]!),
      v('I', 'car', 'h', 5, 3, VEHICLE_COLORS[9]!),
    ],
  },
  {
    id: 'e05', name: 'Armageddon', difficulty: 'expert', minMoves: 6,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 5, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 2, VEHICLE_COLORS[8]!),
      v('I', 'car', 'v', 4, 5, VEHICLE_COLORS[9]!),
      v('J', 'car', 'h', 5, 0, VEHICLE_COLORS[10]!),
    ],
  },
  {
    id: 'e06', name: 'Catastrophe', difficulty: 'expert', minMoves: 5,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 3, 1, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 3, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 4, 2, VEHICLE_COLORS[8]!),
      v('I', 'car', 'v', 4, 5, VEHICLE_COLORS[9]!),
      v('J', 'car', 'h', 5, 0, VEHICLE_COLORS[10]!),
    ],
  },
  {
    id: 'e07', name: 'Apocalypse', difficulty: 'expert', minMoves: 7,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 5, VEHICLE_COLORS[3]!),
      v('C', 'car', 'h', 0, 3, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 3, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 2, 4, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 3, 0, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 2, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 4, 3, VEHICLE_COLORS[8]!),
      v('I', 'car', 'h', 5, 0, VEHICLE_COLORS[9]!),
    ],
  },
  {
    id: 'e08', name: 'Oblivion', difficulty: 'expert', minMoves: 6,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 5, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 4, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 4, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'h', 5, 2, VEHICLE_COLORS[8]!),
      v('I', 'car', 'v', 4, 5, VEHICLE_COLORS[9]!),
      v('J', 'car', 'h', 5, 0, VEHICLE_COLORS[10]!),
    ],
  },
  {
    id: 'e09', name: 'Cataclysm', difficulty: 'expert', minMoves: 6,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'v', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'h', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'v', 3, 2, VEHICLE_COLORS[6]!),
      v('G', 'car', 'h', 4, 3, VEHICLE_COLORS[7]!),
      v('H', 'car', 'v', 4, 5, VEHICLE_COLORS[8]!),
      v('I', 'car', 'h', 5, 0, VEHICLE_COLORS[9]!),
    ],
  },
  {
    id: 'e10', name: 'Grand Master', difficulty: 'expert', minMoves: 4,
    vehicles: [
      v('X', 'car', 'h', 2, 0, VEHICLE_COLORS[0]!, true),
      v('A', 'car', 'v', 0, 2, VEHICLE_COLORS[1]!),
      v('B', 'truck', 'v', 0, 3, VEHICLE_COLORS[3]!),
      v('C', 'car', 'h', 0, 4, VEHICLE_COLORS[2]!),
      v('D', 'car', 'v', 2, 5, VEHICLE_COLORS[4]!),
      v('E', 'car', 'v', 3, 0, VEHICLE_COLORS[5]!),
      v('F', 'car', 'h', 3, 1, VEHICLE_COLORS[6]!),
      v('G', 'car', 'v', 3, 4, VEHICLE_COLORS[7]!),
      v('H', 'car', 'v', 4, 2, VEHICLE_COLORS[8]!),
      v('I', 'car', 'h', 5, 0, VEHICLE_COLORS[9]!),
      v('J', 'car', 'h', 5, 3, VEHICLE_COLORS[10]!),
    ],
  },
];

export function getPuzzleById(id: string): PuzzleConfig | undefined {
  return CATALOG_PUZZLES.find((p) => p.id === id);
}

export function getPuzzlesByDifficulty(difficulty: string): PuzzleConfig[] {
  return CATALOG_PUZZLES.filter((p) => p.difficulty === difficulty);
}

export function getDailyPuzzle(): PuzzleConfig {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CATALOG_PUZZLES.length;
  return CATALOG_PUZZLES[index]!;
}
