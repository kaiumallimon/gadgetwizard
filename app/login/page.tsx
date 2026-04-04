"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";

import { apiClient } from "@/lib/client/api";
import { getFirebaseClientAuth } from "@/lib/client/firebase";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setPending(true);
      const auth = getFirebaseClientAuth();

      if (mode === "signup") {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(credentials.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error("Unable to read Firebase ID token");
      }

      const response = await apiClient.exchangeFirebaseToken(token);
      setAuth({
        token: response.token,
        session: response.session,
        user: response.user,
      });

      if (response.session.role === "admin") {
        router.push("/admin");
        return;
      }

      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8 sm:px-6">
      <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">Authentication</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3"
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-(--accent) px-4 py-3 font-semibold text-black"
          >
            {pending ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <button
          type="button"
          onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
          className="mt-4 text-sm text-(--muted) underline underline-offset-4"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already registered? Login"}
        </button>
      </section>
    </div>
  );
}
