export type UserRole = "user" | "admin";

export interface AppUser {
  id: number;
  firebaseUid: string;
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
  firebaseUid: string;
  email: string;
  name: string;
  role: UserRole;
}
