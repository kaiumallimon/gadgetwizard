import {
  createBanner,
  deleteBanner,
  findBannerById,
  listAdminBanners,
  listPublicBanners,
  updateBanner,
} from "@/lib/server/repositories/banner-repository";
import { badRequest, notFound } from "@/lib/server/core/errors";
import { assertValidCdnUrls } from "@/lib/server/utils/cdn";

function validateClickUrl(clickUrl: string | null | undefined): string | null {
  if (!clickUrl) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(clickUrl);
  } catch {
    throw badRequest("Banner click URL is invalid");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw badRequest("Banner click URL protocol must be http or https");
  }

  return clickUrl;
}

function validateWindow(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt || !endsAt) {
    return;
  }

  if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    throw badRequest("Banner end time cannot be before start time");
  }
}

export async function getPublicBanners() {
  return listPublicBanners();
}

export async function getAdminBanners() {
  return listAdminBanners();
}

export async function createBannerAdmin(input: {
  title: string;
  desktopImageUrl: string;
  clickUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}) {
  assertValidCdnUrls([input.desktopImageUrl]);
  const clickUrl = validateClickUrl(input.clickUrl);
  validateWindow(input.startsAt, input.endsAt);

  return createBanner({
    title: input.title.trim(),
    desktopImageUrl: input.desktopImageUrl,
    clickUrl,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
  });
}

export async function updateBannerAdmin(
  id: number,
  input: {
    title: string;
    desktopImageUrl: string;
    clickUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  },
) {
  const existing = await findBannerById(id);
  if (!existing) {
    throw notFound("Banner not found");
  }

  assertValidCdnUrls([input.desktopImageUrl]);
  const clickUrl = validateClickUrl(input.clickUrl);
  validateWindow(input.startsAt, input.endsAt);

  const updated = await updateBanner(id, {
    title: input.title.trim(),
    desktopImageUrl: input.desktopImageUrl,
    clickUrl,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    isActive: input.isActive ?? existing.isActive,
    startsAt: input.startsAt ?? existing.startsAt,
    endsAt: input.endsAt ?? existing.endsAt,
  });

  if (!updated) {
    throw notFound("Banner not found");
  }

  return updated;
}

export async function deleteBannerAdmin(id: number): Promise<void> {
  const existing = await findBannerById(id);
  if (!existing) {
    throw notFound("Banner not found");
  }

  await deleteBanner(id);
}
