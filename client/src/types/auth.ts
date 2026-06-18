export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'developer';
  avatar_url: string | null;
  is_active: boolean;
  deleted_at?: string | null;
  created_at: string;
}

export interface AuthContextType {
  user: User | null | undefined;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
