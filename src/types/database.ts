// Database types that mirror the Supabase schema

export type ProfileType = 'parent' | 'kid';
export type ChoreStatus = 'available' | 'claimed' | 'pending_verification' | 'completed';
export type EarningStatus = 'pending' | 'approved' | 'rejected';

export interface Household {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string | null;
  household_id: string;
  name: string;
  type: ProfileType;
  avatar_url: string | null;
  total_earnings: number;
  birth_date: string | null;
  level: number;
  xp: number;
  created_at: string;
  updated_at: string;
}

export interface Chore {
  id: string;
  household_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  reward_value: number;
  icon: string;
  status: ChoreStatus;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Earning {
  id: string;
  profile_id: string;
  chore_id: string | null;
  amount: number;
  status: EarningStatus;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
}

// Extended types with relations
export interface ChoreWithAssignee extends Chore {
  assigned_profile?: Profile;
}

export interface EarningWithChore extends Earning {
  chore?: Chore;
}
