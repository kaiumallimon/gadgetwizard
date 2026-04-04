import { issueBackendJwt } from "@/lib/server/auth/jwt";
import { verifyFirebaseIdToken } from "@/lib/server/auth/firebase-admin";
import { unauthorized } from "@/lib/server/core/errors";
import { findUserById, upsertUserFromFirebase } from "@/lib/server/repositories/user-repository";
import type { AuthSession } from "@/lib/server/types";

function toSession(input: {
  id: number;
  firebaseUid: string;
  email: string;
  name: string;
  role: "user" | "admin";
}): AuthSession {
  return {
    userId: input.id,
    firebaseUid: input.firebaseUid,
    email: input.email,
    name: input.name,
    role: input.role,
  };
}

export async function exchangeFirebaseToken(idToken: string) {
  const decoded = await verifyFirebaseIdToken(idToken);

  const firebaseUid = decoded.uid;
  const email = decoded.email;
  const name = decoded.name ?? decoded.email ?? "Guest";

  if (!firebaseUid || !email) {
    throw unauthorized("Firebase token missing required user claims");
  }

  const user = await upsertUserFromFirebase({
    firebaseUid,
    email,
    name,
  });

  if (!user.isActive) {
    throw unauthorized("User account is disabled");
  }

  const session = toSession(user);
  const token = await issueBackendJwt(session);

  return {
    token,
    session,
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
