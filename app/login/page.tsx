import { redirect } from "next/navigation";
import { sanitizeReturnTo } from "@/lib/shared/return-to";

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const rawSearchParams = await searchParams;
  const returnToValue = Array.isArray(rawSearchParams.returnTo)
    ? rawSearchParams.returnTo[0]
    : rawSearchParams.returnTo;
  const safeReturnTo = sanitizeReturnTo(returnToValue);
  const params = new URLSearchParams();
  params.set("auth", "login");
  if (safeReturnTo) {
    params.set("returnTo", safeReturnTo);
  }
  redirect(`/?${params.toString()}`);
}
