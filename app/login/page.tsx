"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";

import { apiClient } from "@/lib/client/api";
import { getFirebaseClientAuth } from "@/lib/client/firebase";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Authentication</p>
          <CardTitle className="text-3xl">{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
            />
          )}
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            minLength={6}
          />

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </Button>
        </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <Button
            type="button"
            variant="ghost"
            onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
            className="mt-4 px-0 text-sm text-zinc-600 hover:bg-transparent hover:text-zinc-900"
          >
            {mode === "login" ? "Need an account? Sign up" : "Already registered? Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
