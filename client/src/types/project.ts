export interface ProjectTask {
  id: number;
  title: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string | null;
  assigned_to?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar_url: string | null;
  } | null;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  start_date: string;
  end_date: string | null;
  budget: string | null;
  tasks?: ProjectTask[];
  task_count: number;
  completed_tasks?: number;
  created_at: string;
  owner?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar_url: string | null;
  } | null;
}
