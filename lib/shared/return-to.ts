export type RawSearchParams = Record<string, string | string[] | undefined>;

function toSearchParams(rawSearchParams?: RawSearchParams): URLSearchParams {
  const params = new URLSearchParams();

  if (!rawSearchParams) {
    return params;
  }

  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) {
          params.append(key, entry);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

export function buildReturnTo(pathname: string, rawSearchParams?: RawSearchParams): string {
  const query = toSearchParams(rawSearchParams).toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildLoginRedirect(pathname: string, rawSearchParams?: RawSearchParams): string {
  const returnTo = buildReturnTo(pathname, rawSearchParams);
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  return `/login?${params.toString()}`;
}

export function sanitizeReturnTo(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}
