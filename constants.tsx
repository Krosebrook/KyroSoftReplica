/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingConfig, BuildingType, GameScenario } from './types';

// Map Settings
export const GRID_SIZE = 15;

// Game Settings
export const TICK_RATE_MS = 2000; // Game loop updates every 2 seconds
export const INITIAL_MONEY = 1000;

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    cost: 0,
    name: 'Bulldoze',
    description: 'Clear a tile',
    color: '#ef4444', // Used for UI
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    cost: 10,
    name: 'Road',
    description: 'Connects buildings.',
    color: '#374151', // gray-700
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    cost: 100,
    name: 'House',
    description: '+5 Pop/day',
    color: '#f87171', // red-400
    popGen: 5,
    incomeGen: 0,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    cost: 200,
    name: 'Shop',
    description: '+$15/day',
    color: '#60a5fa', // blue-400
    popGen: 0,
    incomeGen: 15,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    cost: 400,
    name: 'Factory',
    description: '+$40/day',
    color: '#facc15', // yellow-400
    popGen: 0,
    incomeGen: 40,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    cost: 50,
    name: 'Park',
    description: 'Looks nice.',
    color: '#4ade80', // green-400
    popGen: 1,
    incomeGen: 0,
  },
};

export const SCENARIOS: GameScenario[] = [
  {
    id: 'sunny-isles',
    name: 'Sunny Isles',
    description: 'A beginner-friendly island paradise. Perfect for tourism and relaxed building.',
    difficulty: 'Easy',
    initialMoney: 2000,
    terrain: 'island',
    color: 'from-cyan-400 to-blue-500',
    icon: '🏝️'
  },
  {
    id: 'metro-center',
    name: 'Metro Plains',
    description: 'A vast flat expanse ready for rapid urbanization and high-density blocks.',
    difficulty: 'Medium',
    initialMoney: 1000,
    terrain: 'plains',
    color: 'from-emerald-400 to-green-600',
    icon: '🏙️'
  },
  {
    id: 'azure-coast',
    name: 'Azure Coast',
    description: 'A scenic coastline with limited buildable area. Requires strategic planning.',
    difficulty: 'Hard',
    initialMoney: 800,
    terrain: 'coast',
    color: 'from-indigo-400 to-purple-600',
    icon: '🌊'
  }
];
