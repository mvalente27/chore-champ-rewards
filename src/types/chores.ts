export type RewardType = 'cash' | 'tv' | 'playdate' | 'treat';

export interface Reward {
  type: RewardType;
  value: number;
  unit: string;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  reward: Reward;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  isCompleted: boolean;
  assignedTo?: string;
  completedAt?: Date;
}

export interface Child {
  id: string;
  name: string;
  avatar: string;
  totalEarnings: number;
  completedChores: number;
  savingsGoal?: number;
}

export interface ChoreHistory {
  id: string;
  choreId: string;
  choreTitle: string;
  childId: string;
  reward: Reward;
  completedAt: Date;
}
