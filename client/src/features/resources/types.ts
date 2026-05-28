export interface ProtectiveFactor {
  id: number;
  userId: number;
  name: string;
  description?: string;
  isGlobal: boolean;
  createdAt?: string;
}

export interface CopingStrategy {
  id: number;
  userId: number;
  name: string;
  description?: string;
  isGlobal: boolean;
  createdAt?: string;
}

export interface EducationalResource {
  id: number;
  title: string;
  description: string;
  content: string;
  type: string;
  category: string;
  createdBy?: number;
  isPublished?: boolean;
  tags?: string[];
  pdfUrl?: string;
  isEditing?: boolean;
}

export interface ResourceFeedback {
  id: number;
  resourceId: number;
  userId: number;
  rating: number;
  feedback?: string | null;
  createdAt: string;
}

export interface ResourceAssignment {
  id: number;
  resourceId: number;
  assignedTo?: number;
  clientId?: number;
  status: string;
  notes?: string;
  assignedAt: string;
  completedAt?: string | null;
  resource: EducationalResource;
  feedback?: ResourceFeedback | null;
  client?: {
    id: number;
    name?: string;
    username: string;
  };
}

export type ProtectiveFactorFormValues = {
  name: string;
  description?: string;
  isGlobal: boolean;
};

export type CopingStrategyFormValues = {
  name: string;
  description?: string;
  isGlobal: boolean;
};
