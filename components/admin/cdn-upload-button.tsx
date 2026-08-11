"use client";

import { useRef, useState } from "react";
import { Copy, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CdnUploadButton() {
  const { token } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setUploadedUrl(response.item.url);
      setOpen(true);
      toast.success("File uploaded successfully");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "CDN upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function copyUrl() {
    if (!uploadedUrl) {
      return;
    }

    try {
      if (!navigator.clipboard) {
        toast.error("Clipboard not available");
        return;
      }
      await navigator.clipboard.writeText(uploadedUrl);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Unable to copy URL");
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isUploading}
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0] ?? null;
          input.value = "";
          await handleUpload(file);
        }}
      />

      <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
        <Upload className="h-4 w-4" /> {isUploading ? "Uploading..." : "Upload Asset"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Complete</DialogTitle>
            <DialogDescription>
              Your file is now available via this access URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Access URL</p>
            <Input value={uploadedUrl ?? ""} readOnly />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="button" variant="secondary" onClick={copyUrl} disabled={!uploadedUrl}>
              <Copy className="h-4 w-4" /> Copy URL
            </Button>
            <Button type="button" asChild disabled={!uploadedUrl}>
              <a href={uploadedUrl ?? "#"} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open URL
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
