import {
  createFaq,
  deleteFaq,
  findFaqById,
  listAdminFaqs,
  listPublicFaqs,
  updateFaq,
  type FaqRecord,
} from "@/lib/server/repositories/faq-repository";
import { notFound } from "@/lib/server/core/errors";

export async function getPublicFaqs(): Promise<FaqRecord[]> {
  return listPublicFaqs();
}

export async function getAdminFaqs(): Promise<FaqRecord[]> {
  return listAdminFaqs();
}

export async function createFaqAdmin(input: {
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<FaqRecord> {
  return createFaq({
    question: input.question.trim(),
    answer: input.answer.trim(),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function updateFaqAdmin(
  id: number,
  input: {
    question: string;
    answer: string;
    sortOrder?: number;
    isActive?: boolean;
  },
): Promise<FaqRecord> {
  const existing = await findFaqById(id);
  if (!existing) {
    throw notFound("FAQ not found");
  }

  const updated = await updateFaq(id, {
    question: input.question.trim(),
    answer: input.answer.trim(),
    sortOrder: input.sortOrder ?? existing.sortOrder,
    isActive: input.isActive ?? existing.isActive,
  });

  if (!updated) {
    throw notFound("FAQ not found");
  }

  return updated;
}

export async function deleteFaqAdmin(id: number): Promise<void> {
  const existing = await findFaqById(id);
  if (!existing) {
    throw notFound("FAQ not found");
  }

  await deleteFaq(id);
}
