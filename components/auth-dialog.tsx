"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import { ApiError, apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { sanitizeReturnTo } from "@/lib/shared/return-to";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "login" | "signup";
  onModeChange: (mode: "login" | "signup") => void;
  returnTo?: string | null;
}

interface ValidationErrorDetails {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
}

function toHumanReadableValidationMessage(messages: string[]): string {
  const cleaned = messages
    .map((message) => message.trim().replace(/\.$/, ""))
    .filter((message) => message.length > 0);

  if (cleaned.length === 0) {
    return "Please check your details and try again.";
  }

  if (cleaned.length === 1) {
    return `${cleaned[0]}.`;
  }

  const last = cleaned.at(-1);
  const firstPart = cleaned.slice(0, -1).join(", ");
  return `${firstPart}, and ${last}.`;
}

function getAuthErrorMessage(error: unknown, mode: "login" | "signup"): string {
  if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
    const details = (error.details ?? null) as ValidationErrorDetails | null;

    if (mode === "signup") {
      const passwordMessages = details?.fieldErrors?.password?.filter(Boolean) ?? [];
      if (passwordMessages.length > 0) {
        return `Password requirements not met: ${toHumanReadableValidationMessage(passwordMessages)}`;
      }
    }

    const fieldMessages = Object.values(details?.fieldErrors ?? {})
      .flatMap((messages) => messages ?? [])
      .filter((message): message is string => Boolean(message && message.trim().length > 0));

    if (fieldMessages.length > 0) {
      return toHumanReadableValidationMessage(fieldMessages);
    }

    const formMessage = details?.formErrors?.find((message) => Boolean(message && message.trim().length > 0));
    if (formMessage) {
      return formMessage;
    }
  }

  if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
    if (error.message.trim() === "Authentication required") {
      return mode === "login"
        ? "Email or password is incorrect."
        : "Your account was created, but we could not sign you in. Please log in.";
    }

    if (error.message.trim().length > 0) {
      return error.message;
    }
  }

  const authError = error as { code?: string };
  const code = authError?.code;

  if (code === "account_disabled") {
    return "Your account is disabled. Please contact support.";
  }

  if (code === "CredentialsSignin") {
    return "Email or password is incorrect.";
  }

  if (code === "credentials") {
    return "Email or password is incorrect.";
  }

  if (code === "CallbackRouteError") {
    return "We couldn't sign you in. Please try again.";
  }

  if (code === "SIGNIN_FAILED") {
    return "Unable to login right now.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return mode === "login" ? "Unable to login right now." : "Unable to create account right now.";
}

export function AuthDialog({ open, onOpenChange, mode, onModeChange, returnTo }: AuthDialogProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [mode]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setPending(true);
      if (mode === "signup") {
        await apiClient.registerUser({
          email,
          name,
          password,
        });
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!signInResult || signInResult.error || !signInResult.ok) {
        const failureCode = signInResult?.code ?? signInResult?.error ?? "SIGNIN_FAILED";
        const signInError = new Error(failureCode);
        (signInError as { code?: string }).code = failureCode;
        throw signInError;
      }

      const response = await apiClient.getMe();
      setAuth({
        token: "",
        session: response.session,
        user: response.user,
      });

      onOpenChange(false);

      if (response.session.role === "admin") {
        router.push("/admin");
        return;
      }

      const safeReturnTo = sanitizeReturnTo(returnTo);
      // Redirect to the page they came from, or default to dashboard
      const redirectPath = safeReturnTo && safeReturnTo !== "/login" ? safeReturnTo : "/dashboard";
      router.push(redirectPath);
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError, mode));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-zinc-200 p-0">
        <div className="border-b border-zinc-100 bg-linear-to-r from-orange-50 via-amber-50 to-zinc-50 px-6 py-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 text-(--accent)" /> Secure Access
          </div>
          <DialogHeader className="mt-3 space-y-1 text-left">
            <DialogTitle className="text-2xl text-zinc-900">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </DialogTitle>
            <p className="text-sm text-zinc-600">
              {mode === "login"
                ? "Sign in to continue shopping with your account."
                : "Join GadgetWizard to manage orders and checkout faster."}
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 rounded-full bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "signup" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                required
                minLength={2}
              />
            )}

            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "login" ? "Password" : "Create a strong password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "signup" ? 8 : 6}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {mode === "login" && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm font-medium text-(--accent) hover:text-zinc-900" onClick={() => onOpenChange(false)}>
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </Button>
          </form>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <p className="text-center text-xs text-zinc-500">By continuing, you agree to our Terms and Privacy standards.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
