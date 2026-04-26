import type { BusinessAccountStatus, OrderPurchaseMode } from "@/lib/client/types";
import { badRequest, conflict, notFound } from "@/lib/server/core/errors";
import {
  getApprovedBusinessAccountByUserId,
  getBusinessAccountById,
  getBusinessAccountByUserId,
  listBusinessAccounts,
  updateBusinessAccountReview,
  upsertBusinessAccountForUser,
} from "@/lib/server/repositories/business-account-repository";
import { findUserById } from "@/lib/server/repositories/user-repository";

export async function getBusinessAccountForUser(userId: number) {
  return getBusinessAccountByUserId(userId);
}

export async function submitBusinessAccountApplication(input: {
  userId: number;
  businessName: string;
  legalEntityType: string;
  registrationNumber: string | null;
  taxId: string | null;
  yearsInOperation: number | null;
  websiteUrl: string | null;
  primaryContactName: string;
  primaryContactRole: string | null;
  primaryContactEmail: string;
  primaryContactPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  monthlyPurchaseVolume: string | null;
  productCategories: string[];
  documentUrls: string[];
  additionalNotes: string | null;
}) {
  const user = await findUserById(input.userId);
  if (!user) {
    throw notFound("User not found");
  }

  if (!user.isActive) {
    throw conflict("Disabled users cannot submit business account applications");
  }

  return upsertBusinessAccountForUser(input);
}

export async function getAdminBusinessAccounts(input: {
  page: number;
  pageSize: number;
  status?: BusinessAccountStatus;
  search?: string;
}) {
  return listBusinessAccounts(input);
}

export async function getAdminBusinessAccountById(id: number) {
  const item = await getBusinessAccountById(id);
  if (!item) {
    throw notFound("Business application not found");
  }

  return item;
}

export async function reviewBusinessAccount(input: {
  id: number;
  status: "approved" | "rejected";
  reviewNotes: string | null;
  reviewedByUserId: number;
}) {
  const existing = await getBusinessAccountById(input.id);
  if (!existing) {
    throw notFound("Business application not found");
  }

  const reviewer = await findUserById(input.reviewedByUserId);
  if (!reviewer || reviewer.role !== "admin") {
    throw badRequest("Only admins can review business applications");
  }

  const reviewed = await updateBusinessAccountReview(input);
  if (!reviewed) {
    throw notFound("Business application not found");
  }

  return reviewed;
}

export async function getBusinessCheckoutContext(userId: number, purchaseMode: OrderPurchaseMode) {
  const approvedAccount = await getApprovedBusinessAccountByUserId(userId);

  if (purchaseMode === "business" && !approvedAccount) {
    throw badRequest("Your business account is not approved yet for wholesale purchases");
  }

  return {
    approvedAccount,
    canUseBusinessMode: Boolean(approvedAccount),
  };
}
