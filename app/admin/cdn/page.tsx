import Link from "next/link";
import { redirect } from "next/navigation";
import { HardDrive, Image as ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getCdnStats } from "@/lib/server/services/cdn-service";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}

export default async function AdminCdnPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  let stats: Awaited<ReturnType<typeof getCdnStats>> | null = null;
  let loadError: string | null = null;

  try {
    stats = await getCdnStats();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load CDN statistics";
  }

  const categoryEntries = stats ? Object.entries(stats.byCategory) : [];

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">CDN Statistics</h1>
        <p className="mt-2 text-sm text-zinc-600">Detailed storage and access monitoring for uploaded CDN assets.</p>
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
                <BreadcrumbPage>CDN</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {loadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{loadError}</CardContent>
        </Card>
      )}

      {stats && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="h-4 w-4" /> Total Files
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-2xl font-semibold">{stats.totals.totalFiles}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Storage Used</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-2xl font-semibold">{formatBytes(stats.totals.totalSizeBytes)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Access Count</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-2xl font-semibold">{stats.totals.totalAccessCount.toLocaleString()}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Generated At</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm font-medium text-zinc-700">
                {new Date(stats.generatedAt).toLocaleString()}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Category</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {categoryEntries.length === 0 && <p className="text-sm text-zinc-500">No category stats found.</p>}

              {categoryEntries.map(([key, value]) => (
                <article key={key} className="rounded-lg border border-zinc-200 p-3">
                  <p className="font-semibold text-zinc-900">{key}</p>
                  <p className="mt-1 text-sm text-zinc-600">Files: {value.totalFiles}</p>
                  <p className="text-sm text-zinc-600">Size: {formatBytes(value.totalSizeBytes)}</p>
                  <p className="text-sm text-zinc-600">Access: {value.totalAccessCount.toLocaleString()}</p>
                </article>
              ))}
            </CardContent>
          </Card>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Accessed Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.topAccessedFiles.length === 0 && <p className="text-sm text-zinc-500">No file access data available.</p>}

                {stats.topAccessedFiles.map((file) => (
                  <article key={file.id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-medium text-zinc-900">{file.originalName}</p>
                      <Badge variant="secondary">{file.category}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{file.id}</p>
                    <p className="mt-1 text-sm text-zinc-600">Access count: {file.accessCount.toLocaleString()}</p>
                    <p className="text-sm text-zinc-600">Size: {formatBytes(file.sizeBytes)}</p>
                    <a href={file.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-(--accent) hover:underline">
                      Open file
                    </a>
                  </article>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-4 w-4" /> Recent Uploads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.recentUploads.length === 0 && <p className="text-sm text-zinc-500">No recent uploads found.</p>}

                {stats.recentUploads.map((file) => (
                  <article key={file.id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-medium text-zinc-900">{file.originalName}</p>
                      <Badge variant="outline">{file.category}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{file.id}</p>
                    <p className="mt-1 text-sm text-zinc-600">Uploaded: {new Date(file.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-zinc-600">Size: {formatBytes(file.sizeBytes)}</p>
                    <a href={file.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-(--accent) hover:underline">
                      Open file
                    </a>
                  </article>
                ))}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
