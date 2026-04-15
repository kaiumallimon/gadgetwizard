import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { conflict, unauthorized } from "@/lib/server/core/errors";
import {
  createUserWithPassword,
  findUserByEmail,
  findUserById,
  findUserWithPasswordByEmail,
} from "@/lib/server/repositories/user-repository";
import type { AuthSession } from "@/lib/server/types";

function toSession(input: {
  id: number;
  authUid: string;
  email: string;
  name: string;
  role: "user" | "admin";
}): AuthSession {
  return {
    userId: input.id,
    authUid: input.authUid,
    email: input.email,
    name: input.name,
    role: input.role,
  };
}

export async function authenticateUserWithPassword(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const result = await findUserWithPasswordByEmail(email);

  if (!result?.passwordHash) {
    throw unauthorized("Email or password is incorrect");
  }

  const isValid = await bcrypt.compare(input.password, result.passwordHash);
  if (!isValid) {
    throw unauthorized("Email or password is incorrect");
  }

  if (!result.user.isActive) {
    throw unauthorized("User account is disabled");
  }

  const session = toSession(result.user);
  return {
    session,
    user: result.user,
  };
}

export async function registerUserWithPassword(input: { email: string; password: string; name: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const existing = await findUserByEmail(email);
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUserWithPassword({
    authUid: randomUUID(),
    email,
    name,
    passwordHash,
  });

  return {
    session: toSession(user),
    user,
  };
}

export async function getCurrentUser(userId: number) {
  const user = await findUserById(userId);
  if (!user) {
    throw unauthorized("User no longer exists");
  }

  if (!user.isActive) {
    throw unauthorized("User account is disabled");
  }

  return user;
}
