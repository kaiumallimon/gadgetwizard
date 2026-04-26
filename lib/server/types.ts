export type UserRole = "user" | "admin";
export type BusinessAccountStatus = "pending" | "approved" | "rejected";

export interface AppUser {
  id: number;
  authUid: string;
  email: string;
  name: string;
  role: UserRole;
  businessAccountId: number | null;
  businessAccountStatus: BusinessAccountStatus | null;
  isBusinessApproved: boolean;
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
