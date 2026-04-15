export type UserRole = "user" | "admin";

export interface AppUser {
  id: number;
  authUid: string;
  email: string;
  name: string;
  role: UserRole;
  rewardPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: number;
  authUid: string;
  email: string;
  name: string;
  role: UserRole;
}
