import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, FileText, MapPin, User } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminBusinessAccountById } from "@/lib/server/services/business-account-service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function statusClass(status: "pending" | "approved" | "rejected"): string {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function renderValue(value: string | null | undefined): string {
  if (!value) {
    return "N/A";
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "N/A";
}

export default async function AdminBusinessAccountDetailPage({ params }: Props) {
  await requireServerRole(["admin"]);

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    notFound();
  }

  const item = await getAdminBusinessAccountById(requestId).catch(() => null);
  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Business Request #{item.id}</h1>
            <p className="mt-2 text-sm text-zinc-600">Submitted {new Date(item.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusClass(item.status)}>
              {item.status.toUpperCase()}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/business-accounts">Back to Requests</Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin/business-accounts">Business Requests</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Request #{item.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Applicant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-zinc-700">
            <p><span className="font-medium text-zinc-900">Name:</span> {renderValue(item.userName)}</p>
            <p><span className="font-medium text-zinc-900">Email:</span> {renderValue(item.userEmail)}</p>
            <p><span className="font-medium text-zinc-900">Primary Contact:</span> {item.primaryContactName}</p>
            <p><span className="font-medium text-zinc-900">Contact Role:</span> {renderValue(item.primaryContactRole)}</p>
            <p><span className="font-medium text-zinc-900">Contact Email:</span> {item.primaryContactEmail}</p>
            <p><span className="font-medium text-zinc-900">Contact Phone:</span> {item.primaryContactPhone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-zinc-700">
            <p><span className="font-medium text-zinc-900">Business Name:</span> {item.businessName}</p>
            <p><span className="font-medium text-zinc-900">Entity Type:</span> {item.legalEntityType}</p>
            <p><span className="font-medium text-zinc-900">Registration Number:</span> {renderValue(item.registrationNumber)}</p>
            <p><span className="font-medium text-zinc-900">Tax ID / VAT:</span> {renderValue(item.taxId)}</p>
            <p>
              <span className="font-medium text-zinc-900">Years in Operation:</span>{" "}
              {item.yearsInOperation === null ? "N/A" : item.yearsInOperation}
            </p>
            <p>
              <span className="font-medium text-zinc-900">Website:</span>{" "}
              {item.websiteUrl ? (
                <Link href={item.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {item.websiteUrl}
                </Link>
              ) : (
                "N/A"
              )}
            </p>
            <p><span className="font-medium text-zinc-900">Monthly Purchase Volume:</span> {renderValue(item.monthlyPurchaseVolume)}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" /> Business Address
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 text-sm text-zinc-700">
          <p><span className="font-medium text-zinc-900">Address Line 1:</span> {item.addressLine1}</p>
          <p><span className="font-medium text-zinc-900">Address Line 2:</span> {renderValue(item.addressLine2)}</p>
          <p><span className="font-medium text-zinc-900">City:</span> {item.city}</p>
          <p><span className="font-medium text-zinc-900">State / Province:</span> {renderValue(item.state)}</p>
          <p><span className="font-medium text-zinc-900">Postal Code:</span> {renderValue(item.postalCode)}</p>
          <p><span className="font-medium text-zinc-900">Country:</span> {item.country}</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Category Interest & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-700">
            <div>
              <p className="font-medium text-zinc-900">Interested Product Categories</p>
              {item.productCategories.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.productCategories.map((category) => (
                    <Badge key={category} variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                      {category}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-zinc-500">No categories submitted.</p>
              )}
            </div>

            <div>
              <p className="font-medium text-zinc-900">Additional Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{renderValue(item.additionalNotes)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attached Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-700">
            {item.documentUrls.length > 0 ? (
              item.documentUrls.map((url) => (
                <p key={url}>
                  <Link href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                    {url}
                  </Link>
                </p>
              ))
            ) : (
              <p className="text-zinc-500">No documents submitted.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Review Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-zinc-700">
          <p><span className="font-medium text-zinc-900">Status:</span> {item.status.toUpperCase()}</p>
          <p><span className="font-medium text-zinc-900">Review Note:</span> {renderValue(item.reviewNotes)}</p>
          <p><span className="font-medium text-zinc-900">Reviewed By:</span> {renderValue(item.reviewedByUserName ?? item.reviewedByUserEmail)}</p>
          <p>
            <span className="font-medium text-zinc-900">Reviewed At:</span>{" "}
            {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
