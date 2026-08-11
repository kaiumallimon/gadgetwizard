"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Check, X } from "lucide-react";

import { ApiError, apiClient } from "@/lib/client/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ValidationErrorDetails {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
}

function PasswordRule({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <Check className="h-3 w-3 text-emerald-600" />
      ) : (
        <X className="h-3 w-3 text-zinc-400" />
      )}
      <span className={met ? "text-emerald-600" : "text-zinc-500"}>{label}</span>
    </div>
  );
}

function getReadableResetError(error: unknown): string {
  if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
    const details = (error.details ?? null) as ValidationErrorDetails | null;
    const passwordMessage = details?.fieldErrors?.newPassword?.[0];
    if (passwordMessage) {
      return passwordMessage;
    }

    const tokenMessage = details?.fieldErrors?.token?.[0];
    if (tokenMessage) {
      return tokenMessage;
    }

    const formMessage = details?.formErrors?.[0];
    if (formMessage) {
      return formMessage;
    }
  }

  return error instanceof Error ? error.message : "Unable to reset password";
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [email, setEmail] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyToken() {
      if (!token) {
        setVerifyError("Missing password reset token.");
        setVerifying(false);
        return;
      }

      try {
        setVerifying(true);
        setVerifyError(null);

        const response = await apiClient.verifyPasswordResetToken(token);
        if (!active) {
          return;
        }

        setEmail(response.email);
        setExpiresAt(response.expiresAt);
      } catch (error) {
        if (!active) {
          return;
        }

        setVerifyError(error instanceof Error ? error.message : "Invalid password reset link");
      } finally {
        if (active) {
          setVerifying(false);
        }
      }
    }

    void verifyToken();
    return () => {
      active = false;
    };
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.confirmPasswordReset(token, password);
      setSubmitSuccess("Password has been reset successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      setSubmitError(getReadableResetError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Password Reset</p>
          <CardTitle className="text-3xl">Set a new password</CardTitle>
          {!verifying && !verifyError && email && (
            <p className="text-sm text-zinc-600">
              Resetting password for <span className="font-medium text-zinc-900">{email}</span>
              {expiresAt ? ` (link expires ${new Date(expiresAt).toLocaleString()})` : ""}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {verifying && <p className="text-sm text-zinc-600">Verifying reset link...</p>}

          {!verifying && verifyError && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">{verifyError}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/forgot-password">Request New Reset Link</Link>
              </Button>
            </div>
          )}

          {!verifying && !verifyError && (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  required
                  minLength={8}
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
              {password.length > 0 && (
                <div className="space-y-1 text-[11px] leading-4">
                  <PasswordRule label="At least 8 characters" met={password.length >= 8} />
                  <PasswordRule label="One uppercase letter" met={/[A-Z]/.test(password)} />
                  <PasswordRule label="One lowercase letter" met={/[a-z]/.test(password)} />
                  <PasswordRule label="One number" met={/[0-9]/.test(password)} />
                  <PasswordRule label="One special character" met={/[^A-Za-z0-9]/.test(password)} />
                </div>
              )}
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Password must contain uppercase, lowercase, number, and special character.
              </p>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Resetting password..." : "Reset Password"}
              </Button>
            </form>
          )}

          {submitSuccess && <p className="mt-3 text-sm text-emerald-700">{submitSuccess}</p>}
          {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}

          <Button asChild variant="ghost" className="mt-4 px-0 text-sm text-zinc-600 hover:bg-transparent hover:text-zinc-900">
            <Link href="/?auth=login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8 sm:px-6">Loading reset form...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
