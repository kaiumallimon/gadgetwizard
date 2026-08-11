import { notFound } from "next/navigation";

import { HttpError } from "@/lib/server/core/errors";

export async function renderOrNotFound<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }
}
