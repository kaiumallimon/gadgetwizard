import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { conflict, notFound, unauthorized } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";

type FirebaseServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function stripWrappingQuotes(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function normalizePemPrivateKey(value: string): string {
  const trimmed = stripWrappingQuotes(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .trim();

  if (!trimmed.includes("-----BEGIN PRIVATE KEY-----") || !trimmed.includes("-----END PRIVATE KEY-----")) {
    throw new Error("Decoded private key does not contain a valid PEM block");
  }

  return `${trimmed}\n`;
}

function decodePrivateKeyBase64(value: string): string {
  const noPrefix = stripWrappingQuotes(value).replace(/^FIREBASE_PRIVATE_KEY_BASE64\s*=\s*/i, "");
  const normalizedBase64 = noPrefix.replace(/\s+/g, "").replace(/ /g, "+");

  let decoded = "";
  try {
    decoded = Buffer.from(normalizedBase64, "base64").toString("utf8");
  } catch {
    throw new Error("FIREBASE_PRIVATE_KEY_BASE64 must be valid base64");
  }

  return normalizePemPrivateKey(decoded);
}

function resolveServiceAccountFromEnv(): FirebaseServiceAccount {
  const env = getEnv();

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as FirebaseServiceAccount;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON");
    }
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY_BASE64) {
    return {
      project_id: env.FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: decodePrivateKeyBase64(env.FIREBASE_PRIVATE_KEY_BASE64),
    };
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: env.FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: normalizePemPrivateKey(env.FIREBASE_PRIVATE_KEY),
    };
  }

  throw new Error(
    "Firebase admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_CLIENT_EMAIL with FIREBASE_PRIVATE_KEY_BASE64 (recommended), or FIREBASE_CLIENT_EMAIL with FIREBASE_PRIVATE_KEY.",
  );
}

function getFirebaseApp() {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const env = getEnv();
  const serviceAccount = resolveServiceAccountFromEnv();

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
      privateKey: normalizePemPrivateKey(serviceAccount.private_key),
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
  } catch (error) {
    const firebaseError = error as { code?: string };
    if (firebaseError?.code?.startsWith("auth/")) {
      throw unauthorized("Invalid Firebase ID token");
    }

    throw error;
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
