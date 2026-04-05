"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiClient } from "@/lib/client/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      setPending(true);
      const response = await apiClient.requestPasswordReset(email.trim());
      setMessage(response.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to process your request");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Password Reset</p>
          <CardTitle className="text-3xl">Forgot your password?</CardTitle>
          <p className="text-sm text-zinc-600">
            Enter your account email. We will send a secure reset verification link.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Sending reset link..." : "Send Reset Link"}
            </Button>
          </form>

          {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <Button asChild variant="ghost" className="mt-4 px-0 text-sm text-zinc-600 hover:bg-transparent hover:text-zinc-900">
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
