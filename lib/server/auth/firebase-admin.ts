import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { conflict, notFound, unauthorized } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";

function getFirebaseApp() {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const env = getEnv();
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required for Firebase token verification");
  }

  let serviceAccount: { project_id?: string; client_email?: string; private_key?: string };
  try {
    serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON");
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Firebase service account must include client_email and private_key");
  }

  const projectId = env.FIREBASE_PROJECT_ID ?? serviceAccount.project_id;
  if (!projectId) {
    throw new Error("Firebase project id is missing");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
    projectId,
  });
}

function getFirebaseAdminAuth() {
  return getAuth(getFirebaseApp());
}

function mapFirebaseError(error: unknown): never {
  const firebaseError = error as { code?: string };
  if (firebaseError?.code === "auth/email-already-exists") {
    throw conflict("This email already exists in Firebase authentication");
  }

  if (firebaseError?.code === "auth/user-not-found") {
    throw notFound("Firebase user not found");
  }

  throw new Error("Unable to complete Firebase authentication operation");
}

export async function verifyFirebaseIdToken(idToken: string) {
  try {
    const auth = getFirebaseAdminAuth();
    return await auth.verifyIdToken(idToken, true);
  } catch {
    throw unauthorized("Invalid Firebase ID token");
  }
}

export async function createFirebaseUser(input: {
  email: string;
  password: string;
  name: string;
}) {
  try {
    const auth = getFirebaseAdminAuth();
    return await auth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.name,
      emailVerified: false,
      disabled: false,
    });
  } catch (error) {
    mapFirebaseError(error);
  }
}

export async function updateFirebaseUserPassword(firebaseUid: string, password: string) {
  try {
    const auth = getFirebaseAdminAuth();
    await auth.updateUser(firebaseUid, {
      password,
      disabled: false,
    });
    await auth.revokeRefreshTokens(firebaseUid);
  } catch (error) {
    mapFirebaseError(error);
  }
}

export async function deleteFirebaseUser(firebaseUid: string): Promise<void> {
  try {
    const auth = getFirebaseAdminAuth();
    await auth.deleteUser(firebaseUid);
  } catch (error) {
    mapFirebaseError(error);
  }
}
