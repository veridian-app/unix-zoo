// ============================================
// Unix Zoo — Core Types
// ============================================

export type AnimalType =
  | 'dolphin'
  | 'tiger'
  | 'monkey'
  | 'squirrel'
  | 'koala'
  | 'giraffe'
  | 'lioness'
  | 'leopard'
  | 'cat'
  | 'kangaroo';

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  type: 'food' | 'hat' | 'accessory';
  hungerRestore?: number;    // for food items
  happinessBoost?: number;   // for food items
}

export interface PetState {
  hunger: number;        // 0-100
  happiness: number;     // 0-100
  ownedFood: string[];   // item ids
  ownedAccessories: string[];
  equippedHat: string | null;
  equippedAccessory: string | null;
  lastFedAt: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  animal: AnimalType;
  coins: number;
  pet: PetState;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  objectiveId: string | null;
  assignedTo: string;       // member id
  assignedBy: string;       // member id
  deadline: string;         // ISO date string
  createdAt: string;        // ISO date string
  completed: boolean;
  completedAt: string | null;
  estimatedHours: number | null;
  trackedTimeSeconds: number;
  trackingStartedAt: string | null; // ISO date for active tracking
  locked: boolean;
  movedDeadline: boolean;   // track if deadline was moved
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
  createdBy: string;
  assignedTo: string;
  taskIds: string[];
  completed: boolean;
  completedAt: string | null;
}

export type ViewMode = 'today' | 'week' | 'total';
export type TaskFilter = 'all' | 'mine' | 'assigned-by-me';
