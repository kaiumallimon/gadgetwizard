"use client";

import { useMemo, useState } from "react";
import { Building2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import type { BusinessAccount, BusinessAccountStatus } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  businessName: string;
  legalEntityType: string;
  registrationNumber: string;
  taxId: string;
  yearsInOperation: string;
  websiteUrl: string;
  primaryContactName: string;
  primaryContactRole: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  monthlyPurchaseVolume: string;
  productCategories: string;
  documentUrls: string;
  additionalNotes: string;
};

function statusBadgeClass(status: BusinessAccountStatus): string {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function toFormState(account: BusinessAccount | null): FormState {
  if (!account) {
    return {
      businessName: "",
      legalEntityType: "",
      registrationNumber: "",
      taxId: "",
      yearsInOperation: "",
      websiteUrl: "",
      primaryContactName: "",
      primaryContactRole: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Bangladesh",
      monthlyPurchaseVolume: "",
      productCategories: "",
      documentUrls: "",
      additionalNotes: "",
    };
  }

  return {
    businessName: account.businessName,
    legalEntityType: account.legalEntityType,
    registrationNumber: account.registrationNumber ?? "",
    taxId: account.taxId ?? "",
    yearsInOperation: account.yearsInOperation !== null ? String(account.yearsInOperation) : "",
    websiteUrl: account.websiteUrl ?? "",
    primaryContactName: account.primaryContactName,
    primaryContactRole: account.primaryContactRole ?? "",
    primaryContactEmail: account.primaryContactEmail,
    primaryContactPhone: account.primaryContactPhone,
    addressLine1: account.addressLine1,
    addressLine2: account.addressLine2 ?? "",
    city: account.city,
    state: account.state ?? "",
    postalCode: account.postalCode ?? "",
    country: account.country,
    monthlyPurchaseVolume: account.monthlyPurchaseVolume ?? "",
    productCategories: account.productCategories.join(", "),
    documentUrls: account.documentUrls.join("\n"),
    additionalNotes: account.additionalNotes ?? "",
  };
}

interface BusinessAccountApplicationManagerProps {
  initialAccount: BusinessAccount | null;
}

export function BusinessAccountApplicationManager({
  initialAccount,
}: BusinessAccountApplicationManagerProps) {
  const { token } = useAuthStore();
  const [account, setAccount] = useState<BusinessAccount | null>(initialAccount);
  const [form, setForm] = useState<FormState>(() => toFormState(initialAccount));
  const [saving, setSaving] = useState(false);

  const isApproved = account?.status === "approved";
  const statusLabel = account ? account.status.toUpperCase() : "NOT APPLIED";

  const parsedCategories = useMemo(
    () => form.productCategories.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0),
    [form.productCategories],
  );

  const parsedDocumentUrls = useMemo(
    () => form.documentUrls.split("\n").map((entry) => entry.trim()).filter((entry) => entry.length > 0),
    [form.documentUrls],
  );

  async function submitApplication() {
    if (!form.businessName.trim() || !form.legalEntityType.trim()) {
      toast.error("Business name and legal entity type are required.");
      return;
    }

    if (!form.primaryContactName.trim() || !form.primaryContactEmail.trim() || !form.primaryContactPhone.trim()) {
      toast.error("Primary contact name, email and phone are required.");
      return;
    }

    if (!form.addressLine1.trim() || !form.city.trim() || !form.country.trim()) {
      toast.error("Business address line 1, city and country are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.submitBusinessAccountApplication(
        {
          businessName: form.businessName.trim(),
          legalEntityType: form.legalEntityType.trim(),
          registrationNumber: form.registrationNumber.trim() || null,
          taxId: form.taxId.trim() || null,
          yearsInOperation: form.yearsInOperation.trim() ? Number(form.yearsInOperation) : null,
          websiteUrl: form.websiteUrl.trim() || null,
          primaryContactName: form.primaryContactName.trim(),
          primaryContactRole: form.primaryContactRole.trim() || null,
          primaryContactEmail: form.primaryContactEmail.trim(),
          primaryContactPhone: form.primaryContactPhone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim() || null,
          postalCode: form.postalCode.trim() || null,
          country: form.country.trim(),
          monthlyPurchaseVolume: form.monthlyPurchaseVolume.trim() || null,
          productCategories: parsedCategories,
          documentUrls: parsedDocumentUrls,
          additionalNotes: form.additionalNotes.trim() || null,
        },
        token ?? undefined,
      );

      setAccount(response.item);
      setForm(toFormState(response.item));
      toast.success("Business account application submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {account ? (
            <div className="space-y-2">
              <Badge variant="outline" className={statusBadgeClass(account.status)}>
                {statusLabel}
              </Badge>
              {account.reviewNotes && (
                <p className="text-sm text-zinc-700">
                  <span className="font-medium text-zinc-900">Admin note:</span> {account.reviewNotes}
                </p>
              )}
              {account.reviewedAt && (
                <p className="text-xs text-zinc-500">
                  Reviewed on {new Date(account.reviewedAt).toLocaleString()}
                </p>
              )}
              {isApproved && (
                <p className="text-sm text-emerald-700">
                  Your business account is active. You can now use business mode during checkout to unlock wholesale pricing.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">No application submitted yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Business Application Form</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Business Name *</Label>
            <Input
              value={form.businessName}
              onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
              placeholder="Your registered business name"
            />
          </div>
          <div className="space-y-1">
            <Label>Legal Entity Type *</Label>
            <Input
              value={form.legalEntityType}
              onChange={(event) => setForm((prev) => ({ ...prev, legalEntityType: event.target.value }))}
              placeholder="Sole Proprietorship, LLC, Ltd, etc"
            />
          </div>
          <div className="space-y-1">
            <Label>Registration Number</Label>
            <Input
              value={form.registrationNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, registrationNumber: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Tax ID / VAT Number</Label>
            <Input
              value={form.taxId}
              onChange={(event) => setForm((prev) => ({ ...prev, taxId: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Years In Operation</Label>
            <Input
              type="number"
              min={0}
              value={form.yearsInOperation}
              onChange={(event) => setForm((prev) => ({ ...prev, yearsInOperation: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Business Website</Label>
            <Input
              value={form.websiteUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, websiteUrl: event.target.value }))}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-1">
            <Label>Primary Contact Name *</Label>
            <Input
              value={form.primaryContactName}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryContactName: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Primary Contact Role</Label>
            <Input
              value={form.primaryContactRole}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryContactRole: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Primary Contact Email *</Label>
            <Input
              type="email"
              value={form.primaryContactEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryContactEmail: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Primary Contact Phone *</Label>
            <Input
              value={form.primaryContactPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryContactPhone: event.target.value }))}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Address Line 1 *</Label>
            <Input
              value={form.addressLine1}
              onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Address Line 2</Label>
            <Input
              value={form.addressLine2}
              onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>City *</Label>
            <Input
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>State / Province</Label>
            <Input
              value={form.state}
              onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Postal Code</Label>
            <Input
              value={form.postalCode}
              onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Country *</Label>
            <Input
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Estimated Monthly Purchase Volume</Label>
            <Input
              value={form.monthlyPurchaseVolume}
              onChange={(event) => setForm((prev) => ({ ...prev, monthlyPurchaseVolume: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Interested Product Categories</Label>
            <Input
              value={form.productCategories}
              onChange={(event) => setForm((prev) => ({ ...prev, productCategories: event.target.value }))}
              placeholder="Comma separated"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Document URLs</Label>
            <Textarea
              value={form.documentUrls}
              onChange={(event) => setForm((prev) => ({ ...prev, documentUrls: event.target.value }))}
              placeholder="One URL per line"
              className="min-h-24"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={form.additionalNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, additionalNotes: event.target.value }))}
              className="min-h-24"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              type="button"
              onClick={() => void submitApplication()}
              disabled={saving}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {account ? "Resubmit Application" : "Submit Application"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
