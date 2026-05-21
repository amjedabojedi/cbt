export interface Goal {
  id: number;
  userId: number;
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'approved' | 'completed';
  therapistComments?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Milestone {
  id: number;
  goalId: number;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface MilestoneProgress {
  completed: number;
  total: number;
  percentage: number;
}
